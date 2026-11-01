import { describe, it, expect } from "vitest";
import {
  normalise,
  buildTfidf,
  cosineSparse,
  cosine,
  rescale,
  scoreCandidates,
  type QueryCtx,
  type Candidate,
} from "./duplicates";
import { DUPLICATE_SETTINGS } from "./categories";

const HOUR = 3_600_000;
const T = Date.UTC(2026, 10, 5, 6, 0, 0);

describe("normalise (§28.2)", () => {
  it("applies synonyms, removes stopwords, keeps content", () => {
    const out = normalise("The gaddha near 5th Main is bahut bad");
    expect(out).toContain("pothole");
    expect(out).not.toContain("gaddha");
    expect(out).not.toContain("the");
    expect(out).not.toContain("bahut");
  });
  it("light-stems long tokens", () => {
    expect(normalise("lights flickering").split(" ")).toEqual(["light", "flicker"]);
  });
  it("maps Hinglish civic terms", () => {
    expect(normalise("naali choked, paani everywhere").split(" ")).toContain("drain");
    expect(normalise("naali choked, paani everywhere").split(" ")).toContain("water");
  });
});

describe("tf-idf cosine", () => {
  it("identical documents score 1", () => {
    const m = buildTfidf(["pothole 5th main", "pothole 5th main"]);
    expect(cosineSparse(m.vec(0), m.vec(1))).toBeCloseTo(1, 10);
  });
  it("disjoint documents score 0", () => {
    const m = buildTfidf(["pothole road", "garbage bin overflow"]);
    expect(cosineSparse(m.vec(0), m.vec(1))).toBe(0);
  });
});

describe("cosine (dense) + rescale", () => {
  it("rescales a 0.86 cosine to 0.8125 text score", () => {
    expect(rescale(0.86, 0.6, 0.92)).toBeCloseTo(0.8125, 4);
  });
  it("dense cosine of parallel vectors is 1", () => {
    expect(cosine([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
  });
});

describe("scoreCandidates — worked example (§28.4) → 0.881 LIKELY", () => {
  // Construct an embedding pair with cosine ≈ 0.86.
  const qv = [1, 0];
  const cv = [0.86, Math.sqrt(1 - 0.86 ** 2)];
  // Two points ~120 m apart at ~12.97°N.
  const qPoint = { lat: 12.9716, lng: 77.5946 };
  const cPoint = { lat: 12.9716, lng: 77.5946 + 120 / (111319.49 * Math.cos((12.9716 * Math.PI) / 180)) };

  const q: QueryCtx = { text: "open drain cover near school", vector: qv, point: qPoint, category: "DRAINAGE", atMs: T };
  const cand: Candidate = {
    id: "c1",
    text: "big open drain by the school gate",
    vector: cv,
    point: cPoint,
    category: "DRAINAGE",
    createdAtMs: T - 96 * HOUR,
  };

  it("produces score 0.881, LIKELY, via embedding", () => {
    const [top] = scoreCandidates(q, [cand], DUPLICATE_SETTINGS);
    expect(top).toBeDefined();
    expect(top?.label).toBe("LIKELY");
    expect(top?.components.method).toBe("embedding");
    expect(top?.score).toBeCloseTo(0.881, 3);
    expect(top?.components.text).toBeCloseTo(0.8125, 3);
    expect(top?.components.geo).toBeCloseTo(0.9424, 2);
    expect(top?.components.time).toBeCloseTo(0.8667, 3);
    expect(top?.distanceM).toBe(120);
  });
});

describe("scoreCandidates — false-positive guard (§28.4)", () => {
  // Low text similarity (cos ≈ 0.71) but close & same category → POSSIBLE, not LIKELY.
  const qv = [1, 0];
  const cv = [0.71, Math.sqrt(1 - 0.71 ** 2)];
  const point = { lat: 12.9716, lng: 77.5946 };
  const near = { lat: 12.9716, lng: 77.5946 + 80 / (111319.49 * Math.cos((12.9716 * Math.PI) / 180)) };

  it("is POSSIBLE because text < 0.5", () => {
    const [top] = scoreCandidates(
      { text: "light near temple not working", vector: qv, point, category: "STREETLIGHT", atMs: T },
      [{ id: "c2", text: "light outside apartment flickering", vector: cv, point: near, category: "STREETLIGHT", createdAtMs: T }],
      DUPLICATE_SETTINGS,
    );
    expect(top?.label).toBe("POSSIBLE");
    expect(top?.components.text).toBeLessThan(0.5);
  });
});

describe("scoreCandidates — category component", () => {
  const point = { lat: 12.9716, lng: 77.5946 };
  const mk = (category: Candidate["category"]): Candidate => ({
    id: category,
    text: "road issue near main road",
    vector: [1, 0],
    point,
    category,
    createdAtMs: T,
  });
  const q: QueryCtx = { text: "road issue near main road", vector: [1, 0], point, category: "POTHOLE", atMs: T };

  it("same category → 1, same department → 0.5, otherwise → 0", () => {
    const scored = scoreCandidates(q, [mk("POTHOLE"), mk("INFRASTRUCTURE"), mk("GARBAGE")], DUPLICATE_SETTINGS);
    const byId = Object.fromEntries(scored.map((s) => [s.id, s.components.category]));
    expect(byId["POTHOLE"]).toBe(1); // same category
    expect(byId["INFRASTRUCTURE"]).toBe(0.5); // both 'roads' dept
    expect(byId["GARBAGE"]).toBe(0); // 'swm' dept
  });
});
