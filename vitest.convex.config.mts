import { defineConfig } from "vitest/config";

/**
 * Dedicated runner for the convex-test harness (kept out of the default
 * vitest config on purpose — see vitest.config.ts `exclude`).
 *
 * Run with: npm run test:convex
 */
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["convex-test/**/*.test.ts"],
  },
});