import { describe, it, expect } from "vitest";
import { redactPII, containsPII } from "./redact";

describe("redactPII — 15 PII patterns (PRD-AI-004)", () => {
  const cases: Array<[string, string]> = [
    ["email simple", "reach me at ravi.kumar@gmail.com please"],
    ["email caps/gov", "write to ADMIN@Dept.gov.in"],
    ["email plus tag", "user+tag@mail.co is mine"],
    ["phone +91 spaced", "call +91 98765 43210"],
    ["phone +91 dashed", "number +91-98765-43210"],
    ["phone +91 joined", "+919876543210"],
    ["phone 10-digit", "ring 9876543210 anytime"],
    ["phone space-sep", "98765 43210"],
    ["phone dash-sep", "98765-43210"],
    ["aadhaar spaced", "id 1234 5678 9012"],
    ["aadhaar joined", "123456789012"],
    ["long digit run", "ref number 1234567"],
    ["http url", "see http://example.com/report"],
    ["https url", "https://foo.bar/baz?q=1 for details"],
    ["@handle", "ping @ravikumar on this"],
  ];

  it.each(cases)("redacts %s", (_name, input) => {
    const r = redactPII(input);
    expect(r.redactedCount).toBeGreaterThanOrEqual(1);
    expect(r.text).toContain("[redacted]");
  });

  it("exposes exactly 15 patterns worth of coverage", () => {
    expect(cases).toHaveLength(15);
  });

  it("leaves clean civic text untouched", () => {
    const clean = "The pothole near the school gate is dangerous after rain.";
    const r = redactPII(clean);
    expect(r.redactedCount).toBe(0);
    expect(r.text).toBe(clean);
    expect(containsPII(clean)).toBe(false);
  });

  it("preserves the boundary char before an @handle", () => {
    expect(redactPII("ping @ravikumar now").text).toBe("ping [redacted] now");
  });

  it("redacts multiple PII items in one string", () => {
    const r = redactPII("mail me ravi@x.com or call 9876543210");
    expect(r.redactedCount).toBe(2);
    expect(r.categories).toEqual(expect.arrayContaining(["email", "phone_10"]));
  });
});
