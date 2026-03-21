export interface BookingLifecycleSnapshot {
  check_out: string;
  payment_status: string;
  status: string;
}

const ACTIVE_STATUSES = new Set(["pending", "confirmed"]);

function toDateOnly(value: string) {
  return value.split("T")[0] ?? value;
}

export function hasCheckoutDatePassed(checkOut: string, now = new Date()) {
  return toDateOnly(checkOut) <= now.toISOString().split("T")[0];
}

export function getEffectiveBookingStatus<T extends BookingLifecycleSnapshot>(booking: T, now = new Date()) {
  if (!ACTIVE_STATUSES.has(booking.status) || !hasCheckoutDatePassed(booking.check_out, now)) {
    return booking.status;
  }

  return booking.payment_status === "paid" ? "completed" : "no_show";
}

export function getPaymentDisplay<T extends BookingLifecycleSnapshot>(booking: T, now = new Date()) {
  const effectiveStatus = getEffectiveBookingStatus(booking, now);

  if (effectiveStatus === "cancelled" || effectiveStatus === "no_show") {
    return { effectiveStatus, isDash: true, label: "--" };
  }

  if (effectiveStatus === "completed") {
    return { effectiveStatus, isDash: false, label: "paid" };
  }

  return { effectiveStatus, isDash: false, label: booking.payment_status };
}

export function formatBookingLabel(value: string) {
  return value === "--" ? value : value.replace(/_/g, " ");
}