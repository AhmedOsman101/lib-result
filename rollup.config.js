import { defineConfig } from "rollup";
import dts from "rollup-plugin-dts";
import typescript from "rollup-plugin-typescript2";
// import pkg from "./package.json" with { type: "json" };

export default defineConfig([
  // CommonJS build
  {
    input: "src/index.ts",
    // external: [Object.keys(pkg.dependencies)],
    output: {
      file: "dist/tmp/index.cjs",
      format: "cjs",
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        useTsconfigDeclarationDir: false,
        clean: true,
        abortOnError: true,
      }),
    ],
  },
  // ESM build
  {
    input: "src/index.ts",
    // external: [Object.keys(pkg.dependencies)],
    output: {
      file: "dist/tmp/index.esm.js",
      format: "es",
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.esm.json",
        useTsconfigDeclarationDir: true,
        clean: false,
        abortOnError: true,
      }),
    ],
  },
  {
    input: "dist/tmp/index.d.ts",
    // external: [Object.keys(pkg.dependencies)],
    output: {
      file: "dist/index.d.ts",
      format: "es",
    },
    plugins: [dts()],
  },
]);
