import { describe, it, expect } from "vitest";
import { parsePrivateKey, clientEnvSchema, serverEnvSchema, REQUIRED_PROD_ENV_VARS } from "./env-schema";
import { checkEnv } from "../../scripts/check-env";

describe("Environment Schema & Private Key Parser (§40, R2)", () => {
  it("normalizes multiline RSA private keys with escaped newlines and wrapping quotes", () => {
    const rawKeyWithDoubleQuotes =
      '"-----BEGIN PRIVATE KEY-----\\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n"';
    const parsed = parsePrivateKey(rawKeyWithDoubleQuotes);

    expect(parsed).toBeDefined();
    expect(parsed?.startsWith('"')).toBe(false);
    expect(parsed?.endsWith('"')).toBe(false);
    expect(parsed).toContain("\n");
    expect(parsed).not.toContain("\\n");
    expect(parsed?.startsWith("-----BEGIN PRIVATE KEY-----")).toBe(true);
    expect(parsed?.endsWith("-----END PRIVATE KEY-----")).toBe(true);
  });

  it("normalizes single-quoted keys and whitespace", () => {
    const rawKeyWithSingleQuotes =
      "  '-----BEGIN PRIVATE KEY-----\\nLINE1\\nLINE2\\n-----END PRIVATE KEY-----'  ";
    const parsed = parsePrivateKey(rawKeyWithSingleQuotes);

    expect(parsed).toBeDefined();
    expect(parsed?.startsWith("'")).toBe(false);
    expect(parsed?.endsWith("'")).toBe(false);
    expect(parsed).toBe("-----BEGIN PRIVATE KEY-----\nLINE1\nLINE2\n-----END PRIVATE KEY-----");
  });

  it("handles undefined or empty key cleanly", () => {
    expect(parsePrivateKey(undefined)).toBeUndefined();
    expect(parsePrivateKey("")).toBeUndefined();
    expect(parsePrivateKey("   ")).toBeUndefined();
  });

  it("validates clientEnvSchema defaults and public fields", () => {
    const result = clientEnvSchema.safeParse({
      NEXT_PUBLIC_APP_URL: "https://example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.CITY_ID).toBe("blr");
      expect(result.data.CITY_NAME).toBe("Bengaluru");
      expect(result.data.DEMO_MODE).toBe(true);
    }
  });

  it("validates serverEnvSchema rejects short ANALYSIS_TOKEN_SECRET", () => {
    const result = serverEnvSchema.safeParse({
      GEMINI_API_KEY: "valid-key",
      ANALYSIS_TOKEN_SECRET: "too-short",
    });
    expect(result.success).toBe(false);
  });

  it("validates serverEnvSchema accepts valid secrets", () => {
    const result = serverEnvSchema.safeParse({
      GEMINI_API_KEY: "valid-key",
      ANALYSIS_TOKEN_SECRET: "12345678901234567890123456789012", // 32 chars
      CRON_SECRET: "cron-secret-16chars",
    });
    expect(result.success).toBe(true);
  });

  it("ensures REQUIRED_PROD_ENV_VARS includes all mandated variables", () => {
    const names = REQUIRED_PROD_ENV_VARS.map((v) => v.name);
    expect(names).toContain("APP_URL");
    expect(names).toContain("NEXT_PUBLIC_APP_URL");
    expect(names).toContain("NEXT_PUBLIC_FIREBASE_API_KEY");
    expect(names).toContain("FIREBASE_ADMIN_PROJECT_ID");
    expect(names).toContain("FIREBASE_ADMIN_CLIENT_EMAIL");
    expect(names).toContain("FIREBASE_ADMIN_PRIVATE_KEY");
    expect(names).toContain("GEMINI_API_KEY");
    expect(names).toContain("ANALYSIS_TOKEN_SECRET");
    expect(names).toContain("DEMO_MODE");
    expect(names).toContain("NEXT_PUBLIC_DEMO_MODE");
    expect(names).toContain("DEMO_PASSWORD");
    expect(names).toContain("DEMO_ADMIN_PASSWORD");
    expect(names).toContain("CRON_SECRET");
  });

  it("checkEnv reports missing variables accurately", () => {
    const originalEnv = { ...process.env };
    try {
      delete process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      delete process.env.FIREBASE_ADMIN_PRIVATE_KEY;
      const res = checkEnv();
      expect(res.valid).toBe(false);
      const missingNames = res.missing.map((m) => m.name);
      expect(missingNames).toContain("FIREBASE_ADMIN_CLIENT_EMAIL");
      expect(missingNames).toContain("FIREBASE_ADMIN_PRIVATE_KEY");
    } finally {
      process.env = originalEnv;
    }
  });
});
