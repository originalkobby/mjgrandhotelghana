// Rider dispatch ranking. Pure and deterministic so it can be unit tested
// without a database.

/** Great-circle distance in km. Kept local so this module stays dependency-free. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export type Candidate = {
  id: string;
  is_active: boolean;
  status: string; // available | busy | offline | suspended
  last_lat: number | null;
  last_lng: number | null;
  open_jobs: number;
};

export type RankedCandidate = Candidate & { distance_km: number | null };

/**
 * Ranks riders for a job: only active, available riders with no open job are
 * eligible. Nearest to the pickup point wins; riders with no known position are
 * ranked last. Workload then rider id break ties so the order is stable.
 */
export function rankRiders(
  candidates: Candidate[],
  origin: { lat: number; lng: number },
  alreadyOffered: string[] = [],
): RankedCandidate[] {
  const skip = new Set(alreadyOffered);
  return candidates
    .filter(
      (c) =>
        c.is_active &&
        c.status === "available" &&
        (c.open_jobs ?? 0) === 0 &&
        !skip.has(c.id),
    )
    .map((c) => ({
      ...c,
      distance_km:
        typeof c.last_lat === "number" && typeof c.last_lng === "number"
          ? Math.round(haversineKm(origin.lat, origin.lng, c.last_lat, c.last_lng) * 100) / 100
          : null,
    }))
    .sort((a, b) => {
      const da = a.distance_km ?? Number.POSITIVE_INFINITY;
      const db = b.distance_km ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      if (a.open_jobs !== b.open_jobs) return a.open_jobs - b.open_jobs;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}

/** Statuses that mean a rider is currently working a job. */
export const ACTIVE_JOB_STATUSES = [
  "rider_assigned",
  "rider_accepted",
  "rider_picked_up",
  "on_the_way",
];
