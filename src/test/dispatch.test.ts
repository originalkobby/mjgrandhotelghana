import { describe, expect, it } from "vitest";
import { rankRiders } from "../../supabase/functions/_shared/dispatch.ts";

const HOTEL = { lat: 5.6365, lng: -0.1738 };

const rider = (over: Partial<any>) => ({
  id: "r1",
  full_name: "Rider",
  status: "available",
  is_active: true,
  last_lat: 5.64,
  last_lng: -0.17,
  ...over,
});

describe("rankRiders", () => {
  it("puts the nearest available rider first", () => {
    const near = rider({ id: "near", last_lat: 5.637, last_lng: -0.174 });
    const far = rider({ id: "far", last_lat: 5.75, last_lng: -0.3 });
    const out = rankRiders([far, near], HOTEL, new Set(), new Map());
    expect(out[0].id).toBe("near");
  });

  it("skips riders who are offline, suspended or inactive", () => {
    const out = rankRiders(
      [
        rider({ id: "off", status: "offline" }),
        rider({ id: "susp", status: "suspended" }),
        rider({ id: "gone", is_active: false }),
        rider({ id: "ok" }),
      ],
      HOTEL,
      new Set(),
      new Map(),
    );
    expect(out.map((r) => r.id)).toEqual(["ok"]);
  });

  it("skips riders who already have an open job", () => {
    const out = rankRiders(
      [rider({ id: "busy" }), rider({ id: "free" })],
      HOTEL,
      new Set(),
      new Map([["busy", 1]]),
    );
    expect(out.map((r) => r.id)).toEqual(["free"]);
  });

  it("does not re-offer to a rider who already declined", () => {
    const out = rankRiders(
      [rider({ id: "declined" }), rider({ id: "fresh" })],
      HOTEL,
      new Set(["declined"]),
      new Map(),
    );
    expect(out.map((r) => r.id)).toEqual(["fresh"]);
  });

  it("sorts riders without a known position last", () => {
    const out = rankRiders(
      [
        rider({ id: "nowhere", last_lat: null, last_lng: null }),
        rider({ id: "known", last_lat: 5.8, last_lng: -0.4 }),
      ],
      HOTEL,
      new Set(),
      new Map(),
    );
    expect(out.map((r) => r.id)).toEqual(["known", "nowhere"]);
  });

  it("returns nobody when every rider has been tried", () => {
    const out = rankRiders([rider({ id: "a" })], HOTEL, new Set(["a"]), new Map());
    expect(out).toHaveLength(0);
  });
});
