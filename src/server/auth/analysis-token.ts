import "server-only";
import crypto from "crypto";
import { getServerEnv } from "@/lib/server-env";

export interface VerifiedAnalysisToken {
  analysisId: string;
  uid: string;
}

/**
 * Signs an analysis token using HMAC-SHA256 (§27.2, §40).
 */
export function signAnalysisToken(analysisId: string, uid: string): string {
  const env = getServerEnv();
  const secret = env.ANALYSIS_TOKEN_SECRET;
  const exp = Date.now() + 2 * 3600 * 1000; // 2 hours validity
  const payload = `${analysisId}:${uid}:${exp}`;
  const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64url")}.${hmac}`;
}

/**
 * Verifies and decodes an analysis token (§27.2, §40).
 */
export function verifyAnalysisToken(token: string): VerifiedAnalysisToken | null {
  try {
    const [encodedPayload, receivedHmac] = token.split(".");
    if (!encodedPayload || !receivedHmac) return null;

    const env = getServerEnv();
    const secret = env.ANALYSIS_TOKEN_SECRET;
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (
      receivedHmac.length !== expectedHmac.length ||
      !crypto.timingSafeEqual(
        Buffer.from(receivedHmac, "utf-8"),
        Buffer.from(expectedHmac, "utf-8"),
      )
    ) {
      return null;
    }

    const [analysisId, uid, expStr] = payload.split(":");
    if (!analysisId || !uid || !expStr) return null;

    const exp = parseInt(expStr, 10);
    if (isNaN(exp) || Date.now() > exp) return null;

    return { analysisId, uid };
  } catch {
    return null;
  }
}
