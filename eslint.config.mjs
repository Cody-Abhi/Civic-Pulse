import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** A literal that is exactly a 3/6/8-digit hex colour (§44 "no raw hex"). */
const HEX_COLOUR =
  "Literal[value=/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Project-wide standards (§44).
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },

  // No raw hex colours in UI code — colours come from tokens via Tailwind utils.
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: HEX_COLOUR,
          message:
            "No raw hex colours in components. Use design tokens via Tailwind utilities (bg-surface, text-muted, …) or --cp-* variables.",
        },
      ],
    },
  },

  // Domain layer must be framework-free and self-contained (§43, §44).
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react-dom",
                "next",
                "next/*",
                "server-only",
                "firebase",
                "firebase/*",
                "firebase-admin",
                "firebase-admin/*",
                "@google/genai",
                "@/server",
                "@/server/*",
                "@/app/*",
                "@/components/*",
                "@/features/*",
                "@/hooks/*",
              ],
              message:
                "src/domain must be pure: no framework, server, UI, or SDK imports.",
            },
          ],
        },
      ],
    },
  },

  // Scripts and tests may use console and node globals.
  {
    files: ["scripts/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "no-console": "off",
      "no-restricted-syntax": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
