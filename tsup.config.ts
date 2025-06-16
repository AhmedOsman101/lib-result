import { defineConfig } from "tsup";

export default defineConfig([
  {
    format: ["cjs"],
    entry: ["src/index.ts"],
    dts: true,
    shims: true,
    skipNodeModulesBundle: true,
    clean: true,
    tsconfig: "./tsconfig.cjs.json",
  },
  {
    format: ["esm"],
    entry: ["src/index.ts"],
    dts: true,
    shims: true,
    skipNodeModulesBundle: true,
    clean: true,
    tsconfig: "./tsconfig.esm.json",
  },
]);
