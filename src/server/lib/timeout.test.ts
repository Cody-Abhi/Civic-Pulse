import { describe, it, expect, vi } from "vitest";
import { withFirestoreTimeout, FirestoreTimeoutError } from "./timeout";

describe("withFirestoreTimeout (PRD §36.1, Block C)", () => {
  it("resolves quickly when underlying promise succeeds within timeout", async () => {
    const fastPromise = Promise.resolve("success");
    const result = await withFirestoreTimeout(fastPromise, 100, "fastOp");
    expect(result).toBe("success");
  });

  it("rejects with FirestoreTimeoutError when promise exceeds timeoutMs", async () => {
    vi.useFakeTimers();
    try {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 10000));
      const timedOutPromise = withFirestoreTimeout(slowPromise, 6000, "slowOp");

      vi.advanceTimersByTime(6001);

      await expect(timedOutPromise).rejects.toThrowError(FirestoreTimeoutError);
      await expect(timedOutPromise).rejects.toMatchObject({
        code: "FIRESTORE_TIMEOUT",
        timeoutMs: 6000,
        operation: "slowOp",
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

