import * as dotenv from "dotenv";
import * as path from "path";
import { REQUIRED_PROD_ENV_VARS, parsePrivateKey } from "../src/lib/env-schema";

// Load environment files matching Next.js precedence
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export interface EnvCheckResult {
  valid: boolean;
  missing: Array<{ name: string; reason: string }>;
}

export function checkEnv(): EnvCheckResult {
  const missing: Array<{ name: string; reason: string }> = [];

  for (const item of REQUIRED_PROD_ENV_VARS) {
    const val = process.env[item.name];

    if (!val || val.trim().length === 0) {
      missing.push({
        name: item.name,
        reason: `Missing value — ${item.desc}`,
      });
      continue;
    }

    // Specific validation checks
    if (item.name === "ANALYSIS_TOKEN_SECRET" && val.length < 32) {
      missing.push({
        name: item.name,
        reason: `Must be at least 32 characters (got ${val.length}). Generate with: openssl rand -hex 32`,
      });
    }

    if (item.name === "CRON_SECRET" && val.length < 16) {
      missing.push({
        name: item.name,
        reason: `Must be at least 16 characters (got ${val.length})`,
      });
    }

    if (item.name === "FIREBASE_ADMIN_PRIVATE_KEY") {
      const parsed = parsePrivateKey(val);
      if (!parsed || !parsed.includes("BEGIN PRIVATE KEY")) {
        missing.push({
          name: item.name,
          reason: "Invalid RSA private key PEM header ('BEGIN PRIVATE KEY')",
        });
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

function run(): void {
  console.log("🔍 Checking required CivicPulse production environment variables...\n");
  const result = checkEnv();

  if (!result.valid) {
    console.error("❌ Deployment Blocker: Missing or invalid required environment variables:\n");
    for (const item of result.missing) {
      console.error(`  • ${item.name.padEnd(42)} ${item.reason}`);
    }
    console.error(
      "\n💡 Action required: Check .env.example or your Vercel Project Settings and provide the missing credentials.\n",
    );
    process.exit(1);
  }

  console.log("✅ All required environment variables are configured and validated.\n");
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes("check-env")) {
  run();
}
