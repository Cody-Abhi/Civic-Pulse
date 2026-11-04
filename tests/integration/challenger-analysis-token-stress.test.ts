import { describe, it, expect } from "vitest";
import * as crypto from "crypto";
import { signAnalysisToken, verifyAnalysisToken } from "@/server/auth/analysis-token";
import { getServerEnv } from "@/lib/server-env";

describe("Adversarial Challenger: Analysis Token Cryptographic Stress Test", () => {
  const env = getServerEnv();
  const secret = env.ANALYSIS_TOKEN_SECRET;

  describe("1. Valid Roundtrip Token Signing & Verification", () => {
    it("handles standard analysisId and citizen uid", () => {
      const token = signAnalysisToken("analysis-001", "citizen-uid-123");
      expect(typeof token).toBe("string");
      const verified = verifyAnalysisToken(token);
      expect(verified).toEqual({
        analysisId: "analysis-001",
        uid: "citizen-uid-123",
      });
    });

    it("handles 'anon' unauthenticated user token", () => {
      const token = signAnalysisToken("analysis-anon-999", "anon");
      const verified = verifyAnalysisToken(token);
      expect(verified).toEqual({
        analysisId: "analysis-anon-999",
        uid: "anon",
      });
    });

    it("handles unicode and special characters in IDs without colons", () => {
      const token = signAnalysisToken("analysis-ಬೆಂಗಳೂರು-123", "citizen-नमस्ते-456");
      const verified = verifyAnalysisToken(token);
      expect(verified).toEqual({
        analysisId: "analysis-ಬೆಂಗಳೂರು-123",
        uid: "citizen-नमस्ते-456",
      });
    });

    it("handles long IDs up to 4KB safely", () => {
      const longAnalysisId = "analysis-" + "x".repeat(2048);
      const longUid = "uid-" + "y".repeat(2048);
      const token = signAnalysisToken(longAnalysisId, longUid);
      const verified = verifyAnalysisToken(token);
      expect(verified).toEqual({
        analysisId: longAnalysisId,
        uid: longUid,
      });
    });
  });

  describe("2. Expired and Invalid Timestamp Rejection", () => {
    it("rejects token expired in the past", () => {
      const pastTime = Date.now() - 1000;
      const payload = `analysis-exp:citizen-1:${pastTime}`;
      const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const token = `${Buffer.from(payload).toString("base64url")}.${hmac}`;

      expect(verifyAnalysisToken(token)).toBeNull();
    });

    it("rejects token with epoch 0 timestamp", () => {
      const payload = `analysis-exp:citizen-1:0`;
      const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const token = `${Buffer.from(payload).toString("base64url")}.${hmac}`;

      expect(verifyAnalysisToken(token)).toBeNull();
    });

    it("rejects token with negative timestamp", () => {
      const payload = `analysis-exp:citizen-1:-99999999`;
      const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const token = `${Buffer.from(payload).toString("base64url")}.${hmac}`;

      expect(verifyAnalysisToken(token)).toBeNull();
    });

    it("rejects token with NaN / non-numeric timestamp", () => {
      const payload = `analysis-exp:citizen-1:not-a-number`;
      const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const token = `${Buffer.from(payload).toString("base64url")}.${hmac}`;

      expect(verifyAnalysisToken(token)).toBeNull();
    });

    it("rejects token with empty timestamp field", () => {
      const payload = `analysis-exp:citizen-1:`;
      const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      const token = `${Buffer.from(payload).toString("base64url")}.${hmac}`;

      expect(verifyAnalysisToken(token)).toBeNull();
    });
  });

  describe("3. Tampered Payload & Signature Rejection", () => {
    it("rejects token with flipped bit in HMAC", () => {
      const token = signAnalysisToken("analysis-flip", "user-1");
      const [payload, hmac] = token.split(".");
      const lastChar = hmac!.slice(-1);
      const flippedChar = lastChar === "0" ? "1" : "0";
      const tamperedHmac = hmac!.slice(0, -1) + flippedChar;
      const tamperedToken = `${payload}.${tamperedHmac}`;

      expect(verifyAnalysisToken(tamperedToken)).toBeNull();
    });

    it("rejects token with truncated HMAC", () => {
      const token = signAnalysisToken("analysis-trunc", "user-1");
      const [payload, hmac] = token.split(".");
      const truncatedToken = `${payload}.${hmac!.slice(0, 32)}`;

      expect(verifyAnalysisToken(truncatedToken)).toBeNull();
    });

    it("rejects token with extended HMAC", () => {
      const token = signAnalysisToken("analysis-ext", "user-1");
      const [payload, hmac] = token.split(".");
      const extendedToken = `${payload}.${hmac}00`;

      expect(verifyAnalysisToken(extendedToken)).toBeNull();
    });

    it("rejects token signed with a different secret", () => {
      const wrongSecret = "wrong-secret-that-does-not-match-analysis-secret-32-chars";
      const payload = `analysis-wrong:user-1:${Date.now() + 100000}`;
      const hmac = crypto.createHmac("sha256", wrongSecret).update(payload).digest("hex");
      const forgedToken = `${Buffer.from(payload).toString("base64url")}.${hmac}`;

      expect(verifyAnalysisToken(forgedToken)).toBeNull();
    });

    it("rejects token when analysisId in payload is tampered", () => {
      const token = signAnalysisToken("analysis-orig", "user-1");
      const [, hmac] = token.split(".");
      const tamperedPayload = Buffer.from(
        `analysis-tampered:user-1:${Date.now() + 7200000}`,
      ).toString("base64url");
      const tamperedToken = `${tamperedPayload}.${hmac}`;

      expect(verifyAnalysisToken(tamperedToken)).toBeNull();
    });

    it("rejects token when uid in payload is tampered (privilege escalation)", () => {
      const token = signAnalysisToken("analysis-user1", "user-victim");
      const [, hmac] = token.split(".");
      const tamperedPayload = Buffer.from(
        `analysis-user1:user-attacker:${Date.now() + 7200000}`,
      ).toString("base64url");
      const tamperedToken = `${tamperedPayload}.${hmac}`;

      expect(verifyAnalysisToken(tamperedToken)).toBeNull();
    });

    it("rejects token when expiry in payload is extended", () => {
      const token = signAnalysisToken("analysis-extend", "user-1");
      const [, hmac] = token.split(".");
      const tamperedPayload = Buffer.from(
        `analysis-extend:user-1:${Date.now() + 864000000}`,
      ).toString("base64url");
      const tamperedToken = `${tamperedPayload}.${hmac}`;

      expect(verifyAnalysisToken(tamperedToken)).toBeNull();
    });
  });

  describe("4. Malformed Inputs, Delimiters & Edge Cases (No Crash)", () => {
    it("safely handles empty string", () => {
      expect(verifyAnalysisToken("")).toBeNull();
    });

    it("safely handles string with no delimiter", () => {
      expect(verifyAnalysisToken("foobarbaznodots")).toBeNull();
      expect(verifyAnalysisToken("   ")).toBeNull();
      expect(verifyAnalysisToken("\n\t")).toBeNull();
    });

    it("safely handles only dot or multiple consecutive dots", () => {
      expect(verifyAnalysisToken(".")).toBeNull();
      expect(verifyAnalysisToken("..")).toBeNull();
      expect(verifyAnalysisToken("...")).toBeNull();
      expect(verifyAnalysisToken(".foo")).toBeNull();
      expect(verifyAnalysisToken("foo.")).toBeNull();
      expect(verifyAnalysisToken("foo..bar")).toBeNull();
    });

    it("safely handles invalid base64 characters", () => {
      expect(verifyAnalysisToken("!@#$%^&*().abcdef")).toBeNull();
      expect(verifyAnalysisToken("===???.123456")).toBeNull();
    });

    it("safely handles base64 string that lacks colon delimiters in payload", () => {
      const noColons = Buffer.from("justarandomstringwithoutcolons").toString("base64url");
      expect(verifyAnalysisToken(`${noColons}.abcd`)).toBeNull();
    });

    it("safely handles base64 string with missing fields (e.g., only 1 colon)", () => {
      const partial = Buffer.from("analysis-123:user-456").toString("base64url");
      expect(verifyAnalysisToken(`${partial}.abcd`)).toBeNull();
    });

    it("safely handles null bytes in payload", () => {
      const nullByte = Buffer.from(`analysis\0:user\0:${Date.now() + 10000}`).toString("base64url");
      expect(verifyAnalysisToken(`${nullByte}.abcd`)).toBeNull();
    });

    it("safely handles runtime non-string input via defensive try/catch", () => {
      expect(verifyAnalysisToken(null as unknown as string)).toBeNull();
      expect(verifyAnalysisToken(undefined as unknown as string)).toBeNull();
      expect(verifyAnalysisToken(12345 as unknown as string)).toBeNull();
      expect(verifyAnalysisToken({} as unknown as string)).toBeNull();
    });

    it("safely handles 1MB oversized input without crashing or hanging", () => {
      const hugeString = "a".repeat(1024 * 1024);
      const start = Date.now();
      expect(verifyAnalysisToken(hugeString)).toBeNull();
      expect(Date.now() - start).toBeLessThan(1000);
    });
  });

  describe("5. Cryptographic Timing-Safety & Length Guards", () => {
    it("correctly evaluates constant-length forged 64-char hex signature", () => {
      const token = signAnalysisToken("analysis-timing", "user-timing");
      const [payload] = token.split(".");
      // 64 character hex string matching SHA256 digest length exactly
      const fake64CharHmac = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      const forgedToken = `${payload}.${fake64CharHmac}`;

      // Must safely reject via timingSafeEqual without crashing
      const result = verifyAnalysisToken(forgedToken);
      expect(result).toBeNull();
    });

    it("handles HMAC length mismatch without throwing RangeError from timingSafeEqual", () => {
      const token = signAnalysisToken("analysis-timing", "user-timing");
      const [payload] = token.split(".");

      // Test multiple mismatched lengths (Node.js timingSafeEqual throws RangeError if lengths differ)
      const mismatchedLengths = [1, 10, 32, 63, 65, 128];
      for (const len of mismatchedLengths) {
        const badHmac = "a".repeat(len);
        const badToken = `${payload}.${badHmac}`;
        expect(() => verifyAnalysisToken(badToken)).not.toThrow();
        expect(verifyAnalysisToken(badToken)).toBeNull();
      }
    });

    it("rejects token with uppercase hex HMAC due to strict byte comparison", () => {
      const token = signAnalysisToken("analysis-timing", "user-timing");
      const [payload, hmac] = token.split(".");
      const upperHmac = hmac!.toUpperCase();
      // If hmac already had only digits, change first letter
      const testHmac = /[a-f]/.test(hmac!) ? upperHmac : hmac!.slice(0, -1) + "F";
      const upperToken = `${payload}.${testHmac}`;

      expect(verifyAnalysisToken(upperToken)).toBeNull();
    });
  });

  describe("6. Fuzz & High-Throughput Stress (1,000 Iterations)", () => {
    it("executes 1,000 iterations of signing, valid verification, and fuzzed corruption", () => {
      const count = 1000;
      let validPassed = 0;
      let fuzzedRejected = 0;

      for (let i = 0; i < count; i++) {
        const analysisId = `analysis-fuzz-${i}-${crypto.randomBytes(4).toString("hex")}`;
        const uid = `uid-${i}-${crypto.randomBytes(4).toString("hex")}`;

        // 1. Valid sign & verify
        const token = signAnalysisToken(analysisId, uid);
        const verified = verifyAnalysisToken(token);
        if (verified?.analysisId === analysisId && verified?.uid === uid) {
          validPassed++;
        }

        // 2. Fuzzing: randomly mutate payload or HMAC
        const parts = token.split(".");
        let corrupted: string;
        const mode = i % 4;

        if (mode === 0) {
          // Mutate payload
          corrupted = parts[0]!.slice(0, -2) + "==" + "." + parts[1];
        } else if (mode === 1) {
          // Mutate HMAC
          const h = parts[1]!;
          const mutatedHmac = h.slice(0, 10) + (h[10] === "a" ? "b" : "a") + h.slice(11);
          corrupted = parts[0] + "." + mutatedHmac;
        } else if (mode === 2) {
          // Truncate
          corrupted = token.slice(0, Math.floor(token.length / 2));
        } else {
          // Random garbage
          corrupted = crypto.randomBytes(32).toString("hex");
        }

        if (verifyAnalysisToken(corrupted) === null) {
          fuzzedRejected++;
        }
      }

      expect(validPassed).toBe(count);
      expect(fuzzedRejected).toBe(count);
    });
  });
});
