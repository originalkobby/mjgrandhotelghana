import { supabase } from "@/integrations/supabase/client";

interface BookingRow {
  room_id: string;
  check_in: string;
  check_out: string;
}

async function getBooking(bookingId: string): Promise<BookingRow | null> {
  const { data } = await supabase
    .from("bookings")
    .select("room_id, check_in, check_out")
    .eq("id", bookingId)
    .single();
  return (data as BookingRow) ?? null;
}

function* eachNight(checkIn: string, checkOut: string) {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  const d = new Date(ci);
  while (d < co) {
    yield d.toISOString().split("T")[0];
    d.setDate(d.getDate() + 1);
  }
}

/**
 * Decrement room_inventory.booked_count for each night between check_in and check_out.
 * Clamped at 0 — never goes negative. Returns the number of nights released.
 */
export async function releaseInventory(bookingId: string): Promise<number> {
  const booking = await getBooking(bookingId);
  if (!booking) return 0;

  let released = 0;
  for (const dateStr of eachNight(booking.check_in, booking.check_out)) {
    const { data: inv } = await supabase
      .from("room_inventory")
      .select("id, booked_count")
      .eq("room_id", booking.room_id)
      .eq("date", dateStr)
      .maybeSingle();

    if (inv && inv.booked_count > 0) {
      await supabase
        .from("room_inventory")
        .update({ booked_count: inv.booked_count - 1 })
        .eq("id", inv.id);
      released++;
    }
  }
  return released;
}

/**
 * Increment room_inventory.booked_count for each night between check_in and check_out.
 * Inserts a new inventory row when one does not exist. Returns the number of nights reserved.
 */
export async function reserveInventory(bookingId: string): Promise<number> {
  const booking = await getBooking(bookingId);
  if (!booking) return 0;

  let reserved = 0;
  for (const dateStr of eachNight(booking.check_in, booking.check_out)) {
    const { data: inv } = await supabase
      .from("room_inventory")
      .select("id, booked_count, total_count")
      .eq("room_id", booking.room_id)
      .eq("date", dateStr)
      .maybeSingle();

    if (inv) {
      await supabase
        .from("room_inventory")
        .update({ booked_count: inv.booked_count + 1 })
        .eq("id", inv.id);
    } else {
      await supabase.from("room_inventory").insert({
        room_id: booking.room_id,
        date: dateStr,
        booked_count: 1,
        total_count: 1,
      });
    }
    reserved++;
  }
  return reserved;
}

// Bookings that occupy a room (block inventory) for their stay window.
// Only `pending` and `confirmed` block inventory.
const ACTIVE = new Set(["pending", "confirmed"]);
// `completed` (released), cancellations and no-shows free nights back to availability.
const RELEASED = new Set(["cancelled", "no_show", "completed"]);

/**
 * Determine inventory action needed when transitioning between booking statuses.
 * - active → released  : release nights
 * - released → active  : reserve nights
 * - same bucket        : noop
 */
export function getInventoryAction(
  oldStatus: string,
  newStatus: string
): "release" | "reserve" | "none" {
  if (oldStatus === newStatus) return "none";
  const wasActive = ACTIVE.has(oldStatus);
  const wasReleased = RELEASED.has(oldStatus);
  const isActive = ACTIVE.has(newStatus);
  const isReleased = RELEASED.has(newStatus);

  if (wasActive && isReleased) return "release";
  if (wasReleased && isActive) return "reserve";
  return "none";
}
