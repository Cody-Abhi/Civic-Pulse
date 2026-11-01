import { describe, it, expect } from "vitest";
import { classifyByKeywords } from "./keyword-classifier";

describe("classifyByKeywords (§27.6)", () => {
  it("classifies a pothole report, department roads, severity 3", () => {
    const { output } = classifyByKeywords("Huge pothole on 5th Main", "The road broken near the junction");
    expect(output.predictedCategory).toBe("POTHOLE");
    expect(output.recommendedDepartment).toBe("roads");
    expect(output.suggestedSeverity).toBe(3);
    expect(output.extractedKeywords).toContain("pothole");
  });

  it("classifies garbage with title weighting", () => {
    const { output } = classifyByKeywords("Garbage dump", "trash and waste everywhere");
    expect(output.predictedCategory).toBe("GARBAGE");
  });

  it("matches transliterated Hindi terms (naali → drainage)", () => {
    const { output } = classifyByKeywords("Problem", "naali is choked and sewage overflowing");
    expect(output.predictedCategory).toBe("DRAINAGE");
  });

  it("matches multi-word terms (street light)", () => {
    const { output } = classifyByKeywords("Issue", "the street light is off at night");
    expect(output.predictedCategory).toBe("STREETLIGHT");
  });

  it("falls back to OTHER when nothing matches and no hint", () => {
    const { output, score } = classifyByKeywords("Hello", "something unrelated entirely");
    expect(output.predictedCategory).toBe("OTHER");
    expect(output.confidence).toBe(0.2);
    expect(score).toBe(0);
  });

  it("uses the category hint on a no-match tie", () => {
    const { output } = classifyByKeywords("Hello", "unrelated", "SANITATION");
    expect(output.predictedCategory).toBe("SANITATION");
  });

  it("scales confidence with match count and caps at 0.6", () => {
    const one = classifyByKeywords("x", "pothole").output.confidence;
    expect(one).toBeCloseTo(0.3, 10);
    const many = classifyByKeywords(
      "drain naali gutter",
      "waterlogging flooded sewage choked",
    ).output.confidence;
    expect(many).toBe(0.6);
  });

  it("summary is the first sentence, capped at 140 chars", () => {
    const long = "A".repeat(200) + ". second sentence.";
    const { output } = classifyByKeywords("t", long);
    expect(output.shortSummary.length).toBeLessThanOrEqual(140);
  });
});
