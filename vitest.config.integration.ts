import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    name: "integration",
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 60000,
    include: ["src/__tests__/integration/**/*.test.ts"],
    exclude: [
      "node_modules/**",
      "dist/**",
      ".next/**",
      "src/__tests__/**/*.test.tsx"
    ],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/app/api/**", "src/services/**", "src/drizzle/**"],
      exclude: [
        "src/__tests__/**",
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.d.ts"
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});