# CivicPulse AI — Runbook

Operational guide for local dev, emulators, seeding, deploy and demo. Keep
`₹0`: Firebase **Spark** plan, no billing account anywhere.

## Prerequisites

- Node 22+, pnpm 10+, Java 11+ (Firebase emulators).
- A Firebase project on the **Spark** plan (see Setup).
- A Gemini API key (Google AI Studio, free tier).

## 1. Install

```bash
pnpm install
cp .env.example .env.local   # then fill in values (see §40 and Setup below)
```

## 2. Firebase setup (one-time, human steps)

1. **Create project** — console.firebase.google.com → Add project (e.g. `civicpulse-prod`). **Do not** enable billing / upgrade to Blaze.
2. **Auth** — Build → Authentication → Get started → Sign-in method → enable **Email/Password** and **Google**. Leave Phone disabled.
3. **Web app config** — Project settings → General → Your apps → Web → copy into `NEXT_PUBLIC_FIREBASE_*`.
4. **Admin service account** — Project settings → Service accounts → Generate new private key. Put `project_id`, `client_email`, `private_key` into `FIREBASE_ADMIN_*` (escape newlines as `\n`). Never commit the JSON.
5. **Gemini key** — aistudio.google.com/apikey → Create API key → `GEMINI_API_KEY`. Note the free-tier RPM/RPD.
6. **Secrets we generate** — `ANALYSIS_TOKEN_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

## 3. Local development

```bash
pnpm dev            # Next.js dev server on :3000
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm test           # vitest unit + domain
pnpm format         # prettier --write
```

## 4. Emulators (Auth + Firestore)

```bash
pnpm emulators      # firebase emulators:start (Auth :9099, Firestore :8080, UI :4000)
```
Set `NEXT_PUBLIC_USE_EMULATORS=true` to point the client/admin SDKs at the emulators.

## 5. Rules & indexes

```bash
pnpm test:rules                                   # @firebase/rules-unit-testing (RULES-001…012)
firebase deploy --only firestore:rules,firestore:indexes --project <id>
```

## 6. Seed & demo reset

```bash
pnpm seed           # load fixtures/seed/*.json (240 synthetic complaints, labelled "Demo data")
pnpm verify:metrics # assert aggregate counters match recomputation (zero drift)
```
Demo reset is done from `/admin/settings` (typed confirmation; only deletes
docs with `isSynthetic === true`; disabled when `DEMO_MODE=false`).

## 7. Deploy (Vercel Hobby)

- Link the GitHub repo to a Vercel **Hobby** project; production branch `main`.
- Set env vars in Vercel (Production/Preview separated). Never commit secrets.
- Build: `pnpm install --frozen-lockfile && pnpm build`.
- Deploy Firestore rules/indexes separately (step 5).

## 8. Quota exhaustion playbook (§42)

| Symptom | Action |
|---------|--------|
| Gemini 429 / budget | Automatic keyword + TF-IDF fallback; AI Monitoring shows the switch. |
| Firestore read/write quota | 503 + site banner with reset time (~13:30 IST). Static pages still load. |
| OpenFreeMap down | Map falls back to list; wizard uses ward centroid. |

## 9. Troubleshooting

- **Env error on boot** — the message lists missing/invalid vars (`src/lib/*env.ts`).
- **Emulators won't start** — ensure Java is installed and ports free.
- **Fonts fail at build** — `next/font/google` needs network at build; behind a proxy ensure Google Fonts hosts are reachable.
