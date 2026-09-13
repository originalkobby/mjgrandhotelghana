// Live ETA for an in-flight delivery. Pure and deterministic so it can be unit
// tested without a database.

/** Great-circle distance in km. Kept local so this module stays dependency-free. */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** A position fix older than this is not trusted for a live countdown. */
export const MAX_FIX_AGE_MS = 5 * 60_000;

/** Sanity bounds on the implied average speed (km/h) used to convert km to minutes. */
const MIN_SPEED_KMH = 8;
const MAX_SPEED_KMH = 45;

export type LiveEtaInput = {
  riderLat: number | null | undefined;
  riderLng: number | null | undefined;
  /** ISO timestamp of the rider's last position fix. */
  recordedAt: string | null | undefined;
  destLat: number;
  destLng: number;
  /** The trip distance and travel time computed when the delivery was quoted. */
  distanceKm: number;
  travelMinutes: number;
  /** Padding applied to every published estimate. */
  bufferMinutes: number;
  /** Injectable for tests. */
  now?: number;
};

/**
 * Minutes until the rider reaches the customer, or null when there is no usable
 * recent position fix (the caller then falls back to the quoted range).
 */
export function liveEtaMinutes(input: LiveEtaInput): number | null {
  const { riderLat, riderLng, recordedAt, destLat, destLng } = input;
  if (
    riderLat === null ||
    riderLat === undefined ||
    riderLng === null ||
    riderLng === undefined ||
    !Number.isFinite(riderLat) ||
    !Number.isFinite(riderLng) ||
    !recordedAt
  ) {
    return null;
  }

  const fixTime = Date.parse(recordedAt);
  if (!Number.isFinite(fixTime)) return null;
  const now = input.now ?? Date.now();
  if (now - fixTime > MAX_FIX_AGE_MS) return null;

  const remainingKm = haversineKm(riderLat, riderLng, destLat, destLng);

  const implied =
    input.travelMinutes > 0 && input.distanceKm > 0
      ? (input.distanceKm / input.travelMinutes) * 60
      : MIN_SPEED_KMH;
  const speedKmh = Math.min(MAX_SPEED_KMH, Math.max(MIN_SPEED_KMH, implied));

  const minutes = (remainingKm / speedKmh) * 60 + Math.max(0, input.bufferMinutes);
  return Math.max(1, Math.round(minutes));
}
