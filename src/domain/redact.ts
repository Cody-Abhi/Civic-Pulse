/**
 * PII redaction before any text leaves for Gemini (PRD-AI-004, §36.4).
 * Pure and deterministic. Redaction failure must abort the AI call (handled by
 * the caller) — this function never throws, it only redacts.
 *
 * CivicPulse does not collect phone numbers or addresses, but citizens may type
 * them into free text, so we strip emails, phone numbers (incl. +91 formats),
 * Aadhaar-like IDs, long digit runs, URLs and @handles.
 */

const PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ["email", /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g],
  ["url", /\bhttps?:\/\/[^\s]+/gi],
  ["aadhaar", /\b\d{4}\s\d{4}\s\d{4}\b/g],
  ["phone_intl", /\+91[\s-]?\d{5}[\s-]?\d{5}\b/g],
  ["phone_sep", /\b[6-9]\d{4}[\s-]\d{5}\b/g],
  ["phone_10", /\b[6-9]\d{9}\b/g],
  ["digits_long", /\b\d{7,}\b/g],
  ["handle", /(^|[^\w@])@[A-Za-z0-9_]{2,}/g],
];

const TOKEN = "[redacted]";

export interface RedactionResult {
  text: string;
  redactedCount: number;
  categories: string[];
}

export function redactPII(input: string): RedactionResult {
  let text = input;
  let total = 0;
  const categories: string[] = [];

  for (const [name, re] of PATTERNS) {
    let countForPattern = 0;
    text = text.replace(re, (match: string, lead?: string) => {
      countForPattern += 1;
      // The @handle pattern captures a leading boundary char we must preserve.
      if (name === "handle" && typeof lead === "string") return `${lead}${TOKEN}`;
      return TOKEN;
    });
    if (countForPattern > 0) {
      total += countForPattern;
      categories.push(name);
    }
  }

  return { text, redactedCount: total, categories };
}

/** Convenience guard: true when the input contained any PII. */
export function containsPII(input: string): boolean {
  return redactPII(input).redactedCount > 0;
}
