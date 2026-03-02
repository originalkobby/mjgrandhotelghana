import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/* ─── Pricing Configuration ─── */

// Occupancy-based tiers: when occupancy >= threshold, multiply by factor
const OCCUPANCY_TIERS = [
  { threshold: 0.9, factor: 1.35, label: "Peak (90%+)" },
  { threshold: 0.75, factor: 1.2, label: "High (75-90%)" },
  { threshold: 0.5, factor: 1.05, label: "Moderate (50-75%)" },
  { threshold: 0.25, factor: 1.0, label: "Normal (25-50%)" },
  { threshold: 0.0, factor: 0.9, label: "Low (<25%)" },
];

// Day-of-week multipliers (0 = Sunday, 6 = Saturday)
const DAY_MULTIPLIERS: Record<number, number> = {
  0: 1.0, // Sunday
  1: 0.95, // Monday
  2: 0.95, // Tuesday
  3: 0.95, // Wednesday
  4: 1.0, // Thursday
  5: 1.15, // Friday
  6: 1.2, // Saturday
};

// Minimum and maximum rate bounds (percentage of base price)
const MIN_RATE_FACTOR = 0.7;
const MAX_RATE_FACTOR = 2.0;

/* ─── Helpers ─── */

function getOccupancyFactor(occupancyRate: number): number {
  for (const tier of OCCUPANCY_TIERS) {
    if (occupancyRate >= tier.threshold) return tier.factor;
  }
  return 1.0;
}

function getDayFactor(dateStr: string): number {
  const day = new Date(dateStr + "T00:00:00Z").getUTCDay();
  return DAY_MULTIPLIERS[day] ?? 1.0;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/* ─── Main Handler ─── */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Parse optional body for date range (defaults to next 30 days)
    let daysAhead = 30;
    try {
      const body = await req.json();
      if (body.days_ahead && typeof body.days_ahead === "number") {
        daysAhead = Math.min(Math.max(body.days_ahead, 1), 90);
      }
    } catch {
      // No body or invalid JSON — use defaults
    }

    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today.getTime() + daysAhead * 86400000)
      .toISOString()
      .split("T")[0];

    // 1. Fetch all active rooms
    const { data: rooms, error: roomsErr } = await supabase
      .from("rooms")
      .select("id, base_price_ghs")
      .eq("is_active", true);

    if (roomsErr) throw roomsErr;
    if (!rooms?.length) {
      return new Response(
        JSON.stringify({ message: "No active rooms", updated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch seasonal pricing rules
    const { data: seasons } = await supabase
      .from("seasonal_pricing")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    // Build a lookup: roomId -> [{start, end, multiplier, override}]
    const seasonMap = new Map<
      string,
      { start: string; end: string; multiplier: number; override: number | null }[]
    >();
    for (const s of seasons ?? []) {
      const list = seasonMap.get(s.room_id) ?? [];
      list.push({
        start: s.start_date,
        end: s.end_date,
        multiplier: s.rate_multiplier ?? 1.0,
        override: s.rate_override,
      });
      seasonMap.set(s.room_id, list);
    }

    // 3. Fetch existing inventory rows for the window
    const { data: inventory } = await supabase
      .from("room_inventory")
      .select("id, room_id, date, total_count, booked_count, is_closed, rate_override")
      .gte("date", startDate)
      .lte("date", endDate);

    // Index inventory by "room_id|date"
    const invMap = new Map<string, typeof inventory extends (infer T)[] ? T : never>();
    for (const row of inventory ?? []) {
      invMap.set(`${row.room_id}|${row.date}`, row);
    }

    // 4. Calculate dynamic rate for each room × date
    let updatedCount = 0;
    const upserts: {
      id?: string;
      room_id: string;
      date: string;
      rate_override: number;
      total_count: number;
      booked_count: number;
      is_closed: boolean;
    }[] = [];

    for (const room of rooms) {
      const basePrice = Number(room.base_price_ghs);

      for (let d = 0; d < daysAhead; d++) {
        const dateObj = new Date(today.getTime() + d * 86400000);
        const dateStr = dateObj.toISOString().split("T")[0];
        const key = `${room.id}|${dateStr}`;

        const inv = invMap.get(key);
        const totalCount = inv?.total_count ?? 1;
        const bookedCount = inv?.booked_count ?? 0;
        const isClosed = inv?.is_closed ?? false;

        if (isClosed) continue;

        // Occupancy factor
        const occupancy = totalCount > 0 ? bookedCount / totalCount : 0;
        const occFactor = getOccupancyFactor(occupancy);

        // Day-of-week factor
        const dayFactor = getDayFactor(dateStr);

        // Seasonal factor
        let seasonFactor = 1.0;
        let seasonOverride: number | null = null;
        const roomSeasons = seasonMap.get(room.id) ?? [];
        for (const s of roomSeasons) {
          if (dateStr >= s.start && dateStr <= s.end) {
            if (s.override !== null) {
              seasonOverride = Number(s.override);
            } else {
              seasonFactor = Number(s.multiplier);
            }
            break; // first matching season wins
          }
        }

        // Calculate final rate
        let rate: number;
        if (seasonOverride !== null) {
          // Season has a hard override — apply occupancy & day on top
          rate = seasonOverride * occFactor * dayFactor;
        } else {
          rate = basePrice * seasonFactor * occFactor * dayFactor;
        }

        // Clamp to bounds
        rate = clamp(rate, basePrice * MIN_RATE_FACTOR, basePrice * MAX_RATE_FACTOR);
        rate = Math.round(rate * 100) / 100; // round to 2 decimals

        upserts.push({
          ...(inv?.id ? { id: inv.id } : {}),
          room_id: room.id,
          date: dateStr,
          rate_override: rate,
          total_count: totalCount,
          booked_count: bookedCount,
          is_closed: isClosed,
        });
      }
    }

    // 5. Batch upsert (Supabase handles ON CONFLICT via id or unique constraint)
    // We'll do batches of 500 rows
    const BATCH = 500;
    for (let i = 0; i < upserts.length; i += BATCH) {
      const batch = upserts.slice(i, i + BATCH);

      // Separate inserts (no id) and updates (have id)
      const toUpdate = batch.filter((r) => r.id);
      const toInsert = batch.filter((r) => !r.id);

      if (toUpdate.length) {
        const { error } = await supabase
          .from("room_inventory")
          .upsert(toUpdate, { onConflict: "id" });
        if (error) console.error("Update batch error:", error);
        else updatedCount += toUpdate.length;
      }

      if (toInsert.length) {
        // For new rows, use room_id + date as conflict target
        const { error } = await supabase.from("room_inventory").insert(
          toInsert.map(({ id: _id, ...rest }) => rest)
        );
        if (error) console.error("Insert batch error:", error);
        else updatedCount += toInsert.length;
      }
    }

    const summary = {
      message: "Dynamic pricing engine completed",
      updated: updatedCount,
      rooms: rooms.length,
      date_range: { from: startDate, to: endDate },
      config: {
        occupancy_tiers: OCCUPANCY_TIERS,
        day_multipliers: DAY_MULTIPLIERS,
        rate_bounds: { min: MIN_RATE_FACTOR, max: MAX_RATE_FACTOR },
      },
    };

    console.log("Pricing run:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Dynamic pricing error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
