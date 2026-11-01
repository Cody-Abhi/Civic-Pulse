import type { ComplaintCategory, CategoryConfig, Weights, Bands } from "./types";
import { CATEGORIES } from "./schemas";

/**
 * Default category configuration (§29.3). Editable by admin at runtime
 * (systemSettings/categories); these are the seed defaults.
 * SLA hours are prototype demonstration values, not official standards.
 */
export const CATEGORY_CONFIG: Record<ComplaintCategory, CategoryConfig> = {
  GARBAGE: {
    category: "GARBAGE",
    departmentId: "swm",
    baseSeverity: 2,
    slaHours: 48,
    timeSensitive: false,
    seasonMonths: [],
  },
  POTHOLE: {
    category: "POTHOLE",
    departmentId: "roads",
    baseSeverity: 3,
    slaHours: 72,
    timeSensitive: true,
    seasonMonths: [6, 7, 8, 9, 10, 11],
  },
  STREETLIGHT: {
    category: "STREETLIGHT",
    departmentId: "electrical",
    baseSeverity: 3,
    slaHours: 72,
    timeSensitive: true,
    seasonMonths: [], // all year
  },
  WATER_LEAK: {
    category: "WATER_LEAK",
    departmentId: "water",
    baseSeverity: 3,
    slaHours: 48,
    timeSensitive: true,
    seasonMonths: [3, 4, 5],
  },
  DRAINAGE: {
    category: "DRAINAGE",
    departmentId: "drainage",
    baseSeverity: 4,
    slaHours: 48,
    timeSensitive: true,
    seasonMonths: [5, 6, 7, 8, 9, 10, 11],
  },
  SANITATION: {
    category: "SANITATION",
    departmentId: "health",
    baseSeverity: 2,
    slaHours: 48,
    timeSensitive: false,
    seasonMonths: [],
  },
  INFRASTRUCTURE: {
    category: "INFRASTRUCTURE",
    departmentId: "roads",
    baseSeverity: 3,
    slaHours: 120,
    timeSensitive: false,
    seasonMonths: [],
  },
  OTHER: {
    category: "OTHER",
    departmentId: "general",
    baseSeverity: 1,
    slaHours: 168,
    timeSensitive: false,
    seasonMonths: [],
  },
};

/** Department id for a category (used by duplicate `cat` component and routing). */
export function departmentOf(category: ComplaintCategory): string {
  return CATEGORY_CONFIG[category].departmentId;
}

export const DEPARTMENT_IDS = [
  "swm",
  "roads",
  "electrical",
  "water",
  "drainage",
  "health",
  "general",
] as const;

export const DEFAULT_WEIGHTS_VERSION = 3;

/** Priority factor weights (§29.1); sum to 1. */
export const DEFAULT_WEIGHTS: Weights = {
  S: 0.25,
  H: 0.2,
  R: 0.15,
  D: 0.15,
  A: 0.1,
  G: 0.1,
  T: 0.05,
};

/** Band thresholds (§29.2): CRITICAL ≥70, HIGH ≥50, MEDIUM ≥30, else LOW. */
export const DEFAULT_BANDS: Bands = { critical: 70, high: 50, medium: 30 };

/** Duplicate detection settings (§28.4); overridable via systemSettings/duplicate. */
export const DUPLICATE_SETTINGS = {
  radiusM: 500,
  windowDays: 30,
  c0: 0.6,
  c1: 0.92,
  weights: { text: 0.45, geo: 0.25, category: 0.15, time: 0.15 },
  likely: 0.8,
  possible: 0.65,
  textFloorForLikely: 0.5,
} as const;

export type DuplicateSettings = typeof DUPLICATE_SETTINGS;

export { CATEGORIES };
