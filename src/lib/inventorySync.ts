import { supabase } from "@/integrations/supabase/client";

/**
 * Inventory adjustments for a booking.
 * These call the shared RPCs so direct, OTA, AI and manual bookings all
 * affect room_inventory identically.
 */

async function callInventoryRpc(fn: "release_booking_inventory" | "reserve_booking_inventory", bookingId: string) {
  const { data, error } = await supabase.rpc(fn as any, { p_booking_id: bookingId });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}

/** Frees the nights held by a booking. Returns the number of nights released. */
export function releaseInventory(bookingId: string): Promise<number> {
  return callInventoryRpc("release_booking_inventory", bookingId);
}

/** Holds the nights for a booking. Returns the number of nights reserved. */
export function reserveInventory(bookingId: string): Promise<number> {
  return callInventoryRpc("reserve_booking_inventory", bookingId);
}

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "checked_in", "completed"]);
const RELEASED_STATUSES = new Set(["cancelled", "no_show", "released", "checked_out"]);

/** Whether a status transition should reserve, release, or do nothing. */
export function getInventoryAction(
  oldStatus: string,
  newStatus: string
): "reserve" | "release" | "none" {
  const wasActive = ACTIVE_STATUSES.has(oldStatus);
  const isActive = ACTIVE_STATUSES.has(newStatus);
  if (wasActive && !isActive && RELEASED_STATUSES.has(newStatus)) return "release";
  if (!wasActive && isActive) return "reserve";
  return "none";
}
