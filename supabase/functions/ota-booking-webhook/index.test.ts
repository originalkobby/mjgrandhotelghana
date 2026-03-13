import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const OTA_WEBHOOK_SECRET = Deno.env.get("OTA_WEBHOOK_SECRET") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ota-booking-webhook`;

const samplePayload = {
  event_type: "new",
  source: "booking.com",
  ota_reference: "TEST-" + Date.now(),
  room_name: "Deluxe",
  check_in: "2026-06-01",
  check_out: "2026-06-03",
  adults: 2,
  children: 0,
  guest_name: "Test Guest",
  guest_email: "test-ota@example.com",
  total_amount: 1600,
};

Deno.test("401 with invalid secret", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": "wrong-secret-value",
    },
    body: JSON.stringify(samplePayload),
  });
  const body = await res.text();
  assertEquals(res.status, 401, `Expected 401, got ${res.status}: ${body}`);
});

Deno.test("200 with valid secret", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": OTA_WEBHOOK_SECRET,
    },
    body: JSON.stringify(samplePayload),
  });
  const body = await res.text();
  assertEquals(res.status, 200, `Expected 200, got ${res.status}: ${body}`);
});
