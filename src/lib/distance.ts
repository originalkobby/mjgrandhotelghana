/**
 * Great-circle distance in km — mirrors the Haversine used by the dispatch
 * engine (`supabase/functions/_shared/dispatch.ts`) so the admin UI shows the
 * same distances the engine ranks riders by.
 */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Formats a km value for display, or a placeholder when unknown. */
export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || !Number.isFinite(km)) return "location unknown";
  return `${Math.round(km * 100) / 100} km`;
}
