import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface SecretPattern {
  name: string;
  pattern: string;
}

function getSecretPatterns(): SecretPattern[] {
  const patterns: SecretPattern[] = [
    { name: "Legacy hardcoded demo password", pattern: "CivicPulseDemo2026!" },
    { name: "RSA Private Key Header", pattern: "BEGIN PRIVATE KEY" },
    { name: "RSA Private Key Header (Legacy)", pattern: "BEGIN RSA PRIVATE KEY" },
  ];

  const envVarsToCheck = [
    { name: "DEMO_PASSWORD", minLen: 6 },
    { name: "DEMO_ADMIN_PASSWORD", minLen: 6 },
    { name: "ANALYSIS_TOKEN_SECRET", minLen: 16 },
    { name: "CRON_SECRET", minLen: 10 },
    { name: "GEMINI_API_KEY", minLen: 10 },
  ];

  for (const { name, minLen } of envVarsToCheck) {
    const val = process.env[name];
    if (val && val.trim().length >= minLen) {
      patterns.push({ name: `Env Secret: ${name}`, pattern: val.trim() });
    }
  }

  // Also check private key if provided
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (rawKey && rawKey.trim().length > 30) {
    // Check first 30 chars of the base64 content
    const cleaned = rawKey.replace(/-----BEGIN[^-]+-----/, "").replace(/\s+/g, "");
    if (cleaned.length >= 25) {
      patterns.push({ name: "Firebase Admin Private Key Signature", pattern: cleaned.slice(0, 25) });
    }
  }

  return patterns;
}

function getFilesRecursively(dir: string): string[] {
  let files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(getFilesRecursively(fullPath));
    } else if (entry.isFile()) {
      // Scan all text-based bundle assets
      if (/\.(js|mjs|cjs|json|map|html|css|txt)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  return files;
}

export function checkBundleSecrets(): { clean: boolean; violations: Array<{ file: string; secret: string }> } {
  const staticDir = path.resolve(process.cwd(), ".next/static");
  if (!fs.existsSync(staticDir)) {
    console.error("❌ Bundle directory .next/static not found. Run 'pnpm build' first.");
    return { clean: false, violations: [{ file: ".next/static", secret: "Directory does not exist" }] };
  }

  const files = getFilesRecursively(staticDir);
  const patterns = getSecretPatterns();
  const violations: Array<{ file: string; secret: string }> = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf-8");
    for (const { name, pattern } of patterns) {
      if (content.includes(pattern)) {
        violations.push({ file: path.relative(process.cwd(), file), secret: name });
      }
    }
  }

  return {
    clean: violations.length === 0,
    violations,
  };
}

function run(): void {
  console.log("🔒 Scanning .next/static client bundles for leaked credentials & secrets...\n");
  const result = checkBundleSecrets();

  if (!result.clean) {
    console.error("❌ SECURITY FAILURE: Secrets or forbidden credentials discovered in client bundle!\n");
    for (const v of result.violations) {
      console.error(`  • File:   ${v.file}`);
      console.error(`    Secret: ${v.secret}\n`);
    }
    process.exit(1);
  }

  console.log("✅ Security scan passed: Zero secrets found in .next/static bundles.\n");
  process.exit(0);
}

if (require.main === module || process.argv[1]?.includes("check-bundle-secrets")) {
  run();
}
