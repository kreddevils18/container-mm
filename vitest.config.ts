/**
 * Vitest configuration for React testing with TypeScript
 *
 * Configures testing environment with jsdom, React Testing Library integration,
 * and 80% coverage threshold following CLAUDE.md requirements.
 *
 * @module vitest.config
 */

import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing environment (required for React components)
    environment: "jsdom",

    // Setup files to run before each test file
    setupFiles: ["./src/test/setup.ts"],

    // Global test configuration
    globals: true,

    // Coverage configuration with 80% threshold (MANDATORY per CLAUDE.md)
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/setup.ts",
        "**/*.d.ts",
        "**/*.config.*",
        "**/coverage/**",
        "**/dist/**",
        "**/.next/**",
        "**/*.test.*",
        "**/*.spec.*",
      ],
      // CRITICAL: 80% minimum coverage threshold (NO EXCEPTIONS per CLAUDE.md)
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },

    // Include/exclude patterns
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
    ],

    // Test timeout (30 seconds for complex integration tests)
    testTimeout: 30000,

    // Hook timeout (10 seconds for setup/teardown)
    hookTimeout: 10000,
  },

  // Path resolution matching tsconfig.json aliases
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  // Define globals for TypeScript (optional, as we use globals: true above)
  define: {
    "import.meta.vitest": "undefined",
  },
});
