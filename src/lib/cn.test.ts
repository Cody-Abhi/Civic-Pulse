import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class values", () => {
    expect(cn("a", false, "b", undefined, "c")).toBe("a b c");
  });

  it("de-duplicates conflicting Tailwind utilities (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
