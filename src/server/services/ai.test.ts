// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import {
  analyzeComplaintDraft,
  checkNearbyDuplicates,
  generateGroundedInsights,
  signAnalysisToken,
  verifyAnalysisToken,
} from "./ai";
import type { SessionUser } from "../auth/session";
import { setAiPaused } from "./admin";

describe("AI Processing & Fallback Service (§27, §28, §31.4)", () => {
  const dummyActor: SessionUser = {
    uid: "test-admin",
    email: "admin@civicpulse.org",
    role: "admin",
    displayName: "Test Admin",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
  };

  beforeEach(() => {
    setAiPaused(false, dummyActor);
  });

  describe("Analysis Token signing and verification", () => {
    it("signs and successfully verifies an analysis token", () => {
      const token = signAnalysisToken("analysis-xyz-123", "user-456");
      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const verified = verifyAnalysisToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.analysisId).toBe("analysis-xyz-123");
      expect(verified?.uid).toBe("user-456");
    });

    it("rejects tampered or malformed tokens", () => {
      const token = signAnalysisToken("analysis-xyz-123", "user-456");
      const tampered = token.slice(0, -4) + "abcd";
      expect(verifyAnalysisToken(tampered)).toBeNull();
      expect(verifyAnalysisToken("not-a-token")).toBeNull();
    });
  });

  describe("analyzeComplaintDraft (§27)", () => {
    it("returns valid structured analysis and signed token for a civic issue report", async () => {
      const res = await analyzeComplaintDraft({
        title: "Large pothole on 100ft road Indiranagar",
        description: "Deep crater in the middle of 100ft road near 12th Main junction, multiple bikes skidding.",
      });

      expect(res.analysis).toBeDefined();
      expect(res.analysis.id).toMatch(/^analysis-/);
      expect(["POTHOLE", "INFRASTRUCTURE", "ROADS"]).toContain(
        res.analysis.output.predictedCategory,
      );
      expect(res.analysis.output.confidence).toBeGreaterThan(0);
      expect(res.analysisToken).toBeDefined();
      expect(verifyAnalysisToken(res.analysisToken)).not.toBeNull();
    }, 20000);

    it("immediately invokes keyword fallback when emergency AI switch is paused (PRD-AI-007)", async () => {
      setAiPaused(true, dummyActor);

      const res = await analyzeComplaintDraft({
        title: "Overflowing garbage bin",
        description: "Huge pile of trash, waste and uncollected kachra behind market.",
      });

      expect(res.analysis.source).toBe("fallback");
      expect(res.analysis.fallbackReason).toBe("PAUSED");
      expect(res.analysis.model).toBe("keyword-classifier");
      expect(res.analysis.output.predictedCategory).toBe("GARBAGE");
      expect(res.analysis.tokens).toBe(0);
    });

    it("redacts PII from text before classification", async () => {
      const res = await analyzeComplaintDraft({
        title: "Call me at +91 9876543210 regarding open drain",
        description: "Open drain overflowing into street. Reach out to citizen at test@example.com immediately.",
      });

      expect(res.analysis.output.shortSummary).not.toContain("9876543210");
      expect(res.analysis.output.shortSummary).not.toContain("test@example.com");
    }, 20000);
  });

  describe("checkNearbyDuplicates (§28)", () => {
    it("scans and returns nearby matching complaints with transparent scoring", async () => {
      const res = await checkNearbyDuplicates({
        lat: 12.9304,
        lng: 77.6784,
        category: "POTHOLE",
        text: "Dangerous pothole on main road Bellandur",
      });

      expect(res.method).toBe("tfidf");
      expect(Array.isArray(res.candidates)).toBe(true);

      if (res.candidates.length > 0) {
        const top = res.candidates[0]!;
        expect(top.id).toBeDefined();
        expect(top.ref).toMatch(/^CP-BLR-/);
        expect(top.distanceM).toBeLessThanOrEqual(500);
        expect(["LIKELY", "POSSIBLE"]).toContain(top.label);
        expect(top.components).toHaveProperty("text");
        expect(top.components).toHaveProperty("geo");
      }
    });
  });

  describe("generateGroundedInsights (§31.4)", () => {
    it("returns grounded observations citing aggregate metric paths", async () => {
      const insights = await generateGroundedInsights("city:blr");

      expect(insights.scope).toBe("city:blr");
      expect(insights.dataSufficiency).toBe("ok");
      expect(Array.isArray(insights.observations)).toBe(true);
      expect(insights.observations.length).toBeGreaterThan(0);

      // Verify every observation cites at least one metric path
      for (const obs of insights.observations) {
        expect(obs.metricRefs.length).toBeGreaterThan(0);
      }

      // Verify recommendations exist and cite supporting metrics
      expect(insights.recommendations.length).toBeGreaterThan(0);
      for (const rec of insights.recommendations) {
        expect(rec.basedOn.length).toBeGreaterThan(0);
      }
    }, 15000);

    it("falls back to deterministic template when AI is paused", async () => {
      setAiPaused(true, dummyActor);

      const insights = await generateGroundedInsights("dept:roads");
      expect(insights.source).toBe("template");
      expect(insights.modelUsed).toBe("template-fallback");
      expect(insights.observations[0]?.text).toContain("complaints");
    });
  });
});
