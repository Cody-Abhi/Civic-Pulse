import * as fs from "fs";
import * as path from "path";
import { REQUIRED_PROD_ENV_VARS } from "../src/lib/env-schema";

/**
 * Generates .env.example and the README "Deploy to Vercel" variable table
 * directly from the shared environment schema to prevent drift.
 */

function generateEnvExample(): string {
  return `# ==============================================================================
# CivicPulse AI — Environment Configuration Template (§40)
# Auto-generated from src/lib/env-schema.ts. Do not edit manually.
# Run 'pnpm sync:env' to regenerate.
# ==============================================================================

# --- App Canonical Origin & Location ---
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CITY_ID=blr
NEXT_PUBLIC_CITY_NAME=Bengaluru

# --- Demo Mode Flags ---
DEMO_MODE=true
NEXT_PUBLIC_DEMO_MODE=true

# --- Firebase Client SDK (Public by design; secured by Firestore rules) ---
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
NEXT_PUBLIC_USE_EMULATORS=false

# --- Firebase Admin SDK (SERVER ONLY — never prefix with NEXT_PUBLIC) ---
FIREBASE_ADMIN_PROJECT_ID=civic-pulse-4a203
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
SESSION_COOKIE_NAME=__session
SESSION_MAX_AGE_DAYS=5

# --- Google Gemini AI (SERVER ONLY) ---
GEMINI_API_KEY=
GEMINI_MODEL_PRIMARY=gemini-3.8-flash
GEMINI_MODEL_FALLBACK=gemini-3.5-flash-lite
GEMINI_MODEL_EMBEDDING=gemini-embedding-001
AI_MODE=live
# Generate with: openssl rand -hex 32
ANALYSIS_TOKEN_SECRET=

# --- Demo & Admin Authentication Credentials (SERVER ONLY) ---
DEMO_CITIZEN_EMAIL=citizen@demo.civicpulse.invalid
DEMO_AUTHORITY_EMAIL=roads@demo.civicpulse.invalid
DEMO_ADMIN_EMAIL=admin@demo.civicpulse.invalid
DEMO_PASSWORD=
# Production Admin Password (NEVER commit, NEVER put in README, NEVER expose to client)
DEMO_ADMIN_PASSWORD=

# --- Cron Jobs & Maintenance (SERVER ONLY) ---
# Secret bearer token for Vercel Cron /api/cron/demo-reset (generate: openssl rand -hex 16)
CRON_SECRET=

# --- Cloudinary & Media Uploads (Optional) ---
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# --- Geocoding (Nominatim OpenStreetMap) ---
GEOCODER_BASE_URL=https://nominatim.openstreetmap.org
GEOCODER_CONTACT_EMAIL=

# --- Feature Flags ---
FEATURE_UPLOADS=false
FEATURE_PUSH=false
FEATURE_REVERSE_GEOCODE=false
FEATURE_APP_CHECK=false
`;
}

function generateVercelEnvTable(): string {
  // Filter out DEMO_ADMIN_PASSWORD per R2.2:
  // "DEMO_ADMIN_PASSWORD is never in the README, the client bundle, or any API."
  const vercelVars = REQUIRED_PROD_ENV_VARS.filter(
    (v) => !("sensitiveAdmin" in v && v.sensitiveAdmin),
  );

  let output = `<!-- BEGIN:vercel-env -->\n`;
  output += `| Environment Variable | Description | Exposure |\n`;
  output += `| :--- | :--- | :--- |\n`;
  for (const v of vercelVars) {
    const exposure = v.public ? "Client (`NEXT_PUBLIC_*`)" : "Server Only (Secret)";
    output += `| \`${v.name}\` | ${v.desc} | ${exposure} |\n`;
  }
  output += `<!-- END:vercel-env -->`;
  return output;
}

export function syncEnvFiles(checkOnly = false): boolean {
  const rootDir = process.cwd();
  const envExamplePath = path.join(rootDir, ".env.example");
  const readmePath = path.join(rootDir, "README.md");

  const expectedEnvExample = generateEnvExample();
  const expectedTable = generateVercelEnvTable();

  let hasDrift = false;

  // Check / update .env.example
  const currentEnvExample = fs.existsSync(envExamplePath)
    ? fs.readFileSync(envExamplePath, "utf-8")
    : "";

  if (currentEnvExample.trim() !== expectedEnvExample.trim()) {
    hasDrift = true;
    if (!checkOnly) {
      fs.writeFileSync(envExamplePath, expectedEnvExample, "utf-8");
      console.log("✅ Synced .env.example from env-schema.ts");
    } else {
      console.error("❌ .env.example is out of sync with env-schema.ts");
    }
  } else {
    console.log("✓ .env.example is up to date");
  }

  // Check / update README.md
  if (fs.existsSync(readmePath)) {
    const readme = fs.readFileSync(readmePath, "utf-8");
    const beginMarker = "<!-- BEGIN:vercel-env -->";
    const endMarker = "<!-- END:vercel-env -->";

    if (readme.includes(beginMarker) && readme.includes(endMarker)) {
      const regex = new RegExp(`${beginMarker}[\\s\\S]*?${endMarker}`, "g");
      const updatedReadme = readme.replace(regex, expectedTable);
      if (updatedReadme !== readme) {
        hasDrift = true;
        if (!checkOnly) {
          fs.writeFileSync(readmePath, updatedReadme, "utf-8");
          console.log("✅ Synced README.md Vercel env table from env-schema.ts");
        } else {
          console.error("❌ README.md Vercel env table is out of sync with env-schema.ts");
        }
      } else {
        console.log("✓ README.md Vercel env table is up to date");
      }
    } else {
      // If markers don't exist yet, insert them in the Vercel section
      const targetHeading = "Configure the following environment variables in Vercel:";
      if (readme.includes(targetHeading)) {
        const parts = readme.split(targetHeading);
        // Find end of previous list or beginning of next section
        const rest = parts[1]!;
        const nextSectionMatch = rest.match(/\n\d+\.\s+Deploy with Vercel CLI/);
        if (nextSectionMatch && nextSectionMatch.index !== undefined) {
          const afterList = rest.substring(nextSectionMatch.index);
          const newReadme = `${parts[0]}${targetHeading}\n\n${expectedTable}\n${afterList}`;
          if (!checkOnly) {
            fs.writeFileSync(readmePath, newReadme, "utf-8");
            console.log("✅ Inserted synced Vercel env table into README.md");
          }
          hasDrift = true;
        }
      }
    }
  }

  return !hasDrift;
}

if (require.main === module || process.argv[1]?.includes("sync-env")) {
  const checkOnly = process.argv.includes("--check");
  const inSync = syncEnvFiles(checkOnly);
  if (checkOnly && !inSync) {
    process.exit(1);
  }
}
