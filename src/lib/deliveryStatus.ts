export type DeliveryStatus =
  | "pending_review"
  | "review_rejected"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "rider_assigned"
  | "rider_accepted"
  | "rider_picked_up"
  | "on_the_way"
  | "delivered"
  | "cancelled"
  | "failed";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending_review: "Awaiting review",
  review_rejected: "Out of range",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for pickup",
  rider_assigned: "Rider assigned",
  rider_accepted: "Rider accepted",
  rider_picked_up: "Picked up",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
  failed: "Failed",
};

export const DELIVERY_STATUS_TONE: Record<DeliveryStatus, string> = {
  pending_review: "bg-amber-100 text-amber-800 border-amber-300",
  review_rejected: "bg-red-100 text-red-800 border-red-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  preparing: "bg-blue-100 text-blue-800 border-blue-300",
  ready_for_pickup: "bg-indigo-100 text-indigo-800 border-indigo-300",
  rider_assigned: "bg-purple-100 text-purple-800 border-purple-300",
  rider_accepted: "bg-purple-100 text-purple-800 border-purple-300",
  rider_picked_up: "bg-teal-100 text-teal-800 border-teal-300",
  on_the_way: "bg-teal-100 text-teal-800 border-teal-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-neutral-200 text-neutral-700 border-neutral-300",
  failed: "bg-red-100 text-red-800 border-red-300",
};

/** Customer-facing progress steps used on the tracking page. */
export const TRACKING_STEPS: { key: DeliveryStatus; label: string; blurb: string }[] = [
  { key: "confirmed", label: "Confirmed", blurb: "The restaurant accepted your order" },
  { key: "preparing", label: "Preparing", blurb: "Our chefs are cooking" },
  { key: "ready_for_pickup", label: "Ready", blurb: "Packed and waiting for a rider" },
  { key: "rider_picked_up", label: "Picked up", blurb: "Your rider has your order" },
  { key: "on_the_way", label: "On the way", blurb: "Heading to your address" },
  { key: "delivered", label: "Delivered", blurb: "Enjoy your meal" },
];

const ORDER: DeliveryStatus[] = [
  "pending_review",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "rider_accepted",
  "rider_picked_up",
  "on_the_way",
  "delivered",
];

export function stepIndex(status: DeliveryStatus): number {
  const map: Partial<Record<DeliveryStatus, number>> = {
    pending_review: -1,
    confirmed: 0,
    preparing: 1,
    ready_for_pickup: 2,
    rider_assigned: 2,
    rider_accepted: 2,
    rider_picked_up: 3,
    on_the_way: 4,
    delivered: 5,
  };
  return map[status] ?? -1;
}

export function isClosed(status: DeliveryStatus) {
  return ["delivered", "cancelled", "review_rejected", "failed"].includes(status);
}

export function progressRank(status: DeliveryStatus) {
  return ORDER.indexOf(status);
}
