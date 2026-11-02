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

---

## Live Demo Accounts & Instant Sign-In

For testing and grading without manual registration, seeded demo credentials are pre-configured:

| Role | Account Email | Default Password | Workspace Capabilities |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@demo.civicpulse.invalid` | `CivicPulseDemo2026!` | 6-step complaint wizard, Priority Receipt, duplicate radar, status tracking, withdrawal (T2), resolution feedback (T8/T9). |
| **Authority** | `roads@demo.civicpulse.invalid` | `CivicPulseDemo2026!` | Department triage queue, priority matrix, SLA countdown, resolution evidence upload, status transitions. |
| **Administrator** | `admin@demo.civicpulse.invalid` | `CivicPulseDemo2026!` | Governance dashboard, role & department management, algorithm weights adjustment, audit logs export, AI rate limiting & pause. |

> On the `/login` page, click any of the **Quick Sign In** demo cards for 1-click credential population and authentication.

---

## Three Differentiators

1. **Priority Receipt** — every complaint carries a transparent, itemised 0–100 score. Deterministic, formulaic, and auditable (§29), never an opaque black box.
2. **Duplicate Radar** — similar nearby reports surface *before* submission; citizens "Add my voice" instead of filing duplicate tickets. Authorities confirm links; nothing auto-merges without human oversight.
3. **Ward Pulse Map + Grounded AI Insights** — live hotspot map with MapLibre GL and Gemini insight briefs that cite the exact metrics they analyze.

---

## Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Modern Civic Minimalism teal design tokens (`--cp-*`) · Geist Sans & Mono · Lucide React · Accessible Radix primitives |
| **Backend** | Firebase Auth + Cloud Firestore (Admin SDK) · Centralized `withApi` HTTP middleware (`/src/server/http/with-api.ts`) · Typed Repositories · Atomic transactions |
| **AI Processing** | Server-side `@google/genai` (Gemini 2.5 Flash) with strict deterministic fallback, HMAC analysis token verification, and administrative pause kill-switch |
| **Geospatial & Mapping** | MapLibre GL JS + OpenFreeMap (vector tiles) + DataMeet Bengaluru Ward boundary GeoJSON |
| **Deployment** | Vercel (Next.js Edge/Node runtime) + Firebase Emulator Suite for local development & automated test suites |

---

## Architecture Guarantees & Security

- **Zero Client Writes to Firestore**: All database mutations flow through authenticated route handlers guarded by the Firebase Admin SDK. Client-side security rules enforce read-only projections.
- **Centralized API Security (`withApi`)**: Strict origin validation (`Origin === APP_URL`), session cookie verification, role-based authorization, Zod body validation, and RFC 7807 error envelopes.
- **State Machine Integrity**: Status changes are validated against the 10 transition rules (§21.5), rejecting illegal or concurrent state modifications with HTTP 409 Conflict.
- **Pure Domain Core (`src/domain/`)**: Completely decoupled from framework dependencies and third-party libraries for zero-side-effect testability.
- **Comprehensive Accessibility**: Built to WCAG 2.1 AA standards with zero Axe core violations, high-contrast typography, keyboard navigation, and responsive scaling from 360px to 1440px.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- pnpm 9+
- Java JRE 11+ (required for Firebase Local Emulators)

### 2. Installation
```bash
git clone https://github.com/Cody-Abhi/Civic-Pulse.git
cd Civic-Pulse
pnpm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

### 4. Local Development with Emulators
Start the Firebase Auth & Firestore emulators, seed synthetic demo data, and launch Next.js:
```bash
# Terminal 1: Start Firebase local emulators
pnpm exec firebase emulators:start --only auth,firestore

# Terminal 2: Seed synthetic complaints, departments, and metrics
pnpm seed

# Terminal 3: Launch Next.js dev server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification & Test Suites

CivicPulse includes a rigorous, multi-tiered test suite covering unit tests, domain logic, security rules, and end-to-end user journeys:

```bash
# Typecheck (0 errors)
pnpm typecheck

# Linting & Token Guard (0 errors, 0 warnings)
pnpm lint

# Unit & Integration Tests (177 tests across 16 files)
pnpm test

# Firestore Security Rules Tests (12 security test cases)
pnpm test:rules

# Zero-404 Link Crawler E2E (Crawls all role routes with zero 404s)
pnpm exec playwright test tests/e2e/link-crawler.spec.ts

# Full Responsive & WCAG 2.1 AA Journeys
pnpm exec playwright test tests/e2e/journeys.spec.ts

# Production Build
pnpm build
```

---

## Production Deployment to Vercel

1. Push your repository to GitHub.
2. Import the project in the [Vercel Dashboard](https://vercel.com).
3. Configure the following environment variables in Vercel:
   - `APP_URL`: Production domain URL (e.g. `https://civicpulse.vercel.app`)
   - `NEXT_PUBLIC_APP_URL`: Production domain URL
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase web API key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: `<project-id>.firebaseapp.com`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: `<project-id>`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase Web App ID
   - `FIREBASE_ADMIN_PROJECT_ID`: Firebase project ID
   - `FIREBASE_ADMIN_CLIENT_EMAIL`: Service account email
   - `FIREBASE_ADMIN_PRIVATE_KEY`: Service account private key (with escaped `\n`)
   - `GEMINI_API_KEY`: Google AI Studio Gemini API key
   - `DEMO_MODE`: `"true"` (enables quick demo accounts)
   - `NEXT_PUBLIC_DEMO_MODE`: `"true"`
4. Deploy with Vercel CLI or Git push:
```bash
vercel --prod
```

---

## Licence & Attributions

Code licensed under [MIT](LICENSE). Ward boundaries © DataMeet (CC BY 4.0); vector base map tiles © OpenFreeMap / © OpenStreetMap contributors. See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for complete data citations.
