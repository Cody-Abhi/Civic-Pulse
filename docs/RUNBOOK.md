# CivicPulse AI — Operational Runbook (§40, R2.5)

Production deployment and operational checklist for CivicPulse AI.

---

## Step 1: Firebase Setup & Authorized Domains

1. **Firebase Project Configuration**:
   - Access [Firebase Console](https://console.firebase.google.com/) and create or select project `civic-pulse-4a203` (Spark plan).
   - Navigate to **Build → Firestore Database** and click **Create database** (Location: `asia-south1` or default). Select **Start in production mode**.

2. **Authentication Configuration**:
   - Navigate to **Build → Authentication → Sign-in method**.
   - Enable **Email/Password** provider (ensure email enumeration protection is ON).
   - Enable **Google** sign-in provider. Leave Phone and other providers disabled.

3. **Authorized Domains (Mandatory)**:
   - In **Authentication**, switch to the **Settings** tab and select **Authorized domains**.
   - By default, `localhost` and `<project-id>.firebaseapp.com` are listed.
   - Click **Add domain** and enter your production Vercel domain (e.g. `<your-vercel-domain>.vercel.app` or custom domain).
   - *Failure to register the domain will cause all client-side authentication requests to fail with `auth/unauthorized-domain`.*

4. **Service Account Credentials**:
   - Navigate to **Project Settings (gear icon) → Service accounts**.
   - Under **Firebase Admin SDK**, select **Node.js** and click **Generate new private key**.
   - Securely store the downloaded JSON file (NEVER commit this file).
   - Note the fields: `project_id`, `client_email`, and `private_key`.

5. **Generate Cryptographic Secrets**:
   - `ANALYSIS_TOKEN_SECRET` (HMAC secret for analysis tokens, >= 32 chars):
     ```bash
     openssl rand -hex 32
     ```
   - `CRON_SECRET` (Bearer token for protected cron endpoints, >= 16 chars):
     ```bash
     openssl rand -hex 16
     ```
   - `DEMO_ADMIN_PASSWORD` (Strong secret password for the real administrator account):
     ```bash
     openssl rand -base64 18
     ```

---

## Step 2: Deploy Firestore Security Rules & Composite Indexes

1. **Deploy Rules and Indexes**:
   Execute the Firebase CLI deployment targeting `civic-pulse-4a203`:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes --project civic-pulse-4a203
   ```

2. **Wait for Composite Indexes**:
   - Open Firebase Console → **Firestore Database → Indexes → Composite**.
   - Verify that all composite indexes defined in `firestore.indexes.json` transition from **Building** to **Enabled**.
   - *Queries requiring composite indexes (e.g., department queue filtered by status and sorted by priority/date) will fail until indexes are fully enabled.*

---

## Step 3: Seed Production Database (`pnpm seed`)

Once Firestore indexes are enabled and service account credentials are ready:

1. Ensure the following variables are available in your environment:
   - `FIREBASE_ADMIN_PROJECT_ID=civic-pulse-4a203`
   - `FIREBASE_ADMIN_CLIENT_EMAIL=<service-account-email>`
   - `FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."`
   - `DEMO_PASSWORD=<chosen-demo-password>`
   - `DEMO_ADMIN_PASSWORD=<admin-secret-password>`

2. Run the production seed script:
   ```bash
   pnpm seed --prod
   ```

3. Verification:
   - The script connects to Cloud Firestore via Firebase Admin SDK (`cert`).
   - Seeds 240 synthetic complaints with 7-factor priority scores.
   - Creates citizen, authority, and admin users in Firebase Auth.
   - The administrator account (`admin@demo.civicpulse.invalid`) is seeded exclusively with `DEMO_ADMIN_PASSWORD`.

---

## Step 4: Vercel Import, Environment Variables & Deployment

1. **Import Project to Vercel**:
   - Log in to [Vercel Dashboard](https://vercel.com) and click **Add New → Project**.
   - Import your GitHub repository.
   - Assign a unique project name (e.g. `civicpulse-blr`).
   - Framework Preset: **Next.js**.

2. **Configure Environment Variables**:
   In Vercel **Project Settings → Environment Variables**, add the variables documented in `README.md` / `.env.example`:

   | Variable | Value | Environment |
   | :--- | :--- | :--- |
   | `APP_URL` | `https://<your-vercel-domain>.vercel.app` | Production |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>.vercel.app` | Production |
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Web API Key from Firebase Console | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `civic-pulse-4a203.firebaseapp.com` | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `civic-pulse-4a203` | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | Web App ID from Firebase Console | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID from Firebase Console | Production, Preview |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `civic-pulse-4a203.firebasestorage.app` | Production, Preview |
   | `FIREBASE_ADMIN_PROJECT_ID` | `civic-pulse-4a203` | Production |
   | `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account email | Production |
   | `FIREBASE_ADMIN_PRIVATE_KEY` | Multiline private key with `\n` | Production |
   | `GEMINI_API_KEY` | Google AI Studio API key | Production |
   | `ANALYSIS_TOKEN_SECRET` | 32-byte hex generated in Step 1 | Production |
   | `DEMO_MODE` | `true` | Production |
   | `NEXT_PUBLIC_DEMO_MODE` | `true` | Production |
   | `DEMO_PASSWORD` | Shared password for citizen/authority demos | Production |
   | `DEMO_ADMIN_PASSWORD` | Administrator password | Production |
   | `CRON_SECRET` | Bearer token for cron maintenance | Production |

3. **Verify Environment Completeness**:
   Run the pre-flight environment check:
   ```bash
   pnpm check:env
   ```

4. **Deploy**:
   Deploy directly via Git push to branch `main` or run:
   ```bash
   vercel --prod
   ```

---

## Step 5: Smoke Test & Health Check

1. **Verify Health Endpoint**:
   Perform a `GET` request to `/api/health`:
   ```bash
   curl -i https://<your-vercel-domain>.vercel.app/api/health
   ```
   Expected response (HTTP 200 OK):
   ```json
   {
     "firestore": true,
     "auth": true,
     "gemini": true,
     "envOk": true,
     "indexesHint": true
   }
   ```

2. **Verify User Journeys**:
   - **Citizen Journey**: Navigate to `/login`, click **Citizen Demo** (1-click sign in). Verify redirect to `/citizen`. File a test complaint with image attachment and verify Priority Receipt generation.
   - **Authority Journey**: Sign in as **Roads Authority Demo** via `/login`. Verify queue filters by Roads department and composite index query loads complaints instantly.
   - **Administrator Journey**: Sign in as `admin@demo.civicpulse.invalid` using `DEMO_ADMIN_PASSWORD`. Verify system settings and AI monitoring dashboard load.
   - **Security Bundle Verification**: Run `pnpm check:bundle-secrets` to confirm zero secrets are present in client assets.

3. **Automated Cloud Verification & E2E Test Suite**:
   Run the dual-viewport live verification script against the production deployment:
   ```bash
   PLAYWRIGHT_BASE_URL="https://<your-vercel-domain>.vercel.app" pnpm run verify:live
   ```
   Run the full desktop E2E journey suite against the production deployment:
   ```bash
   PLAYWRIGHT_BASE_URL="https://<your-vercel-domain>.vercel.app" pnpm run test:e2e:desktop
   ```

