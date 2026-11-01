import type { ComplaintCategory } from "./types";
import { departmentOf, type DuplicateSettings } from "./categories";
import { haversineM, type LatLng } from "./geo";

/**
 * Duplicate detection (§28) — pure, explainable, offline-capable.
 * Primary text signal is sentence-embedding cosine; TF-IDF is the deterministic
 * fallback. Geo is a hard gate + component. Nothing is ever auto-merged.
 */

const SYNONYMS: Record<string, string> = {
  gaddha: "pothole",
  kachra: "garbage",
  kasa: "garbage",
  naali: "drain",
  batti: "light",
  paani: "water",
};

const STOPWORDS = new Set<string>([
  // English (small list)
  "the", "a", "an", "is", "are", "was", "were", "of", "to", "in", "on", "at",
  "and", "or", "for", "with", "this", "that", "it", "my", "our", "near", "by",
  "there", "here", "has", "have", "be", "as", "from",
  // Hinglish (§28.2)
  "hai", "ka", "ki", "ke", "ko", "se", "mein", "bahut", "please", "sir", "madam",
]);

function stem(token: string): string {
  if (token.length > 4) {
    for (const suf of ["ing", "ed", "es", "s"]) {
      if (token.endsWith(suf) && token.length - suf.length >= 3) {
        return token.slice(0, -suf.length);
      }
    }
  }
  return token;
}

/** Normalise free text to a canonical token string (§28.2). */
export function normalise(text: string): string {
  const cleaned = text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((t) => SYNONYMS[t] ?? t)
    .filter((t) => t.length > 0 && !STOPWORDS.has(t))
    .map(stem)
    .join(" ");
}

export type SparseVec = Map<string, number>;

export interface Tfidf {
  vec: (i: number) => SparseVec;
}

/** Build a TF-IDF model over already-normalised documents. */
export function buildTfidf(normalisedDocs: string[]): Tfidf {
  const docsTokens = normalisedDocs.map((d) => (d ? d.split(" ") : []));
  const n = docsTokens.length;
  const df = new Map<string, number>();
  for (const tokens of docsTokens) {
    for (const term of new Set(tokens)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const idf = (term: string): number =>
    Math.log((1 + n) / (1 + (df.get(term) ?? 0))) + 1;

  const vectors: SparseVec[] = docsTokens.map((tokens) => {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec: SparseVec = new Map();
    for (const [term, count] of tf) vec.set(term, count * idf(term));
    return vec;
  });

  return {
    vec: (i: number): SparseVec => vectors[i] ?? new Map(),
  };
}

export function cosineSparse(a: SparseVec, b: SparseVec): number {
  let dot = 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, wa] of small) {
    const wb = large.get(term);
    if (wb !== undefined) dot += wa * wb;
  }
  let na = 0;
  for (const w of a.values()) na += w * w;
  let nb = 0;
  for (const w of b.values()) nb += w * w;
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function cosine(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Map a raw embedding cosine into [0,1] using calibration bounds (§28.4). */
export function rescale(cos: number, c0: number, c1: number): number {
  return Math.min(1, Math.max(0, (cos - c0) / (c1 - c0)));
}

const round3 = (x: number): number => Math.round(x * 1000) / 1000;

export type DuplicateLabel = "LIKELY" | "POSSIBLE";

export interface QueryCtx {
  text: string;
  vector?: number[];
  point: LatLng;
  category: ComplaintCategory;
  atMs: number;
}

export interface Candidate {
  id: string;
  text: string;
  vector?: number[];
  point: LatLng;
  category: ComplaintCategory;
  createdAtMs: number;
}

export interface ScoredCandidate {
  id: string;
  score: number;
  label: DuplicateLabel;
  components: {
    text: number;
    geo: number;
    category: number;
    time: number;
    method: "embedding" | "tfidf";
  };
  distanceM: number;
  hoursApart: number;
}

/** Score candidates against a query; returns only labelled ones, best first. */
export function scoreCandidates(
  q: QueryCtx,
  cands: Candidate[],
  s: DuplicateSettings,
): ScoredCandidate[] {
  const useEmbedding = Boolean(q.vector) && cands.every((c) => Boolean(c.vector));
  const tfidf = useEmbedding
    ? null
    : buildTfidf([q.text, ...cands.map((c) => c.text)].map(normalise));

  const results: ScoredCandidate[] = [];
  cands.forEach((c, i) => {
    const text = useEmbedding
      ? rescale(cosine(q.vector as number[], c.vector as number[]), s.c0, s.c1)
      : cosineSparse((tfidf as Tfidf).vec(0), (tfidf as Tfidf).vec(i + 1));
    const d = haversineM(q.point, c.point);
    const geo = Math.max(0, 1 - (d / s.radiusM) ** 2);
    const cat =
      c.category === q.category
        ? 1
        : departmentOf(c.category) === departmentOf(q.category)
          ? 0.5
          : 0;
    const hours = Math.abs((q.atMs - c.createdAtMs) / 3_600_000);
    const time = Math.max(0, 1 - hours / (s.windowDays * 24));
    const score =
      s.weights.text * text +
      s.weights.geo * geo +
      s.weights.category * cat +
      s.weights.time * time;
    const label: DuplicateLabel | null =
      score >= s.likely && text >= s.textFloorForLikely
        ? "LIKELY"
        : score >= s.possible
          ? "POSSIBLE"
          : null;
    if (label) {
      results.push({
        id: c.id,
        score: round3(score),
        label,
        components: { text, geo, category: cat, time, method: useEmbedding ? "embedding" : "tfidf" },
        distanceM: Math.round(d),
        hoursApart: Math.round(hours),
      });
    }
  });
  return results.sort((a, b) => b.score - a.score);
}
