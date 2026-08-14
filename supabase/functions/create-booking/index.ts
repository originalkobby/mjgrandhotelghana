import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncToConvex } from "../_shared/convexSync.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// In-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

const MAX_GROUP_ROOMS = 20;

function checkRateLimit(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function newRef() {
  return "MJ-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { guest, booking, addOns, rooms } = await req.json();

    // --- Validate email ---
    if (!guest?.email || typeof guest.email !== "string") {
      return json({ error: "Valid email is required" }, 400);
    }

    if (!checkRateLimit(guest.email)) {
      return json({ error: "Too many booking requests. Please try again later." }, 429);
    }

    if (!booking?.checkIn || !booking?.checkOut) {
      return json({ error: "checkIn and checkOut are required" }, 400);
    }

    // --- Normalise the requested rooms (single-room payload stays supported) ---
    let requested: { roomId: string; quantity: number }[] = [];
    if (Array.isArray(rooms) && rooms.length > 0) {
      for (const r of rooms) {
        const qty = Math.floor(Number(r?.quantity) || 0);
        if (!r?.roomId || typeof r.roomId !== "string" || qty <= 0) continue;
        requested.push({ roomId: r.roomId, quantity: qty });
      }
    } else if (booking?.roomId) {
      requested = [{ roomId: booking.roomId, quantity: 1 }];
    }

    if (requested.length === 0) {
      return json({ error: "At least one room is required" }, 400);
    }

    const totalUnits = requested.reduce((s, r) => s + r.quantity, 0);
    if (totalUnits > MAX_GROUP_ROOMS) {
      return json({ error: `A group booking can include at most ${MAX_GROUP_ROOMS} rooms` }, 400);
    }

    const isGroup = totalUnits > 1;

    // --- Nights in the stay window ---
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const dates: string[] = [];
    const d = new Date(checkInDate);
    while (d < checkOutDate) {
      dates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }
    if (dates.length === 0) {
      return json({ error: "Invalid date range" }, 400);
    }

    // --- Load rooms + inventory, validate availability for the FULL group first ---
    const roomIds = requested.map((r) => r.roomId);
    const { data: roomRows } = await supabase
      .from("rooms")
      .select("id, name, base_price_ghs, is_active, total_units")
      .in("id", roomIds);

    const roomMap = new Map((roomRows || []).map((r) => [r.id, r]));

    const { data: inventoryRows } = await supabase
      .from("room_inventory")
      .select("room_id, date, rate_override, booked_count, total_count, is_closed")
      .in("room_id", roomIds)
      .in("date", dates);

    const invKey = (roomId: string, date: string) => `${roomId}|${date}`;
    const invMap = new Map(
      (inventoryRows || []).map((i) => [invKey(i.room_id, i.date), i])
    );

    // Per-room-unit base totals
    const perRoomBase = new Map<string, number>();

    for (const req of requested) {
      const room = roomMap.get(req.roomId);
      if (!room || !room.is_active) {
        return json({ error: "Room not found or inactive" }, 400);
      }

      let unitBase = 0;
      for (const date of dates) {
        const inv = invMap.get(invKey(req.roomId, date));
        if (inv?.is_closed) {
          return json({ error: `${room.name} is closed on ${date}` }, 409);
        }
        const totalCount = inv?.total_count ?? room.total_units ?? 1;
        const bookedCount = inv?.booked_count ?? 0;
        if (bookedCount + req.quantity > totalCount) {
          return json(
            {
              error: `Only ${Math.max(0, totalCount - bookedCount)} ${room.name} available on ${date}`,
            },
            409
          );
        }
        unitBase += Number(inv?.rate_override ?? room.base_price_ghs);
      }
      perRoomBase.set(req.roomId, unitBase);
    }

    // Group-wide base total across every unit
    const groupBaseTotal = requested.reduce(
      (sum, r) => sum + (perRoomBase.get(r.roomId) ?? 0) * r.quantity,
      0
    );

    // --- Server-side add-on pricing (applied once, on the lead booking) ---
    const avgNightlyRate = groupBaseTotal / (dates.length * totalUnits);
    const DYNAMIC_ADDON_NAMES = ["Early Check-in", "Late Checkout"];

    let addOnsTotalGhs = 0;
    const validatedAddOns: { id: string; quantity: number; unit_price_ghs: number; total_price_ghs: number }[] = [];
    if (addOns && Array.isArray(addOns) && addOns.length > 0) {
      const addOnIds = addOns.map((a: any) => a.id);
      const { data: dbAddOns } = await supabase
        .from("add_ons")
        .select("id, name, price_ghs")
        .in("id", addOnIds)
        .eq("is_active", true);

      const addOnInfoMap = new Map((dbAddOns || []).map((a) => [a.id, a]));

      for (const a of addOns) {
        const dbAddOn = addOnInfoMap.get(a.id);
        if (!dbAddOn) continue;
        const unitPrice = DYNAMIC_ADDON_NAMES.includes(dbAddOn.name)
          ? avgNightlyRate / 2
          : dbAddOn.price_ghs;
        const qty = Math.max(1, Math.min(100, Math.floor(Number(a.quantity) || 1)));
        const total = unitPrice * qty;
        addOnsTotalGhs += total;
        validatedAddOns.push({ id: a.id, quantity: qty, unit_price_ghs: unitPrice, total_price_ghs: total });
      }
    }

    // --- Duplicate detection (single-room bookings only) ---
    if (!isGroup) {
      const { data: recentDuplicate } = await supabase
        .from("bookings")
        .select("id, reference_code")
        .eq("room_id", requested[0].roomId)
        .eq("check_in", booking.checkIn)
        .eq("check_out", booking.checkOut)
        .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .limit(1);

      if (recentDuplicate && recentDuplicate.length > 0) {
        const dupBooking = recentDuplicate[0];
        const { data: dupGuest } = await supabase
          .from("bookings")
          .select("guests!inner(email)")
          .eq("id", dupBooking.id)
          .single();

        if ((dupGuest as any)?.guests?.email?.toLowerCase() === guest.email.toLowerCase().trim()) {
          return json(
            {
              error: "A similar booking was already made recently.",
              existingReference: dupBooking.reference_code,
            },
            409
          );
        }
      }
    }

    // --- Promo code validation (applied to the whole group) ---
    let groupDiscountGhs = 0;
    if (booking.promoCode) {
      const { data: promo } = await supabase
        .from("promotions")
        .select("*")
        .eq("code", booking.promoCode.toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (promo) {
        const now = new Date().toISOString().split("T")[0];
        const validStart = !promo.start_date || promo.start_date <= now;
        const validEnd = !promo.end_date || promo.end_date >= now;
        const withinLimit = !promo.usage_limit || promo.usage_count < promo.usage_limit;
        const roomAllowed =
          !promo.room_restrictions ||
          promo.room_restrictions.length === 0 ||
          roomIds.every((id) => promo.room_restrictions.includes(id));

        if (validStart && validEnd && withinLimit && roomAllowed) {
          if (promo.discount_type === "percentage") {
            groupDiscountGhs = Math.round((groupBaseTotal * promo.discount_value) / 100);
          } else if (promo.discount_type === "fixed") {
            groupDiscountGhs = Math.min(promo.discount_value, groupBaseTotal);
          } else if (promo.discount_type === "flat_rate") {
            // Group flat nightly rate: every room is charged rate x nights
            groupDiscountGhs = groupBaseTotal - promo.discount_value * dates.length * totalUnits;
          }
          groupDiscountGhs = Math.max(0, Math.min(groupDiscountGhs, groupBaseTotal));

          await supabase
            .from("promotions")
            .update({ usage_count: promo.usage_count + 1 })
            .eq("id", promo.id);
        }
      }
    }

    // --- Upsert guest ---
    let guestId: string | null = null;
    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("email", guest.email)
      .maybeSingle();

    if (existingGuest) {
      guestId = existingGuest.id;
      if (booking.flightItinerary) {
        await supabase
          .from("guests")
          .update({ preferences: { flight_itinerary: booking.flightItinerary } })
          .eq("id", existingGuest.id);
      }
    } else {
      const { data: newGuest } = await supabase
        .from("guests")
        .insert({
          full_name: guest.fullName,
          email: guest.email,
          phone: guest.phone,
          preferences: booking.flightItinerary ? { flight_itinerary: booking.flightItinerary } : {},
        })
        .select("id")
        .single();
      guestId = newGuest?.id ?? null;
    }

    // --- Build one booking row per room unit ---
    const groupRef = isGroup ? "GRP-" + Math.random().toString(36).substring(2, 8).toUpperCase() : null;

    interface UnitRow {
      roomId: string;
      roomName: string;
      reference: string;
      baseTotal: number;
      discount: number;
      addOnsTotal: number;
      finalTotal: number;
    }

    const units: UnitRow[] = [];
    for (const req of requested) {
      const room = roomMap.get(req.roomId)!;
      const unitBase = perRoomBase.get(req.roomId) ?? 0;
      for (let i = 0; i < req.quantity; i++) {
        units.push({
          roomId: req.roomId,
          roomName: room.name,
          reference: newRef(),
          baseTotal: unitBase,
          discount: 0,
          addOnsTotal: 0,
          finalTotal: 0,
        });
      }
    }

    // Split the discount proportionally, with any rounding remainder on the lead row
    let allocatedDiscount = 0;
    units.forEach((u, idx) => {
      if (idx === units.length - 1) {
        u.discount = +(groupDiscountGhs - allocatedDiscount).toFixed(2);
      } else {
        const share = groupBaseTotal > 0 ? (u.baseTotal / groupBaseTotal) * groupDiscountGhs : 0;
        u.discount = +share.toFixed(2);
        allocatedDiscount += u.discount;
      }
    });

    // Add-ons are attached to the lead booking only
    if (units.length > 0) units[0].addOnsTotal = addOnsTotalGhs;
    units.forEach((u) => {
      u.finalTotal = Math.max(0, +(u.baseTotal + u.addOnsTotal - u.discount).toFixed(2));
    });

    const insertPayload = units.map((u) => ({
      reference_code: u.reference,
      guest_id: guestId,
      room_id: u.roomId,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      adults: booking.adults,
      children: booking.children,
      base_total_ghs: u.baseTotal,
      add_ons_total_ghs: u.addOnsTotal,
      discount_ghs: u.discount,
      final_total_ghs: u.finalTotal,
      promo_code: booking.promoCode || null,
      special_requests: booking.specialRequests || null,
      arrival_time: booking.arrivalTime || null,
      nationality: booking.nationality || null,
      status: "confirmed",
      payment_status: "pending",
      group_ref: groupRef,
      group_size: isGroup ? units.length : null,
    }));

    const { data: insertedRows, error: bookingError } = await supabase
      .from("bookings")
      .insert(insertPayload)
      .select("id, reference_code, room_id, final_total_ghs");

    if (bookingError || !insertedRows || insertedRows.length === 0) {
      console.error("Booking insert error:", bookingError);
      return json({ error: "Failed to create booking" }, 400);
    }

    // --- Increment room_inventory.booked_count per room per night ---
    for (const req of requested) {
      const room = roomMap.get(req.roomId)!;
      for (const date of dates) {
        const inv = invMap.get(invKey(req.roomId, date));
        if (inv) {
          await supabase
            .from("room_inventory")
            .update({ booked_count: (inv.booked_count || 0) + req.quantity })
            .eq("room_id", req.roomId)
            .eq("date", date);
        } else {
          await supabase.from("room_inventory").insert({
            room_id: req.roomId,
            date,
            total_count: room.total_units ?? req.quantity,
            booked_count: req.quantity,
          });
        }
      }
    }

    // --- Add-ons on the lead booking ---
    const leadRow = insertedRows.find((r) => r.reference_code === units[0].reference) ?? insertedRows[0];
    if (validatedAddOns.length > 0 && leadRow) {
      await supabase.from("booking_add_ons").insert(
        validatedAddOns.map((a) => ({
          booking_id: leadRow.id,
          add_on_id: a.id,
          quantity: a.quantity,
          unit_price_ghs: a.unit_price_ghs,
          total_price_ghs: a.total_price_ghs,
        }))
      );
    }

    // --- Fire-and-forget dual-write to Convex (one event per booking) ---
    for (const row of insertedRows) {
      syncToConvex({
        event: "booking.created",
        bookingId: row.id,
        referenceCode: row.reference_code,
        data: {
          guestId,
          roomId: row.room_id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          adults: booking.adults,
          children: booking.children,
          finalTotalGhs: Number(row.final_total_ghs),
          groupRef,
          groupSize: isGroup ? units.length : null,
          status: "confirmed",
          paymentStatus: "pending",
        },
      });
    }

    const groupTotal = units.reduce((s, u) => s + u.finalTotal, 0);

    return json({
      // `reference` remains the lead booking reference for payment + existing flows
      reference: leadRow.reference_code,
      bookingId: leadRow.id,
      groupRef,
      groupSize: isGroup ? units.length : null,
      bookings: units.map((u) => ({
        reference: u.reference,
        roomName: u.roomName,
        finalTotal: u.finalTotal,
      })),
      discountGhs: groupDiscountGhs,
      finalTotal: groupTotal,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    return json({ error: "An unexpected error occurred" }, 500);
  }
});
