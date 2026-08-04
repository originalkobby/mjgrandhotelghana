// Shared helper to dual-write booking events to Convex.
// Fire-and-forget: failures are logged but never break the Supabase flow.

const CONVEX_SYNC_URL = Deno.env.get("CONVEX_SYNC_URL");
const CONVEX_SYNC_SECRET = Deno.env.get("CONVEX_SYNC_SECRET");

export type ConvexSyncEvent =
  | "booking.created"
  | "booking.updated"
  | "booking.cancelled"
  | "booking.extended"
  | "booking.payment_updated"
  | "booking.status_changed";

export interface ConvexSyncPayload {
  event: ConvexSyncEvent;
  bookingId?: string;
  referenceCode?: string;
  data?: Record<string, unknown>;
}

async function postToConvex(payload: ConvexSyncPayload): Promise<void> {
  if (!CONVEX_SYNC_URL || !CONVEX_SYNC_SECRET) {
    console.warn("[convexSync] CONVEX_SYNC_URL or CONVEX_SYNC_SECRET not set; skipping");
    return;
  }

  try {
    const res = await fetch(CONVEX_SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sync-secret": CONVEX_SYNC_SECRET,
      },
      body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error(`[convexSync] ${payload.event} failed: ${res.status} ${txt}`);
    } else {
      console.log(`[convexSync] ${payload.event} ok (${res.status})`);
    }
  } catch (err) {
    console.error(`[convexSync] ${payload.event} error:`, err);
  }
}

/**
 * Fire-and-forget dual-write to Convex.
 *
 * IMPORTANT: In Supabase Edge Runtime, background promises are cancelled once
 * the handler returns a Response. We hand the promise to `EdgeRuntime.waitUntil`
 * so the POST actually completes after the response is sent. If waitUntil is not
 * available (local Deno, tests), we await directly.
 */
export function syncToConvex(payload: ConvexSyncPayload): void {
  const promise = postToConvex(payload);
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime;
  if (runtime && typeof runtime.waitUntil === "function") {
    runtime.waitUntil(promise);
  } else {
    // Best-effort: swallow to keep signature void.
    promise.catch(() => {});
  }
}
