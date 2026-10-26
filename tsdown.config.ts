import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  shims: true,
  sourcemap: true,
  clean: true,
  exports: true,
});
