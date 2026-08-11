import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  code?: string;
  roomId?: string;
  baseTotalGhs?: number;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
}

function resolveNights(checkIn?: string, checkOut?: string, nights?: number): number | null {
  if (checkIn && checkOut) {
    const inMs = Date.parse(checkIn);
    const outMs = Date.parse(checkOut);
    if (!Number.isNaN(inMs) && !Number.isNaN(outMs)) {
      const n = Math.round((outMs - inMs) / 86400000);
      if (n > 0) return n;
    }
  }
  if (typeof nights === "number" && nights > 0) return Math.round(nights);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code, roomId, baseTotalGhs, nights, checkIn, checkOut }: Body = await req.json();
    if (!code || typeof code !== "string" || !roomId || typeof baseTotalGhs !== "number" || baseTotalGhs <= 0) {
      return json({ valid: false, reason: "invalid_input" });
    }


    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: promo } = await supabase
      .from("promotions")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (!promo) return json({ valid: false, reason: "not_found" });
    if (!promo.is_active) return json({ valid: false, reason: "inactive" });

    const now = new Date().toISOString().split("T")[0];
    if (promo.start_date && promo.start_date > now) return json({ valid: false, reason: "not_started" });
    if (promo.end_date && promo.end_date < now) return json({ valid: false, reason: "expired" });
    if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return json({ valid: false, reason: "usage_limit" });
    if (promo.room_restrictions && promo.room_restrictions.length > 0 && !promo.room_restrictions.includes(roomId)) {
      return json({ valid: false, reason: "room_not_allowed" });
    }

    let discountGhs = 0;
    let resolvedNights: number | null = null;
    if (promo.discount_type === "percentage") {
      discountGhs = Math.round((baseTotalGhs * promo.discount_value) / 100);
    } else if (promo.discount_type === "fixed") {
      discountGhs = Math.min(promo.discount_value, baseTotalGhs);
    } else if (promo.discount_type === "flat_rate") {
      resolvedNights = resolveNights(checkIn, checkOut, nights);
      if (!resolvedNights) return json({ valid: false, reason: "invalid_dates" });
      const flatTotal = promo.discount_value * resolvedNights;
      // Never increase the price: only discount when the flat rate is cheaper.
      discountGhs = Math.max(0, Math.round(baseTotalGhs - flatTotal));
    }

    return json({
      valid: true,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      discountGhs,
      nights: resolvedNights,
      description: promo.description ?? null,

    });
  } catch (err) {
    console.error("validate-promo error", err);
    return json({ valid: false, reason: "error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
