# Product Facts & Architecture: CivicPulse AI

This document establishes the verified codebase facts for the CivicPulse AI Round 1 pitch deck. Every claim in the deck must align with these verified realities.

---

## 1. Verified Architecture & Tech Stack

| Layer | Component | Implementation in Code | Free-Tier Verification |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | `src/app/**`, Tailwind CSS v4, tokens (`src/styles/tokens.css`), Geist Sans/Mono, Lucide React, Radix primitives | Free (Open source) |
| **Backend & Auth** | Firebase Admin SDK + Cloud Firestore + Firebase Auth | `src/server/clients/firebase-admin.ts`, session cookies, route handlers with `withApi` middleware | Firebase Spark Plan (Free tier) |
| **AI Processing** | `@google/genai` (Gemini API) | `src/server/services/ai.ts`, Gemini 2.5 Flash / 3.8 Flash + deterministic keyword classifier fallback | Google AI Studio (Free tier) |
| **Maps & Geo** | MapLibre GL JS + OpenFreeMap vector tiles + DataMeet GeoJSON | `src/components/map/**`, `src/domain/geo.ts`, `geo/wards.geojson` | 100% Free, no credit card or API key required |
| **Hosting** | Vercel | Production deployment on Edge/Node runtime | Vercel Hobby Plan (Free tier: ₹0 infrastructure) |

---

## 2. Real Priority Engine (§29 — `src/domain/priority.ts`)

- **Deterministic & Auditable:** Pure function `computePriority(inputs)`. **Gemini has 0 influence on the priority score.**
- **Scale:** 0 to 100 integer score.
- **7 Weighted Factors (Sum = 1.00 / 100%):**
  1. **Severity (S) — 25% (0.25):** `(severity - 1) / 4` (from base or engineer-verified severity 1–5).
  2. **Safety Hazard (H) — 20% (0.20):** `1` if any hazard flag present (`INJURY_RISK`, `EXPOSED_WIRING`, `DEEP_PIT`, `HEALTH_HAZARD`, etc.), else `0`.
  3. **Reports (R) — 15% (0.15):** Sublinear growth `clamp(ln(1 + u) / ln(11), 0, 1)`, where `u = reporters - 1`.
  4. **Waiting Time / SLA Age (D) — 15% (0.15):** `clamp(ageHours / (2 * slaHours), 0, 1)`.
  5. **Affected Scale (A) — 10% (0.10):** Direct multiplier based on location type (0.1 local alley to 1.0 school / arterial transit hub).
  6. **Hotspot / Density (G) — 10% (0.10):** `clamp(nearbyOpenClusters / 10, 0, 1)` within 500 m.
  7. **Season (T) — 5% (0.05):** `1` if category is time-sensitive in current month (e.g. potholes/drainage in monsoon), else `0`.
- **Priority Bands (`DEFAULT_BANDS`):**
  - **CRITICAL:** ≥ 70
  - **HIGH:** ≥ 50
  - **MEDIUM:** ≥ 30
  - **LOW:** < 30
- **Verified Worked Example E1 (Open Drain by School in November):**
  - Inputs: Severity 4, Hazard `INJURY_RISK`, 4 independent reporters, 20 h age of 48 h SLA, affected scale 1.0, 4 nearby open clusters, in season.
  - Calculated Points:
    - S: `100 * 0.25 * (3/4)` = 18.75 pts
    - H: `100 * 0.20 * 1.0` = 20.00 pts
    - R: `100 * 0.15 * (ln(4)/ln(11))` ≈ 8.67 pts
    - D: `100 * 0.15 * (20/96)` ≈ 3.125 pts
    - A: `100 * 0.10 * 1.0` = 10.00 pts
    - G: `100 * 0.10 * 0.4` = 4.00 pts
    - T: `100 * 0.05 * 1.0` = 5.00 pts
    - Raw Sum: 69.545 pts → `roundHalfUp(69.545)` = **70 points (CRITICAL)**.

---

## 3. Real Duplicate Radar (§28 — `src/domain/duplicates.ts`)

- **Spatial & Temporal Window:** Within **500 meters** and **30 days**.
- **Composite Score Formula:**
  - `score = 0.45 * text + 0.25 * geo + 0.15 * category + 0.15 * time`
  - **Text (45%):** Cosine similarity of sentence embeddings rescaled `[0.60, 0.92]`, with offline **TF-IDF sparse cosine** fallback on normalized Hinglish/English tokens.
  - **Geo (25%):** Parabolic distance decay: `1 - (distance / 500)^2`.
  - **Category (15%):** `1.0` exact match, `0.5` same department, `0` different department.
  - **Time (15%):** Linear recency decay: `1 - hours / (30 * 24)`.
- **Thresholds:**
  - `LIKELY` duplicate: `score ≥ 0.80` AND `text ≥ 0.50`.
  - `POSSIBLE` duplicate: `score ≥ 0.65`.
- **Human-in-the-Loop Protocol:**
  - Citizen is alerted before submitting and can tap **"Add my voice"** (increments reporter count on existing ticket).
  - If submitted anyway, it enters the authority queue linked as duplicate candidate.
  - An engineer **confirms** or **dismisses** the duplicate.
  - **Guaranteed non-negotiable rule:** The system NEVER auto-merges tickets without human confirmation.

---

## 4. Real AI Pipeline (§27 — `src/server/services/ai.ts`)

- **Role of AI:** Extracts structured JSON from citizen narrative: category (8 types), suggested severity (1–5), concise summary (≤140 chars), and duplicate indicators.
- **Privacy & Safety:**
  - Server-side PII redaction (`redactPII`) removes phone numbers, emails, Aadhaar formats before LLM call.
  - HMAC-SHA256 signed analysis tokens prevent client-side tampering of AI results.
- **Resilience & Governance:**
  - 100% deterministic keyword classifier fallback (`classifyByKeywords`) if AI is down, times out, or quota is hit.
  - Emergency admin kill-switch (`/api/admin/ai/pause`) to instantly halt external LLM calls.

---

## 5. Prototype Demo Data vs. Real Data

- **All on-screen metrics and tickets are generated from synthetic seed data:** 240 complaints across 8 categories and Bengaluru wards (`isSynthetic: true`).
- **Live Demo Roles on `/login`:**
  - **Citizen Demo:** `citizen@demo.civicpulse.invalid` (1-click login)
  - **Roads Authority Demo:** `roads@demo.civicpulse.invalid` (1-click login)
  - **Admin Demo:** `admin@demo.civicpulse.invalid`
- **Claim Verification Check:**
  - Slide plan claim: "126,974 BBMP grievances, 31.4% streetlights, 58% road maintenance resolved" → **Accurate external citation from OpenCity Jul 2025.**
  - Slide plan claim: "₹0 infrastructure on free tiers" → **Accurate: Vercel Hobby + Firebase Spark + Gemini Free Tier + OpenFreeMap.**
  - Slide plan claim: "AI suggests. Code decides. People confirm." → **100% matched in code.**

