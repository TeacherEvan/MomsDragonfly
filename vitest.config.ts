import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/tests/e2e/**",
      "**/playwright.config.ts",
      "**/convex-test/**",
      "**/.kilo/**",
    ],
    typecheck: {
      tsconfig: "./tsconfig.json",
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
