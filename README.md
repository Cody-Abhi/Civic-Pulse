# CivicPulse AI

**Turning Citizen Voices into Intelligent City Action.**

CivicPulse AI turns a free-text civic report (garbage, potholes, streetlights,
water leaks, drainage, sanitation…) into a structured, located, de-duplicated
and **explainably prioritised** civic record in seconds — then tracks it through
to resolution.

> **Independent civic-tech prototype — not affiliated with any government body.**
> All on-screen KPIs in the demo are computed from synthetic data labelled
> "Demo data". Real-world statistics appear only where cited (see
> [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)).

## Three differentiators

1. **Priority Receipt** — every complaint carries a transparent, itemised 0–100
   score. Deterministic and auditable (§29), not an AI black box.
2. **Duplicate Radar** — similar nearby reports surface *before* submission;
   citizens "Add my voice" instead of filing duplicates. Authorities confirm
   links; nothing auto-merges.
3. **Ward Pulse Map + grounded AI insights** — hotspot map and Gemini insight
   briefs that cite the exact numbers they are based on.

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · Radix + shadcn-style primitives · Lucide · Motion |
| Backend | Firebase Auth + Cloud Firestore (**Spark**, no billing) · Firebase Admin SDK in Next.js Route Handlers |
| AI | Server-side `@google/genai` (Gemini) — advisory only; deterministic priority & fallbacks |
| Maps | MapLibre GL JS + OpenFreeMap (no key) |
| Hosting | Vercel Hobby |

**Zero-cost constraint:** no service in this architecture requires a payment
method. See [`docs/DECISIONS.md`](docs/DECISIONS.md) for version deviations and
[`docs/RUNBOOK.md`](docs/RUNBOOK.md) for setup/ops.

## Architecture rules

- **Clients never write Firestore.** All mutations go through authenticated
  Route Handlers (Admin SDK). `firestore.rules` are read-only (§24).
- **AI is advisory.** Gemini suggests category/summary/severity; the priority
  score is deterministic code; duplicates are never auto-merged.
- **`src/domain`** holds pure, framework-free logic (enforced by ESLint).
  **`src/server/*`** is server-only (`server-only` guard). Secrets never reach
  the browser (only `NEXT_PUBLIC_*` do).

## Getting started

```bash
pnpm install
cp .env.example .env.local     # fill in values — see docs/RUNBOOK.md
pnpm dev                       # http://localhost:3000
```

Quality commands:

```bash
pnpm typecheck      # tsc --noEmit (strict)
pnpm lint           # eslint (no any, no raw hex, domain purity)
pnpm test           # vitest unit + domain
pnpm verify:contrast # WCAG contrast check on design tokens
pnpm build          # next build
```

## Repository structure

See [`docs/`](docs/) and §43 of the PRD. Highlights:

```
src/app/         route groups: (public) (auth) (citizen) (authority) (admin) + api
src/features/    capability modules (auth, wizard, complaints, duplicates, …)
src/components/  presentational design-system components (ui, layout, data, ai, map, …)
src/domain/      pure logic: types, schemas, priority, transitions, duplicates, geo, metrics
src/server/      server-only: http, auth, services, repositories, clients, ai, notifications
firestore.rules  firestore.indexes.json  firebase.json
docs/            DECISIONS · RUNBOOK · DATA_SOURCES
```

## Licence & attributions

Code under [MIT](LICENSE). Ward boundaries © DataMeet (CC BY 4.0); base map
© OpenFreeMap / © OpenStreetMap contributors. Full list in
[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).
