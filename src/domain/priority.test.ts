import { describe, it, expect } from "vitest";
import {
  computePriority,
  bandForScore,
  istMonth,
  priorityExplanation,
  type PriorityInputs,
} from "./priority";
import { DEFAULT_WEIGHTS, DEFAULT_BANDS } from "./categories";

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 10, 5, 6, 0, 0); // 5 Nov 2026

type Over = Partial<PriorityInputs> & { ageHours?: number };

function make(o: Over): PriorityInputs {
  const { ageHours = 0, ...rest } = o;
  return {
    baseSeverity: 3,
    verifiedSeverity: null,
    hazardFlags: [],
    independentReporterCount: 1,
    createdAtMs: NOW - ageHours * HOUR,
    nowMs: NOW,
    slaHours: 72,
    affectedScale: 0.1,
    nearbyOpenClusters: 0,
    timeSensitive: false,
    seasonMonths: [],
    adjustment: 0,
    weights: DEFAULT_WEIGHTS,
    bands: DEFAULT_BANDS,
    weightsVersion: 3,
    ...rest,
  };
}

describe("computePriority — worked examples (§29.4)", () => {
  it("E1 open drain by school, November → 70 CRITICAL", () => {
    const r = computePriority(
      make({
        baseSeverity: 4,
        hazardFlags: ["INJURY_RISK"],
        independentReporterCount: 4,
        ageHours: 20,
        slaHours: 48,
        affectedScale: 1.0,
        nearbyOpenClusters: 4,
        timeSensitive: true,
      }),
    );
    expect(r.score).toBe(70);
    expect(r.band).toBe("CRITICAL");
    // pre-rounding sum ≈ 69.5468
    const raw = r.lineItems
      .filter((li) => li.key !== "ADJ")
      .reduce((a, li) => a + li.points, 0);
    expect(Math.abs(raw - 69.5468)).toBeLessThan(0.01);
  });

  it("E2 overflowing bin → 17 LOW", () => {
    const r = computePriority(
      make({
        baseSeverity: 2,
        independentReporterCount: 1,
        ageHours: 30,
        slaHours: 48,
        affectedScale: 0.4,
        nearbyOpenClusters: 2,
      }),
    );
    expect(r.score).toBe(17);
    expect(r.band).toBe("LOW");
  });

  it("E3 streetlights on arterial road → 51 HIGH", () => {
    const r = computePriority(
      make({
        baseSeverity: 3,
        independentReporterCount: 6,
        ageHours: 120,
        slaHours: 72,
        affectedScale: 0.7,
        nearbyOpenClusters: 3,
        timeSensitive: true,
      }),
    );
    expect(r.score).toBe(51);
    expect(r.band).toBe("HIGH");
  });

  it("E4 single old report (equity floor) → 32 MEDIUM", () => {
    const r = computePriority(
      make({
        baseSeverity: 3,
        independentReporterCount: 1,
        ageHours: 240,
        slaHours: 72,
        affectedScale: 0.4,
        nearbyOpenClusters: 0,
        timeSensitive: false,
      }),
    );
    expect(r.score).toBe(32);
    expect(r.band).toBe("MEDIUM");
  });

  it("E5 max case → 100 CRITICAL", () => {
    const r = computePriority(
      make({
        baseSeverity: 5,
        hazardFlags: ["INJURY_RISK", "EXPOSED_WIRE"],
        independentReporterCount: 11,
        ageHours: 200,
        slaHours: 48,
        affectedScale: 1.0,
        nearbyOpenClusters: 10,
        timeSensitive: true,
      }),
    );
    expect(r.score).toBe(100);
    expect(r.band).toBe("CRITICAL");
  });

  it("E6 min case → 1 LOW", () => {
    const r = computePriority(
      make({
        baseSeverity: 1,
        independentReporterCount: 1,
        ageHours: 0,
        slaHours: 168,
        affectedScale: 0.1,
        nearbyOpenClusters: 0,
      }),
    );
    expect(r.score).toBe(1);
    expect(r.band).toBe("LOW");
  });

  it("E7 E2 + authority adjustment +15 → 32 MEDIUM", () => {
    const r = computePriority(
      make({
        baseSeverity: 2,
        independentReporterCount: 1,
        ageHours: 30,
        slaHours: 48,
        affectedScale: 0.4,
        nearbyOpenClusters: 2,
        adjustment: 15,
      }),
    );
    expect(r.base).toBe(17);
    expect(r.score).toBe(32);
    expect(r.band).toBe("MEDIUM");
    expect(r.lineItems.some((li) => li.key === "ADJ" && li.points === 15)).toBe(true);
  });
});

describe("computePriority — invariants", () => {
  it("throws if weights do not sum to 1", () => {
    expect(() =>
      computePriority(make({ weights: { ...DEFAULT_WEIGHTS, S: 0.5 } })),
    ).toThrow(/sum to 1/);
  });

  it("R caps at 10 others (f ≤ 1)", () => {
    const r = computePriority(make({ independentReporterCount: 1000 }));
    expect(r.factors.R).toBe(1);
  });

  it("D caps at 1 for very old complaints", () => {
    const r = computePriority(make({ ageHours: 100_000, slaHours: 48 }));
    expect(r.factors.D).toBe(1);
  });

  it("clamps score to 100 (base 100 + 15)", () => {
    const r = computePriority(
      make({
        baseSeverity: 5,
        hazardFlags: ["INJURY_RISK"],
        independentReporterCount: 11,
        ageHours: 200,
        slaHours: 48,
        affectedScale: 1.0,
        nearbyOpenClusters: 10,
        timeSensitive: true,
        adjustment: 15,
      }),
    );
    expect(r.score).toBe(100);
  });

  it("clamps score to 0 (base 1 − 15)", () => {
    const r = computePriority(
      make({ baseSeverity: 1, affectedScale: 0.1, adjustment: -15 }),
    );
    expect(r.score).toBe(0);
  });

  it("is deterministic for identical inputs", () => {
    const i = make({ baseSeverity: 4, ageHours: 20, independentReporterCount: 3 });
    expect(computePriority(i).score).toBe(computePriority(i).score);
  });

  it("factor line items sum (pre-round) equals base within rounding", () => {
    const r = computePriority(make({ baseSeverity: 4, ageHours: 50 }));
    const raw = r.lineItems
      .filter((li) => li.key !== "ADJ")
      .reduce((a, li) => a + li.points, 0);
    expect(Math.abs(Math.floor(raw + 0.5 + 1e-9) - r.base)).toBe(0);
  });
});

describe("bandForScore — boundaries (§29.7)", () => {
  const cases: Array<[number, string]> = [
    [69, "HIGH"],
    [70, "CRITICAL"],
    [49, "MEDIUM"],
    [50, "HIGH"],
    [29, "LOW"],
    [30, "MEDIUM"],
  ];
  it.each(cases)("score %i → %s", (score, band) => {
    expect(bandForScore(score, DEFAULT_BANDS)).toBe(band);
  });
});

describe("istMonth + season", () => {
  it("derives IST month from epoch", () => {
    // 2026-05-31T20:00:00Z is 2026-06-01 01:30 IST → month 6
    expect(istMonth(Date.UTC(2026, 4, 31, 20, 0, 0))).toBe(6);
  });

  it("T=1 only when time-sensitive and in season", () => {
    const base: Over = { timeSensitive: true, seasonMonths: [11], nowMs: NOW };
    expect(computePriority(make(base)).factors.T).toBe(1); // Nov in [11]
    expect(
      computePriority(make({ ...base, seasonMonths: [1] })).factors.T,
    ).toBe(0);
    expect(
      computePriority(make({ timeSensitive: false, seasonMonths: [] })).factors.T,
    ).toBe(0);
  });
});

describe("priorityExplanation", () => {
  it("names the band and top factors", () => {
    const r = computePriority(
      make({ baseSeverity: 4, hazardFlags: ["INJURY_RISK"], affectedScale: 1.0 }),
    );
    expect(priorityExplanation(r).toLowerCase()).toContain("safety hazard");
  });
});
