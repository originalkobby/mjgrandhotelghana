import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const OTA_WEBHOOK_SECRET = Deno.env.get("OTA_WEBHOOK_SECRET") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ota-booking-webhook`;

const samplePayload = {
  event_type: "new",
  source: "booking.com",
  ota_reference: "TEST-" + Date.now(),
  check_in: "2026-06-01",
  check_out: "2026-06-03",
  adults: 2,
  children: 0,
  guest_name: "Test Guest",
  guest_email: "test-ota@example.com",
  total_amount: 1600,
};

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.test("Layer 1: 401 with invalid secret", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-webhook-secret": "wrong-secret" },
    body: JSON.stringify(samplePayload),
  });
  const body = await res.text();
  assertEquals(res.status, 401, `Expected 401, got ${res.status}: ${body}`);
});

Deno.test("Layer 1: 200 with valid secret (no HMAC)", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-webhook-secret": OTA_WEBHOOK_SECRET },
    body: JSON.stringify({ ...samplePayload, ota_reference: "TEST-L1-" + Date.now() }),
  });
  const body = await res.text();
  assertEquals(res.status, 200, `Expected 200, got ${res.status}: ${body}`);
});

Deno.test("Layer 2: 401 with valid secret but INVALID HMAC", async () => {
  const bodyStr = JSON.stringify({ ...samplePayload, ota_reference: "TEST-BAD-HMAC-" + Date.now() });
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": OTA_WEBHOOK_SECRET,
      "x-webhook-signature": "sha256=0000000000000000000000000000000000000000000000000000000000000000",
    },
    body: bodyStr,
  });
  const body = await res.text();
  assertEquals(res.status, 401, `Expected 401 for bad HMAC, got ${res.status}: ${body}`);
});

Deno.test("Layer 2: 200 with valid secret AND valid HMAC", async () => {
  const bodyStr = JSON.stringify({ ...samplePayload, ota_reference: "TEST-GOOD-HMAC-" + Date.now() });
  const validSig = await hmacSha256(OTA_WEBHOOK_SECRET, bodyStr);
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": OTA_WEBHOOK_SECRET,
      "x-webhook-signature": `sha256=${validSig}`,
    },
    body: bodyStr,
  });
  const body = await res.text();
  assertEquals(res.status, 200, `Expected 200 for valid HMAC, got ${res.status}: ${body}`);
});
