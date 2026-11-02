import { describe, it, expect } from "vitest";
import * as crypto from "crypto";
import { signAnalysisToken, verifyAnalysisToken } from "@/server/services/ai";
import { createComplaint } from "@/server/repositories/complaints.repo";
import { getServerEnv } from "@/lib/server-env";
import type { SessionUser } from "@/server/auth/session";

describe("Milestone 5 (R5): Analysis Token HMAC Verification (PRD-§24.2, PRD-§24.3)", () => {
  const dummyUser: SessionUser = {
    uid: "citizen-r5-test-uid",
    email: "citizen.test@civicpulse.local",
    role: "citizen",
    emailVerified: true,
    displayName: "R5 Citizen Tester",
    departmentId: null,
    status: "active",
    homeWardId: null,
  };

  describe("1. HMAC Signature & Expiry Cryptographic Properties", () => {
    it("generates and verifies a valid token successfully", () => {
      const token = signAnalysisToken("analysis-valid-123", dummyUser.uid);
      expect(token).toBeDefined();
      expect(token).toContain(".");

      const verified = verifyAnalysisToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.analysisId).toBe("analysis-valid-123");
      expect(verified?.uid).toBe(dummyUser.uid);
    });

    it("verifies tokens signed for anonymous drafts", () => {
      const token = signAnalysisToken("analysis-anon-456", "anon");
      const verified = verifyAnalysisToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.analysisId).toBe("analysis-anon-456");
      expect(verified?.uid).toBe("anon");
    });

    it("rejects token when signature is tampered", () => {
      const token = signAnalysisToken("analysis-valid-123", dummyUser.uid);
      const [payload, hmac] = token.split(".");
      const tamperedHmac = hmac!.slice(0, -4) + "beef";
      const forgedToken = `${payload}.${tamperedHmac}`;

      expect(verifyAnalysisToken(forgedToken)).toBeNull();
    });

    it("rejects token when payload is tampered", () => {
      const token = signAnalysisToken("analysis-valid-123", dummyUser.uid);
      const [, hmac] = token.split(".");
      const forgedPayload = Buffer.from(`analysis-tampered:${dummyUser.uid}:${Date.now() + 10000}`).toString("base64url");
      const forgedToken = `${forgedPayload}.${hmac}`;

      expect(verifyAnalysisToken(forgedToken)).toBeNull();
    });

    it("rejects expired token even with authentic HMAC signature", () => {
      const env = getServerEnv();
      const secret = env.ANALYSIS_TOKEN_SECRET;
      const expiredTime = Date.now() - 10000; // 10 seconds in past
      const payload = `analysis-expired:${dummyUser.uid}:${expiredTime}`;
      const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const expiredToken = `${Buffer.from(payload).toString("base64url")}.${hmac}`;

      expect(verifyAnalysisToken(expiredToken)).toBeNull();
    });

    it("rejects malformed token strings", () => {
      expect(verifyAnalysisToken("")).toBeNull();
      expect(verifyAnalysisToken("not-a-token")).toBeNull();
      expect(verifyAnalysisToken("part1.part2.part3")).toBeNull();
      expect(verifyAnalysisToken("aGVsbG8.world")).toBeNull();
    });
  });

  describe("2. createComplaint Enforcement & Rejection", () => {
    it("rejects complaint creation with 400 when analysisToken has invalid signature", async () => {
      await expect(
        createComplaint(
          {
            title: "Dangerous Pothole on 100ft road",
            description: "Deep pothole causing accidents near Metro pillar 120 in Indiranagar.",
            category: "POTHOLE",
            categorySource: "user",
            analysisToken: "invalid-signature-token.abc123456",
            location: {
              lat: 12.9719,
              lng: 77.6412,
              wardId: "ward-080-indiranagar",
            },
            durationBucket: "FEW_DAYS",
            affectedScale: 0.4,
            hazardFlags: [],
            visibility: "public",
          },
          dummyUser
        )
      ).rejects.toMatchObject({
        code: "INVALID_ANALYSIS_TOKEN",
        status: 400,
      });
    });

    it("rejects complaint creation with 403 when analysisToken belongs to another user", async () => {
      const otherUserToken = signAnalysisToken("analysis-other-user", "other-citizen-uid");

      await expect(
        createComplaint(
          {
            title: "Dangerous Pothole on 100ft road",
            description: "Deep pothole causing accidents near Metro pillar 120 in Indiranagar.",
            category: "POTHOLE",
            categorySource: "user",
            analysisToken: otherUserToken,
            location: {
              lat: 12.9719,
              lng: 77.6412,
              wardId: "ward-080-indiranagar",
            },
            durationBucket: "FEW_DAYS",
            affectedScale: 0.4,
            hazardFlags: [],
            visibility: "public",
          },
          dummyUser
        )
      ).rejects.toMatchObject({
        code: "INVALID_ANALYSIS_TOKEN_USER",
        status: 403,
      });
    });
  });
});
