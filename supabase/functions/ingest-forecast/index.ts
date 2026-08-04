import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const authHeader = req.headers.get("x-forecast-key");
    const expectedKey = Deno.env.get("OTA_WEBHOOK_SECRET"); // reuse existing secret for now
    if (!authHeader || authHeader !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { forecasts, alerts, model_version } = body;

    let forecastCount = 0;
    let alertCount = 0;

    // Ingest forecasts
    if (Array.isArray(forecasts) && forecasts.length > 0) {
      const rows = forecasts.map((f: any) => ({
        forecast_date: f.date,
        room_id: f.room_id || null,
        expected_occupancy: f.expected_occupancy,
        recommended_price: f.recommended_price || null,
        predicted_revenue: f.predicted_revenue || null,
        confidence_level: f.confidence_level || 0.8,
        model_version: model_version || "v1",
      }));

      // Upsert in batches of 500
      for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500);
        const { error } = await supabase
          .from("revenue_forecasts")
          .upsert(batch, { onConflict: "forecast_date,room_id" });
        if (error) {
          console.error("Forecast upsert error:", error);
        } else {
          forecastCount += batch.length;
        }
      }
    }

    // Ingest demand alerts
    if (Array.isArray(alerts) && alerts.length > 0) {
      const alertRows = alerts.map((a: any) => ({
        alert_type: a.alert_type,
        severity: a.severity || "medium",
        title: a.title,
        description: a.description || null,
        date_start: a.date_start,
        date_end: a.date_end,
        room_id: a.room_id || null,
        recommended_action: a.recommended_action || null,
      }));

      const { error } = await supabase
        .from("demand_alerts")
        .insert(alertRows);
      if (error) {
        console.error("Alert insert error:", error);
      } else {
        alertCount = alertRows.length;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Forecast data ingested",
        forecasts_upserted: forecastCount,
        alerts_created: alertCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Ingest error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
