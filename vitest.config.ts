import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "lib-result",
    globals: false,
    environment: "node",
    dir: "tests",
    reporters: "verbose", // Include verbose for detailed output in CI
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "node_modules",
        "dist",
        "tests",
        "tsup.config.ts",
        "vitest.config.ts",
        "src/types.ts",
        "src/index.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    isolate: true,
    testTimeout: 5000,
    hookTimeout: 10_000,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    logHeapUsage: false,
    update: false,
    watch: false,
    silent: false,
  },
});
