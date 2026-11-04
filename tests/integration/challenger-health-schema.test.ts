import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We mock dependencies before importing GET
vi.mock("@/server/clients/firebase-admin", () => ({
  getAdminFirestore: vi.fn(),
  getAdminAuth: vi.fn(),
}));

vi.mock("@/lib/server-env", () => ({
  getServerEnv: vi.fn(),
}));

import { GET } from "@/app/api/health/route";
import { getAdminFirestore, getAdminAuth } from "@/server/clients/firebase-admin";
import { getServerEnv } from "@/lib/server-env";

describe("Milestone 2 Challenger: /api/health Schema & Resiliency Contract", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default healthy environment mock
    vi.mocked(getServerEnv).mockReturnValue({
      APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      FIREBASE_ADMIN_PROJECT_ID: "civic-pulse-4a203",
      FIREBASE_ADMIN_CLIENT_EMAIL: "admin@civic-pulse-4a203.iam.gserviceaccount.com",
      FIREBASE_ADMIN_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3\n-----END PRIVATE KEY-----\n",
      GEMINI_API_KEY: "test-gemini-key",
      ANALYSIS_TOKEN_SECRET: "01234567890123456789012345678901",
      DEMO_MODE: "true",
      DEMO_PASSWORD: "demo-password",
      DEMO_ADMIN_PASSWORD: "admin-password",
      CRON_SECRET: "cron-secret-32-chars-long-valid",
    } as any);

    // Default healthy Firestore mock
    const mockLimit = vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
    });
    const mockOrderBy = vi.fn().mockReturnValue({
      limit: mockLimit,
    });
    const mockWhere = vi.fn().mockReturnValue({
      orderBy: mockOrderBy,
    });
    const mockCollection = vi.fn().mockImplementation((name: string) => {
      if (name === "complaints") {
        return { where: mockWhere };
      }
      return { limit: mockLimit };
    });

    vi.mocked(getAdminFirestore).mockReturnValue({
      collection: mockCollection,
    } as any);

    // Default healthy Auth mock
    vi.mocked(getAdminAuth).mockReturnValue({
      listUsers: vi.fn().mockResolvedValue({ users: [] }),
    } as any);

    // Default healthy Gemini probe fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ models: [] }),
    } as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("1. Schema & Contract Compliance (§R2.4, PROJECT.md #2)", () => {
    it("returns HTTP 200 with strictly boolean keys when all services are healthy", async () => {
      const response = await GET();
      expect(response.status).toBe(200);

      const json = await response.json();
      const keys = Object.keys(json).sort();

      // Exactly the 5 required contract keys
      expect(keys).toEqual(["auth", "envOk", "firestore", "gemini", "indexesHint"].sort());

      // Every key must be boolean
      expect(typeof json.firestore).toBe("boolean");
      expect(typeof json.auth).toBe("boolean");
      expect(typeof json.gemini).toBe("boolean");
      expect(typeof json.envOk).toBe("boolean");
      expect(typeof json.indexesHint).toBe("boolean");

      // In happy path, all must be true
      expect(json.firestore).toBe(true);
      expect(json.auth).toBe(true);
      expect(json.gemini).toBe(true);
      expect(json.envOk).toBe(true);
      expect(json.indexesHint).toBe(true);
    });

    it("sets strict no-cache headers to prevent proxy staleness", async () => {
      const response = await GET();
      const cacheControl = response.headers.get("Cache-Control");
      expect(cacheControl).toBe("no-store, no-cache, must-revalidate");
    });

    it("strictly isolates secrets and never exposes keys or internal errors in payload", async () => {
      const response = await GET();
      const bodyText = JSON.stringify(await response.json());

      expect(bodyText).not.toContain("test-gemini-key");
      expect(bodyText).not.toContain("PRIVATE KEY");
      expect(bodyText).not.toContain("cron-secret");
      expect(bodyText).not.toContain("civic-pulse-4a203");
      expect(bodyText).not.toContain("error");
      expect(bodyText).not.toContain("stack");
    });
  });

  describe("2. Adversarial Failure State Coverage", () => {
    it("returns HTTP 503 and firestore=false + indexesHint=false when Firestore probe throws", async () => {
      vi.mocked(getAdminFirestore).mockReturnValue({
        collection: vi.fn().mockImplementation(() => {
          throw new Error("Firestore connection refused (UNAVAILABLE)");
        }),
      } as any);

      const response = await GET();
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.firestore).toBe(false);
      expect(json.indexesHint).toBe(false);
      expect(json.auth).toBe(true);
      expect(json.gemini).toBe(true);
      expect(json.envOk).toBe(true);
    });

    it("returns HTTP 503 and auth=false when Firebase Auth probe fails", async () => {
      vi.mocked(getAdminAuth).mockReturnValue({
        listUsers: vi.fn().mockRejectedValue(new Error("Auth service account token expired")),
      } as any);

      const response = await GET();
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.auth).toBe(false);
      expect(json.firestore).toBe(true);
      expect(json.gemini).toBe(true);
      expect(json.envOk).toBe(true);
      expect(json.indexesHint).toBe(true);
    });

    it("returns HTTP 503 and gemini=false when Gemini endpoint returns error status or times out", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      } as any);

      const response = await GET();
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.gemini).toBe(false);
      expect(json.firestore).toBe(true);
      expect(json.auth).toBe(true);
      expect(json.envOk).toBe(true);
      expect(json.indexesHint).toBe(true);
    });

    it("returns HTTP 503 and envOk=false when required environment variable is missing", async () => {
      vi.mocked(getServerEnv).mockImplementation(() => {
        throw new Error("Missing required environment variable: GEMINI_API_KEY");
      });

      const response = await GET();
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.envOk).toBe(false);
      expect(json.gemini).toBe(false); // No API key available to probe
    });

    it("returns HTTP 503 and indexesHint=false when composite index query fails (e.g. index building)", async () => {
      const mockLimit = vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: [], empty: true }),
      });
      const mockOrderBy = vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          get: vi.fn().mockRejectedValue(new Error("FAILED_PRECONDITION: The query requires an index")),
        }),
      });
      const mockWhere = vi.fn().mockReturnValue({
        orderBy: mockOrderBy,
      });

      vi.mocked(getAdminFirestore).mockReturnValue({
        collection: vi.fn().mockImplementation((name: string) => {
          if (name === "complaints") {
            return { where: mockWhere };
          }
          return { limit: mockLimit };
        }),
      } as any);

      const response = await GET();
      expect(response.status).toBe(503);

      const json = await response.json();
      expect(json.firestore).toBe(true);
      expect(json.indexesHint).toBe(false);
      expect(json.auth).toBe(true);
      expect(json.gemini).toBe(true);
      expect(json.envOk).toBe(true);
    });
  });
});
