import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/rules/**", "tests/e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**"],
      thresholds: {
        // Priority & transitions require full branch coverage (§45 T-06).
        "src/domain/priority.ts": { branches: 100, functions: 100, lines: 100 },
        "src/domain/transitions.ts": { branches: 100, functions: 100, lines: 100 },
      },
    },
  },
});
