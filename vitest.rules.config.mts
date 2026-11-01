import { defineConfig } from "vitest/config";

/**
 * Firestore security-rules tests (RULES-001…012, §39.3) using
 * @firebase/rules-unit-testing against the Firestore emulator.
 * Run the emulator first: `pnpm emulators` (or firebase emulators:exec).
 * Suites are authored in T-05.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    fileParallelism: false,
    passWithNoTests: true,
  },
});
