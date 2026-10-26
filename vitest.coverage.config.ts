import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.ts";

/**
 * Runs the same test suites against `src/` instead of `dist/` so V8 coverage
 * reports on authored source rather than the bundled artifact.
 *
 * Artifact behavior remains covered by the default config (ESM) and
 * `vitest.cjs.config.ts` (CJS); this config exists only for coverage.
 *
 * Usage: `pnpm exec vitest run --config vitest.coverage.config.ts --coverage`
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      name: "lib-result-src-coverage",
    },
    resolve: {
      alias: [{ find: /dist\/index\.mjs$/, replacement: "src/index.ts" }],
    },
  })
);
