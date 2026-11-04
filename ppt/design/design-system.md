# CivicPulse AI Design System (Pitch Deck Edition)

A bespoke, calm, editorial presentation design system built for the INNOVATE Online Hackathon 2026 Round 1 pitch deck. Rooted in "Modern Civic Minimalism" (`src/styles/tokens.css`).

---

## 1. Canvas & Grid Specifications

- **Aspect Ratio:** 16:9 widescreen
- **Resolution:** 1920 × 1080 px (13.333" × 7.500" in PowerPoint inches at 144 DPI)
- **Outer Margins:** 96 px on all four edges (Left: 96 px, Right: 96 px, Top: 96 px, Bottom: 96 px)
- **Safe Content Area:** 1728 × 888 px
- **Column System:** 12-column grid
  - Column Width: 120 px
  - Gutter: 24 px
  - 12 × 120 px + 11 × 24 px = 1440 + 264 = 1704 px (~1728 px with optical alignment)

---

## 2. Color Palette & Semantics

| Token | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Teal (Primary)** | `#0F766E` | Primary brand accent, primary CTA/step badges, key metrics |
| **Navy (Ink / Dark BG)** | `#172B36` | Text headings, deep dark card surfaces, Slide 1 dark contrast panel |
| **Gold (Accent)** | `#CA8A04` | Single restrained accent, priority indicator, high-value highlights |
| **Sage (Light BG)** | `#F5F8F7` | Standard slide canvas background |
| **Card White** | `#FFFFFF` | Elevated containers, device frames, data cards |
| **Border Soft** | `#E3E9EA` | Subtle card dividers and table lines |
| **Text Secondary** | `#475569` | Explanatory subtext, labels, captions |
| **Text Muted / Citations**| `#64748B` | Footnotes, source attributions, timestamps |

### Priority Spectrum
- **Critical:** Solid `#DC2626` | BG `#FCEBEA` | Text `#B42318`
- **High:** Solid `#EA580C` | BG `#FBF0E0` | Text `#9A4408`
- **Medium:** Solid `#CA8A04` | BG `#FBF4DE` | Text `#845607`
- **Low:** Solid `#64748B` | BG `#EAF0F4` | Text `#334E68`

---

## 3. Typography Scale & Hierarchy

Strict enforcement of minimum font sizes (no small illegible text):

| Role | Font Family | Size (pt) | Weight | Line Height | Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Slide Title** | Geist Sans / Arial | 32 pt (min 28 pt) | Bold (700) | 1.15 | Sentence case |
| **Slide Subtitle** | Geist Sans / Arial | 18 pt | Medium (500) | 1.25 | Sentence case |
| **Section / Card Header** | Geist Sans / Arial | 18–20 pt | SemiBold (600)| 1.25 | Sentence case |
| **Big Data Metric** | Geist Sans / Arial | 44–52 pt | Bold (700) | 1.05 | Numbers |
| **Metric Label** | Geist Sans / Arial | 13–14 pt | Medium (500) | 1.20 | Sentence case |
| **Body Paragraph** | Geist Sans / Arial | 14–15 pt | Regular (400) | 1.40 | Sentence case |
| **Ticket Reference** | Geist Mono / Consolas| 13 pt | Medium (500) | 1.20 | Monospace |
| **Source Citation** | Geist Sans / Arial | 11–12 pt | Regular (400) | 1.20 | Sentence case |

---

## 4. Visual Elements & Constraints

- **One Idea Per Slide:** Never combine unrelated concepts.
- **Body Text Budget:** Strictly ≤ 45 words of body text per slide (all context and expanded narrative belongs in the speaker notes).
- **Visual Budget:** At most 3 primary visual units per slide.
- **Card Styling:** Background `#FFFFFF`, border 1 px `#E3E9EA`, corner radius 14 px, subtle shadow `rgba(23, 43, 54, 0.06)`.
- **Iconography:** Lucide-style vector outlines, 1.75 stroke width, strictly functional (no decorative emojis).
- **Signature Visual:** The **Priority Receipt** — a crisp ledger-style card displaying the transparent 7-factor calculation for score 70 (CRITICAL).

