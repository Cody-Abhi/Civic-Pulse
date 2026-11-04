# On-Slide Copy: CivicPulse AI Round 1 Pitch Deck

Every slide is strictly constrained to ≤ 45 words of on-slide body text. All supplementary context is placed in speaker notes. Tone is calm, professional, and free of marketing buzzwords.

---

## Slide 1: Cover & Everyday Problem

- **Slide Title:** A streetlight, reported three times
- **Brand Header:** CivicPulse AI — Turning citizen voices into intelligent city action
- **Illustrative Scenario:**
  > Asha reported the dark streetlight near her bus stop three times in two weeks. Each report sat unranked in a 60-ticket queue. *(Illustrative scenario)*
- **Data Points (Large Numbers + Clean Labels):**
  - **126,974** — BBMP grievances in ~5.5 months of 2025
  - **31.4%** — Streetlights alone
  - **58%** — Road maintenance resolved
- **Source Citation:** *Source: OpenCity analysis of BBMP data, Jul 2025.*
- **Personas:** Citizen (Asha) · Ward engineer (Kavitha)
- **Body Word Count:** 39 words (Excluding title & numbers; strictly ≤ 45 words).

---

## Slide 2: Problem Analysis & Solution Workflow

- **Slide Title:** Reports pile up. Nothing gets ranked.
- **Subtitle:** CivicPulse turns every report into ranked, located action.
- **Left Column (Today — Static First-Come Queues):**
  - Duplicate inflation: Same issue filed repeatedly, bloating backlogs.
  - Blind queues: Real safety hazards wait behind cosmetic tasks.
  - Citizen silence: No feedback sent back, destroying civic trust.
- **Right Column (With CivicPulse — Closed-Loop Intelligence):**
  - Horizontal 5-Step Flow:
    `Report` → `AI reads` → `Duplicate Radar` → `Priority score` → `Resolve & notify`
- **Body Word Count:** 34 words (Strictly ≤ 45 words).

---

## Slide 3: AI/ML Architecture & The Priority Receipt

- **Slide Title:** AI suggests. Code decides. People confirm.
- **Subtitle:** Transparent civic triage with zero black-box scoring.
- **Three Pillars:**
  1. **Gemini AI reads:** Extracts category, summary, and severity into structured JSON. Deterministic fallback if API fails.
  2. **Duplicate Radar:** Scans 500 m and 30 days. Citizen taps "Add my voice"; engineer confirms.
  3. **Priority Receipt:** 0–100 score from 7 weighted factors. Pure code; Gemini has zero influence.
- **Signature Visual:**
  - Priority Receipt card (Worked Example E1 = 70 / CRITICAL):
    Severity (18.75), Hazard (20.00), Reports (8.67), SLA age (3.13), School scale (10.00), Density (4.00), Season (5.00) = 70 pts.
- **Body Word Count:** 43 words (Strictly ≤ 45 words).

---

## Slide 4: Working Prototype Evidence

- **Slide Title:** It works today
- **Subtitle:** A verified prototype deployed on production free tiers.
- **Visuals:** 3 clean device frames:
  - Phone: Citizen report wizard with AI category suggestion
  - Laptop: Ward engineer priority triage queue
  - Tablet/Laptop: Live ward pulse map with geospatial clusters
- **Journey Strip:** Citizen reports → AI analyses → Duplicate linked → Engineer resolves → Citizen notified
- **Judge Access Card:**
  - Live URL: `civicpulse.vercel.app` + QR Code
  - 1-click demo roles on `/login`: Citizen, Roads Authority, Admin
- **Body Word Count:** 38 words (Strictly ≤ 45 words).

---

## Slide 5: Open Architecture, Data & Expected Impact

- **Slide Title:** Built free, built to scale, built honestly
- **Subtitle:** Open civic technology on ₹0 infrastructure.
- **Architecture Strip:** Next.js 16 · Firebase · Gemini API · MapLibre + OpenFreeMap · Vercel *(₹0 infrastructure on free tiers)*
- **Data & Licences:** DataMeet wards (CC BY 4.0) · OpenCity BBMP data · OpenStreetMap
- **Prototype Impact (Labelled Prototype data):**
  - **240** reports analysed
  - **18%** duplicate reports averted via "Add my voice"
  - **< 3s** median time from report to ranked score
- **Next Step:** Single-ward pilot; Kannada and Hindi localized voice ingestion.
- **Closing Signature:** *"Reported once. Prioritised. Fixed. And Asha knew."*
- **Body Word Count:** 41 words (Strictly ≤ 45 words).

