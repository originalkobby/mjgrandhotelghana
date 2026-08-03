/** Shared booking lifecycle helpers used by the admin dashboard. */

export type LifecycleBooking = {
  status: string;
  payment_status?: string | null;
  payment_method?: string | null;
  check_in?: string | null;
  check_out?: string | null;
};

/** Human-friendly label for a raw status/enum value. */
export function formatBookingLabel(value: string | null | undefined): string {
  if (!value) return "--";
  return value
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export interface PaymentDisplay {
  /** Whether the payment cell should render as a dash. */
  isDash: boolean;
  /** Payment label, e.g. "paid", "pending", "refunded". */
  label: string;
  /** The status shown in the status column after lifecycle rules are applied. */
  effectiveStatus: string;
}

/**
 * Derives the payment label and effective booking status.
 * A paid booking that is still "pending" is displayed as "confirmed".
 */
export function getPaymentDisplay(b: LifecycleBooking): PaymentDisplay {
  const payment = (b.payment_status ?? "").toLowerCase();
  const status = (b.status ?? "").toLowerCase();

  const isDash = !payment || payment === "unpaid" || status === "cancelled";

  let effectiveStatus = status;
  if (payment === "paid" && (status === "pending" || status === "")) {
    effectiveStatus = "confirmed";
  }

  return { isDash, label: payment || "unpaid", effectiveStatus };
}
