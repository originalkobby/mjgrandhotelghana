import { describe, expect, it } from "vitest";
import { liveEtaMinutes } from "../../supabase/functions/_shared/eta.ts";

const DEST = { lat: 5.6365, lng: -0.1738 };
const NOW = Date.parse("2026-09-13T18:00:00.000Z");

const base = {
  destLat: DEST.lat,
  destLng: DEST.lng,
  distanceKm: 5.8,
  travelMinutes: 16, // ~21.75 km/h implied
  bufferMinutes: 5,
  now: NOW,
};

describe("liveEtaMinutes", () => {
  it("shrinks as the rider gets closer", () => {
    const far = liveEtaMinutes({
      ...base,
      riderLat: DEST.lat + 0.05,
      riderLng: DEST.lng,
      recordedAt: new Date(NOW - 30_000).toISOString(),
    })!;
    const near = liveEtaMinutes({
      ...base,
      riderLat: DEST.lat + 0.005,
      riderLng: DEST.lng,
      recordedAt: new Date(NOW - 30_000).toISOString(),
    })!;
    expect(far).toBeGreaterThan(near);
    expect(near).toBeGreaterThanOrEqual(base.bufferMinutes);
  });

  it("returns null for a stale fix", () => {
    expect(
      liveEtaMinutes({
        ...base,
        riderLat: DEST.lat + 0.01,
        riderLng: DEST.lng,
        recordedAt: new Date(NOW - 10 * 60_000).toISOString(),
      }),
    ).toBeNull();
  });

  it("returns null when there is no fix", () => {
    expect(liveEtaMinutes({ ...base, riderLat: null, riderLng: null, recordedAt: null })).toBeNull();
  });

  it("never returns an absurd number when travel time is missing", () => {
    const eta = liveEtaMinutes({
      ...base,
      travelMinutes: 0,
      distanceKm: 0,
      riderLat: DEST.lat + 0.02,
      riderLng: DEST.lng,
      recordedAt: new Date(NOW).toISOString(),
    })!;
    expect(eta).toBeGreaterThan(0);
    expect(eta).toBeLessThan(120);
  });
});
