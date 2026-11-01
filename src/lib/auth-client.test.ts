import { describe, it, expect } from "vitest";
import { mapAuthError } from "@/lib/auth-client";

describe("mapAuthError (§UI-03, §UI-04, §UI-05)", () => {
  it("maps invalid-credential and wrong-password to generic message without user enumeration", () => {
    expect(mapAuthError({ code: "auth/invalid-credential" })).toBe("Email or password is incorrect.");
    expect(mapAuthError({ code: "auth/wrong-password" })).toBe("Email or password is incorrect.");
    expect(mapAuthError({ code: "auth/user-not-found" })).toBe("Email or password is incorrect.");
  });

  it("maps email-already-in-use to friendly sign-in suggestion", () => {
    expect(mapAuthError({ code: "auth/email-already-in-use" })).toBe(
      "An account with this email already exists. Sign in instead.",
    );
  });

  it("maps weak password", () => {
    expect(mapAuthError({ code: "auth/weak-password" })).toBe(
      "Use at least 8 characters with both letters and numbers.",
    );
  });

  it("maps rate limits and network errors", () => {
    expect(mapAuthError({ code: "auth/too-many-requests" })).toBe(
      "Too many attempts. Try again in a few minutes or reset your password.",
    );
    expect(mapAuthError({ code: "auth/network-request-failed" })).toBe(
      "Can't reach the server. Check your connection.",
    );
  });

  it("maps account suspension", () => {
    expect(mapAuthError({ code: "ACCOUNT_SUSPENDED" })).toBe(
      "Your account has been suspended. Please contact administrator support.",
    );
  });
});

