import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config.ts";

/**
 * Runs the same test suites as the default config, but with every
 * `dist/index.js` import rewritten to `dist/index.cjs` so the test code
 * exercises the CommonJS artifact (the `require` exports condition).
 *
 * Usage: `pnpm exec vitest run --config vitest.cjs.config.ts`
 */
export default mergeConfig(
  base,
  defineConfig({
    test: {
      name: "lib-result-cjs",
      // utils.test.ts imports src/utils.ts directly (internal, non-public
      // surface), so it has nothing to say about the CJS artifact.
      exclude: [...configDefaults.exclude, "tests/utils.test.ts"],
      // Coverage is measured once by the default config; don't pay it twice.
      coverage: { enabled: false },
    },
    resolve: {
      alias: [{ find: /dist\/index\.mjs$/, replacement: "dist/index.cjs" }],
    },
  })
);
