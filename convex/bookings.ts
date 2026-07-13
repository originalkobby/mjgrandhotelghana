import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Doc, Id } from "./_generated/dataModel";

// Helper to generate reference code
const generateRef = () => "MJ-" + Math.random().toString(36).substring(2, 10).toUpperCase();

// Helper to get current authenticated user from the native 'users' table
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerk_user_id", identity.subject))
      .unique();
  },
});

export const createBooking = mutation({
  args: {
    guest: v.object({
      fullName: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    booking: v.object({
      roomId: v.id("rooms"), // Native ID
      checkIn: v.string(),
      checkOut: v.string(),
      adults: v.number(),
      children: v.number(),
      promoCode: v.optional(v.string()),
      specialRequests: v.optional(v.string()),
      arrivalTime: v.optional(v.string()),
      nationality: v.optional(v.string()),
      flightItinerary: v.optional(v.string()),
    }),
    addOns: v.array(v.object({
      id: v.id("add_ons"), // Native ID
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { guest, booking, addOns } = args;

    // 1. Validate Room
    const room = await ctx.db.get(booking.roomId);
    if (!room || !room.is_active) {
      throw new Error("Room not found or inactive");
    }

    // 2. Calculate Dates
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const dates: string[] = [];
    const d = new Date(checkInDate);
    while (d < checkOutDate) {
      dates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    // 3. Check Inventory and Calculate Base Total
    let baseTotalGhs = 0;
    for (const date of dates) {
      const inv = await ctx.db
        .query("room_inventory")
        .withIndex("by_room_date", (q) => q.eq("room_id", booking.roomId).eq("date", date))
        .first();

      if (inv?.is_closed) throw new Error(`Room is closed on ${date}`);
      if (inv && inv.booked_count >= inv.total_count) throw new Error(`Room not available on ${date}`);
      
      baseTotalGhs += inv?.rate_override ?? room.base_price_ghs;
    }

    // 4. Calculate Add-ons
    const avgNightlyRate = baseTotalGhs / dates.length;
    let addOnsTotalGhs = 0;
    const validatedAddOns = [];
    
    for (const a of addOns) {
      const dbAddOn = await ctx.db.get(a.id);
      if (!dbAddOn || !dbAddOn.is_active) continue;

      const isDynamic = ["Early Check-in", "Late Checkout"].includes(dbAddOn.name);
      const unitPrice = isDynamic ? avgNightlyRate / 2 : dbAddOn.price_ghs;
      const total = unitPrice * a.quantity;
      
      addOnsTotalGhs += total;
      validatedAddOns.push({
        add_on_id: a.id,
        quantity: a.quantity,
        unit_price_ghs: unitPrice,
        total_price_ghs: total,
      });
    }

    // 5. Promo Code
    let discountGhs = 0;
    if (booking.promoCode) {
      const promo = await ctx.db
        .query("promotions")
        .withIndex("by_code", (q) => q.eq("code", booking.promoCode!.toUpperCase()))
        .first();

      if (promo && promo.is_active) {
        const now = new Date().toISOString().split("T")[0];
        const isValid = (!promo.valid_from || promo.valid_from <= now) &&
                        (!promo.valid_to || promo.valid_to >= now);
        
        if (isValid) {
          discountGhs = (baseTotalGhs * promo.discount_percentage) / 100;
        }
      }
    }

    // 6. Upsert Guest
    let guestDoc = await ctx.db
      .query("guests")
      .withIndex("by_email", (q) => q.eq("email", guest.email))
      .first();

    if (guestDoc) {
      if (booking.flightItinerary) {
        await ctx.db.patch(guestDoc._id, { 
          preferences: { ...(guestDoc.preferences || {}), flight_itinerary: booking.flightItinerary } 
        });
      }
    } else {
      const guestId = await ctx.db.insert("guests", {
        full_name: guest.fullName,
        email: guest.email,
        phone: guest.phone,
        preferences: booking.flightItinerary ? { flight_itinerary: booking.flightItinerary } : {},
        created_at: new Date().toISOString(),
      });
      guestDoc = (await ctx.db.get(guestId))!;
    }

    // 7. Create Booking
    const finalTotal = baseTotalGhs + addOnsTotalGhs - discountGhs;
    const refCode = generateRef();
    const now = new Date().toISOString();

    const bookingId = await ctx.db.insert("bookings", {
      reference_code: refCode,
      guest_id: guestDoc._id,
      room_id: room._id,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      adults: booking.adults,
      children: booking.children,
      status: "confirmed",
      payment_status: "pending",
      base_total_ghs: baseTotalGhs,
      add_ons_total_ghs: addOnsTotalGhs,
      final_total_ghs: finalTotal,
      promo_code: booking.promoCode,
      special_requests: booking.specialRequests,
      arrival_time: booking.arrivalTime,
      nationality: booking.nationality,
      created_at: now,
      updated_at: now,
    });

    // 8. Update Inventory
    for (const date of dates) {
      const inv = await ctx.db
        .query("room_inventory")
        .withIndex("by_room_date", (q) => q.eq("room_id", room._id).eq("date", date))
        .first();
      
      if (inv) {
        await ctx.db.patch(inv._id, { booked_count: inv.booked_count + 1 });
      } else {
        await ctx.db.insert("room_inventory", {
          room_id: room._id,
          date,
          total_count: room.total_units,
          booked_count: 1,
          is_closed: false,
          min_stay: 1,
        });
      }
    }

    // 9. Insert Booking Add-ons
    for (const va of validatedAddOns) {
      await ctx.db.insert("booking_add_ons", {
        booking_id: bookingId,
        add_on_id: va.add_on_id,
        quantity: va.quantity,
        price_at_booking: va.unit_price_ghs,
      });
    }

    return {
      bookingId,
      reference: refCode,
      finalTotal,
    };
  },
});

export const getBookingByReference = query({
  args: { reference: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("by_reference", (q) => q.eq("reference_code", args.reference))
      .first();
    
    if (!booking) return null;

    const guest = await ctx.db.get(booking.guest_id);
    const room = await ctx.db.get(booking.room_id);
    const addOns = await ctx.db
      .query("booking_add_ons")
      .withIndex("by_booking", (q) => q.eq("booking_id", booking._id))
      .collect();

    return { ...booking, guest, room, addOns };
  },
});
