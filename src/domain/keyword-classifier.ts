import type { AIAnalysisOutput, ComplaintCategory } from "./types";
import { CATEGORY_CONFIG, departmentOf } from "./categories";

/**
 * Deterministic keyword fallback classifier (§27.6, PRD-AI-002). Runs whenever
 * Gemini is unavailable/invalid. English + transliterated Hindi/Kannada terms.
 */
const DICTIONARY: Record<Exclude<ComplaintCategory, "OTHER">, string[]> = {
  GARBAGE: ["garbage", "trash", "waste", "dump", "bin", "kachra", "kasa", "sweeping", "bbmp vehicle"],
  POTHOLE: ["pothole", "gaddha", "crater", "road broken", "broken road", "tar"],
  STREETLIGHT: ["streetlight", "street light", "lamp", "batti", "dark street", "pole light"],
  WATER_LEAK: ["leak", "pipe burst", "water wastage", "paani leak", "valve"],
  DRAINAGE: ["drain", "naali", "gutter", "waterlogging", "flooded", "sewage", "choked", "chocked"],
  SANITATION: ["toilet", "urinal", "public toilet", "shauchalay", "stink"],
  INFRASTRUCTURE: ["footpath", "manhole", "pavement", "signboard", "broken slab", "railing"],
};

const CATEGORY_ORDER = Object.keys(DICTIONARY) as Array<Exclude<ComplaintCategory, "OTHER">>;

export interface KeywordClassification {
  output: AIAnalysisOutput;
  matchedTerms: string[];
  score: number;
}

function firstSentence(text: string, max = 140): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const end = trimmed.search(/[.!?]/);
  const sentence = end === -1 ? trimmed : trimmed.slice(0, end + 1);
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

/** Classify by keyword matches. Title matches count double (§27.6). */
export function classifyByKeywords(
  title: string,
  description: string,
  categoryHint?: ComplaintCategory,
): KeywordClassification {
  const t = title.toLowerCase();
  const d = description.toLowerCase();

  let best: Exclude<ComplaintCategory, "OTHER"> | null = null;
  let bestScore = 0;
  let bestTerms: string[] = [];

  for (const category of CATEGORY_ORDER) {
    const terms = DICTIONARY[category];
    let score = 0;
    const matched: string[] = [];
    for (const term of terms) {
      const inTitle = t.includes(term);
      const inDesc = d.includes(term);
      if (inTitle || inDesc) {
        score += (inTitle ? 2 : 0) + (inDesc ? 1 : 0);
        matched.push(term);
      }
    }
    if (score > bestScore) {
      best = category;
      bestScore = score;
      bestTerms = matched;
    }
  }

  // Ties / no match → hint if usable, else OTHER.
  const category: ComplaintCategory =
    best ?? (categoryHint && categoryHint !== "OTHER" ? categoryHint : "OTHER");

  const matches = bestTerms.length;
  const confidence = Math.min(0.6, 0.2 + 0.1 * matches);
  const cfg = CATEGORY_CONFIG[category];
  const summary = firstSentence(description) || firstSentence(title) || "Civic issue reported.";

  const output: AIAnalysisOutput = {
    predictedCategory: category,
    shortSummary: summary,
    extractedKeywords: bestTerms,
    detectedIssue: summary,
    suggestedSeverity: cfg.baseSeverity,
    confidence,
    recommendedDepartment: departmentOf(category),
    reasoning: matches > 0 ? `Keyword match: ${bestTerms.join(", ")}` : "No strong keyword match.",
    possibleDuplicateIndicators: [],
  };

  return { output, matchedTerms: bestTerms, score: bestScore };
}
