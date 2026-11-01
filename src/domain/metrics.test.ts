import { describe, it, expect } from "vitest";
import {
  received,
  resolved,
  uniqueIssues,
  resolutionRate,
  duplicateRate,
  reopenRate,
  slaCompliance,
  averageResolutionHours,
  classificationAcceptance,
  approxMedianResolutionHours,
  categoryDistribution,
  includesDemoData,
  summariseRange,
  sumBy,
  RESOLUTION_BUCKETS_H,
  type DailyDoc,
  type Totals,
  type UsageCounters,
} from "./metrics";

const empty: DailyDoc = {
  received: 0,
  resolved: 0,
  duplicatesConfirmed: 0,
  supportsAdded: 0,
  reopened: 0,
  slaMet: 0,
  slaMissed: 0,
  resolutionHoursSum: 0,
  resolutionCount: 0,
  resolutionHist: [0, 0, 0, 0, 0, 0, 0],
};

const day1: DailyDoc = {
  received: 20,
  resolved: 15,
  duplicatesConfirmed: 3,
  supportsAdded: 5,
  reopened: 2,
  slaMet: 12,
  slaMissed: 3,
  resolutionHoursSum: 360,
  resolutionCount: 15,
  resolutionHist: [2, 5, 4, 2, 1, 1, 0],
};

const day2: DailyDoc = {
  received: 10,
  resolved: 12,
  duplicatesConfirmed: 1,
  supportsAdded: 3,
  reopened: 0,
  slaMet: 10,
  slaMissed: 2,
  resolutionHoursSum: 240,
  resolutionCount: 12,
  resolutionHist: [1, 3, 3, 2, 2, 1, 0],
};

describe("metrics", () => {
  describe("received / resolved / sumBy", () => {
    it("sums across dailies", () => {
      expect(received([day1, day2])).toBe(30);
      expect(resolved([day1, day2])).toBe(27);
      expect(sumBy([day1, day2], "supportsAdded")).toBe(8);
    });

    it("returns 0 for empty array", () => {
      expect(received([])).toBe(0);
      expect(resolved([])).toBe(0);
    });
  });

  describe("uniqueIssues", () => {
    it("subtracts confirmed duplicates from received", () => {
      expect(uniqueIssues([day1, day2])).toBe(30 - 4);
    });

    it("returns 0 for empty", () => {
      expect(uniqueIssues([])).toBe(0);
    });
  });

  describe("resolutionRate", () => {
    it("computes percentage", () => {
      // 27/30 * 100 = 90
      expect(resolutionRate([day1, day2])).toBe(90);
    });

    it("can exceed 100 when clearing backlog", () => {
      const backlogDay: DailyDoc = { ...empty, received: 5, resolved: 10 };
      expect(resolutionRate([backlogDay])).toBe(200);
    });

    it("returns null when no received", () => {
      expect(resolutionRate([])).toBeNull();
      expect(resolutionRate([empty])).toBeNull();
    });
  });

  describe("duplicateRate", () => {
    it("computes percentage", () => {
      // 4/30 * 100 ≈ 13.333...
      const rate = duplicateRate([day1, day2]);
      expect(rate).toBeCloseTo(13.333, 2);
    });

    it("returns null when no received", () => {
      expect(duplicateRate([])).toBeNull();
    });
  });

  describe("reopenRate", () => {
    it("computes reopened / resolved percentage", () => {
      // 2/27 * 100 ≈ 7.407...
      const rate = reopenRate([day1, day2]);
      expect(rate).toBeCloseTo(7.407, 2);
    });

    it("returns null when no resolved", () => {
      expect(reopenRate([])).toBeNull();
    });
  });

  describe("slaCompliance", () => {
    it("computes met / (met+missed) percentage", () => {
      // (12+10) / (12+10+3+2) = 22/27 ≈ 81.48
      const rate = slaCompliance([day1, day2]);
      expect(rate).toBeCloseTo(81.481, 2);
    });

    it("returns null when no SLA data", () => {
      expect(slaCompliance([])).toBeNull();
      expect(slaCompliance([empty])).toBeNull();
    });
  });

  describe("averageResolutionHours", () => {
    it("computes sum / count", () => {
      // (360+240) / (15+12) = 600/27 ≈ 22.222
      const avg = averageResolutionHours([day1, day2]);
      expect(avg).toBeCloseTo(22.222, 2);
    });

    it("returns null when no count", () => {
      expect(averageResolutionHours([])).toBeNull();
      expect(averageResolutionHours([empty])).toBeNull();
    });
  });

  describe("classificationAcceptance", () => {
    it("computes acceptance rate", () => {
      const usage: UsageCounters = { acceptedTrue: 80, acceptedFalse: 20 };
      expect(classificationAcceptance(usage)).toBe(80);
    });

    it("returns null when no feedback", () => {
      const usage: UsageCounters = { acceptedTrue: 0, acceptedFalse: 0 };
      expect(classificationAcceptance(usage)).toBeNull();
    });
  });

  describe("approxMedianResolutionHours", () => {
    it("returns midpoint of bucket containing median", () => {
      // day1 hist: [2,5,4,2,1,1,0] total=15, half=7.5
      // cumulative: 2,7,11 → bucket 2 (midpoint 36)
      expect(approxMedianResolutionHours([day1])).toBe(36);
    });

    it("returns null for empty histogram", () => {
      expect(approxMedianResolutionHours([])).toBeNull();
      expect(approxMedianResolutionHours([empty])).toBeNull();
    });

    it("returns first bucket midpoint when all in first bucket", () => {
      const d: DailyDoc = { ...empty, resolutionHist: [10, 0, 0, 0, 0, 0, 0] };
      expect(approxMedianResolutionHours([d])).toBe(3);
    });

    it("returns last bucket midpoint when all overflow", () => {
      const d: DailyDoc = { ...empty, resolutionHist: [0, 0, 0, 0, 0, 0, 10] };
      expect(approxMedianResolutionHours([d])).toBe(300);
    });

    it("sums histograms across dailies", () => {
      // day1+day2 hist: [3,8,7,4,3,2,0] total=27, half=13.5
      // cumulative: 3,11,18 → bucket 2 (midpoint 36)
      expect(approxMedianResolutionHours([day1, day2])).toBe(36);
    });
  });

  describe("categoryDistribution", () => {
    it("aggregates by category, sorted descending", () => {
      const d1: DailyDoc = {
        ...empty,
        byCategory: {
          WATER_LEAK: { received: 5 },
          POTHOLE: { received: 10 },
        },
      };
      const d2: DailyDoc = {
        ...empty,
        byCategory: {
          WATER_LEAK: { received: 3 },
          SANITATION: { received: 7 },
        },
      };
      const result = categoryDistribution([d1, d2]);
      expect(result).toEqual([
        { category: "POTHOLE", received: 10 },
        { category: "WATER_LEAK", received: 8 },
        { category: "SANITATION", received: 7 },
      ]);
    });

    it("returns empty for no category data", () => {
      expect(categoryDistribution([empty])).toEqual([]);
      expect(categoryDistribution([])).toEqual([]);
    });
  });

  describe("includesDemoData", () => {
    it("true when syntheticCount > 0", () => {
      const t: Totals = { open: 10, openByBand: {}, syntheticCount: 1 };
      expect(includesDemoData(t)).toBe(true);
    });

    it("false when syntheticCount is 0", () => {
      const t: Totals = { open: 10, openByBand: {}, syntheticCount: 0 };
      expect(includesDemoData(t)).toBe(false);
    });
  });

  describe("RESOLUTION_BUCKETS_H", () => {
    it("has 7 boundaries", () => {
      expect(RESOLUTION_BUCKETS_H).toHaveLength(7);
    });
  });

  describe("summariseRange", () => {
    it("assembles all fields", () => {
      const totals: Totals = {
        open: 42,
        openByBand: { CRITICAL: 2, HIGH: 10 },
        syntheticCount: 0,
      };
      const summary = summariseRange([day1, day2], totals);

      expect(summary.received).toBe(30);
      expect(summary.uniqueIssues).toBe(26);
      expect(summary.resolved).toBe(27);
      expect(summary.open).toBe(42);
      expect(summary.resolutionRate).toBe(90);
      expect(summary.duplicateRate).toBeCloseTo(13.333, 2);
      expect(summary.reopenRate).toBeCloseTo(7.407, 2);
      expect(summary.slaCompliance).toBeCloseTo(81.481, 2);
      expect(summary.averageResolutionHours).toBeCloseTo(22.222, 2);
      expect(summary.medianResolutionHours).toBe(36);
      expect(summary.supportsAdded).toBe(8);
      expect(summary.openByBand).toEqual({ CRITICAL: 2, HIGH: 10 });
      expect(summary.includesDemoData).toBe(false);
    });

    it("handles empty dailies with totals", () => {
      const totals: Totals = { open: 5, openByBand: {}, syntheticCount: 3 };
      const summary = summariseRange([], totals);

      expect(summary.received).toBe(0);
      expect(summary.resolved).toBe(0);
      expect(summary.open).toBe(5);
      expect(summary.resolutionRate).toBeNull();
      expect(summary.averageResolutionHours).toBeNull();
      expect(summary.medianResolutionHours).toBeNull();
      expect(summary.includesDemoData).toBe(true);
    });
  });
});
