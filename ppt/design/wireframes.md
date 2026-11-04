# Slide Wireframes & 5-Second Tests: CivicPulse AI

16:9 Canvas (1920 × 1080 px). 96 px outer margins. Strict 12-column grid. Body text ≤ 45 words per slide.

---

## Slide 1: A streetlight, reported three times

### 5-Second Test Takeaway
**"Civic complaints overwhelm municipal queues without ranking; citizens report into the dark while engineers struggle to identify real safety risks."**

### ASCII Wireframe
```
+----------------------------------------------------------------------------------------------------+
| [MARGIN 96px]                                                                                      |
| +-----------------------------------------------+ +----------------------------------------------+ |
| |                                               | | [Logo] CivicPulse AI                         | |
| |                                               | | Turning citizen voices into city action      | |
| |                                               | | -------------------------------------------- | |
| |  [HERO PHOTOGRAPH - 60% WIDTH]                | | "A streetlight, reported three times"        | |
| |                                               | |                                              | |
| |  Dusk on residential Bengaluru street.        | | Asha reported the dark streetlight near her  | |
| |  Dark streetlight beside bus shelter.         | | bus stop three times in two weeks. It sat    | |
| |  Wet road reflecting distant warm shop light. | | unranked in a 60-ticket queue.               | |
| |  Lone commuter waiting in shadows.            | | (Illustrative scenario)                      | |
| |  (Calm, realistic documentary photography)    | | -------------------------------------------- | |
| |                                               | | 126,974         31.4%           58%          | |
| |                                               | | BBMP reports    Streetlights    Roads fixed  | |
| |                                               | | in ~5.5 mo      of total        resolution   | |
| |                                               | |                                              | |
| |                                               | | Source: OpenCity BBMP analysis, Jul 2025     | |
| |                                               | | -------------------------------------------- | |
| |                                               | | Personas: [Citizen: Asha] [Engineer: Kavitha]| |
| +-----------------------------------------------+ +----------------------------------------------+ |
| [MARGIN 96px]                                                                                      |
+----------------------------------------------------------------------------------------------------+
```

---

## Slide 2: Reports pile up. Nothing gets ranked.

### 5-Second Test Takeaway
**"First-come queues bury hazards and silence citizens; CivicPulse introduces an end-to-end deduplicated, prioritised intelligence workflow."**

### ASCII Wireframe
```
+----------------------------------------------------------------------------------------------------+
| [MARGIN 96px]                                                                                      |
| Title: Reports pile up. Nothing gets ranked.                                                       |
| Subtitle: CivicPulse turns every report into ranked, located action.                               |
|                                                                                                    |
| +---------------------------------------+   +----------------------------------------------------+ |
| | TODAY: Static First-Come Queues       |   | WITH CIVICPULSE: Closed-Loop Intelligence          | |
| |                                       |   |                                                    | |
| | [Icon: Copy] Duplicate inflation      |   | [1. Report]    Free text, photo & map location     | |
| | Same broken light filed 5 times;      |   |      |                                             | |
| | creates artificial backlogs.          |   | [2. AI Read]   Extracts category, summary, hazard  | |
| |                                       |   |      |                                             | |
| | [Icon: Alert] Blind queues            |   | [3. Radar]     Finds nearby matches (500m / 30d)   | |
| | Critical hazards wait behind minor    |   |      |                                             | |
| | cosmetic complaints.                  |   | [4. Prioritise] Transparent 0-100 score receipt    | |
| |                                       |   |      |                                             | |
| | [Icon: Mute] Citizen silence          |   | [5. Resolve]   Targeted dispatch & closed-loop SMS | |
| | No updates sent back; citizen trust   |   |                                                    | |
| | erodes, triggering duplicate reports. |   | (5-Step Horizontal Flow Diagram with Clean Icons)  | |
| +---------------------------------------+   +----------------------------------------------------+ |
| [MARGIN 96px]                                                                                      |
+----------------------------------------------------------------------------------------------------+
```

---

## Slide 3: AI suggests. Code decides. People confirm.

### 5-Second Test Takeaway
**"CivicPulse delivers explainable triage: AI understands the narrative, deterministic math scores the hazard, and human officers retain full control."**

### ASCII Wireframe
```
+----------------------------------------------------------------------------------------------------+
| [MARGIN 96px]                                                                                      |
| Title: AI suggests. Code decides. People confirm.                                                  |
| Subtitle: Transparent civic triage with zero black-box scoring.                                    |
|                                                                                                    |
| +-----------------------+   +-----------------------+   +----------------------------------------+ |
| | 1. Gemini AI Reads    |   | 2. Duplicate Radar    |   | 3. Priority Receipt                    | |
| | Extracts category,    |   | Scans 500m & 30 days; |   | Deterministic 0-100 score based on     | |
| | summary, and safety   |   | citizen adds voice,   |   | 7 audited factors. Gemini has zero     | |
| | hazards into JSON.    |   | engineer confirms link|   | influence over the final score.        | |
| +-----------------------+   +-----------------------+   +----------------------------------------+ |
|                                                                                                    |
| +------------------------------------------------------------------------------------------------+ |
| | SIGNATURE VISUAL: The Priority Receipt (Ledger Card - Worked Example E1 = 70 / CRITICAL)       | |
| | Ref: CP-BLR-2026-0842 | Location: Ward 150 (Bellandur) | Status: Triaged                       | |
| | ---------------------------------------------------------------------------------------------- | |
| | Severity (S) 25% : 4 of 5 base severity                        --> +18.75 pts                  | |
| | Safety Hazard (H) 20% : Injury risk reported                   --> +20.00 pts                  | |
| | Reports (R) 15% : 4 independent citizen reports                -->  +8.67 pts                  | |
| | Waiting Time (D) 15% : 20 h elapsed of 48 h SLA                -->  +3.13 pts                  | |
| | Affected Scale (A) 10% : School zone / transit hub (scale 1.0) --> +10.00 pts                  | |
| | Density Hotspot (G) 10% : 4 open issues within 500 m           -->  +4.00 pts                  | |
| | Seasonal Monsoon (T) 5% : Open drain active in monsoon         -->  +5.00 pts                  | |
| | ---------------------------------------------------------------------------------------------- | |
| | TOTAL SCORE: 70 / 100  [CRITICAL PRIORITY BAND]  (Formula: pure TypeScript src/domain/priority)| |
| +------------------------------------------------------------------------------------------------+ |
| [MARGIN 96px]                                                                                      |
+----------------------------------------------------------------------------------------------------+
```

---

## Slide 4: It works today

### 5-Second Test Takeaway
**"CivicPulse is an operational, fully responsive prototype deployed on production infrastructure and verifiable by judges in one click."**

### ASCII Wireframe
```
+----------------------------------------------------------------------------------------------------+
| [MARGIN 96px]                                                                                      |
| Title: It works today                                                                              |
| Subtitle: Live, end-to-end civic complaint triage deployed on production free tiers.              |
|                                                                                                    |
| +--------------------+  +--------------------------------+  +------------------------------------+ |
| | [DEVICE: PHONE]    |  | [DEVICE: LAPTOP]               |  | [CARD: JUDGE ACCESS & QR]          | |
| | Mobile Citizen     |  | Authority Triage Queue         |  | URL: civicpulse.vercel.app         | |
| | Report Wizard      |  | Ranked 0-100 tickets with      |  | [High-Res Clean QR Code]           | |
| | - AI category rec  |  | SLA countdown and severity     |  |                                    | |
| | - Duplicate Radar  |  | badges (Critical / High / Med) |  | 1-Click Demo Credentials:          | |
| | - Map pin drop     |  | - Status transition controls   |  | Citizen · Roads Authority · Admin  | |
| +--------------------+  +--------------------------------+  +------------------------------------+ |
|                                                                                                    |
| +------------------------------------------------------------------------------------------------+ |
| | Citizen journey strip: Citizen reports -> AI analyses -> Duplicate linked -> Engineer resolves | |
| +------------------------------------------------------------------------------------------------+ |
| [MARGIN 96px]                                                                                      |
+----------------------------------------------------------------------------------------------------+
```

---

## Slide 5: Built free, built to scale, built honestly

### 5-Second Test Takeaway
**"Zero software cost, auditable open standards, and genuine civic impact: reported once, prioritised, fixed, and communicated."**

### ASCII Wireframe
```
+----------------------------------------------------------------------------------------------------+
| [MARGIN 96px]                                                                                      |
| Title: Built free, built to scale, built honestly                                                  |
| Subtitle: Sustainable civic technology with open datasets and ₹0 infrastructure cost.             |
|                                                                                                    |
| +------------------------------------------------------------------------------------------------+ |
| | Architecture: Next.js 16 · Firebase Auth/Firestore · Gemini API · MapLibre + OpenFreeMap · Vercel| |
| | Free-tier guarantee: ₹0 monthly hosting & database costs on standard public tiers.             | |
| +------------------------------------------------------------------------------------------------+ |
|                                                                                                    |
| +--------------------------------------+   +-----------------------------------------------------+ |
| | OPEN DATA SOURCES & LICENCES         |   | PROTOTYPE EVALUATION (Labelled Prototype data)      | |
| | - BBMP Grievances (OpenCity.in)      |   |                                                     | |
| | - Ward Boundaries (DataMeet CC BY 4) |   | [240] Reports analysed & categorised                | |
| | - Base Maps (OpenFreeMap / ODbL)     |   | [18%] Duplicate reports averted via "Add my voice"  | |
| | - Synthetic Data (240 seeded cases)  |   | [<3s] Median time from report to ranked score       | |
| +--------------------------------------+   +-----------------------------------------------------+ |
|                                                                                                    |
| Next step: 1-ward municipal pilot with localized Hindi and Kannada voice ingestion.                |
| -------------------------------------------------------------------------------------------------- |
| CLOSING SIGNATURE: "Reported once. Prioritised. Fixed. And Asha knew."                             |
| [MARGIN 96px]                                                                                      |
+----------------------------------------------------------------------------------------------------+
```

