import { createRequire } from "node:module";
import { describe, expect, test } from "vitest";
import * as esm from "../dist/index.mjs";

const requireCjs = createRequire(import.meta.url);
const cjs = requireCjs("../dist/index.cjs") as typeof esm;

// "default" is a namespace-interop artifact; "__esModule" is a CJS interop marker.
// Neither is part of the public API surface.
const publicKeys = (keys: string[]) =>
  keys.filter(key => key !== "default" && key !== "__esModule").sort();

describe("CJS build (dist/index.cjs)", () => {
  test("exposes the same API surface as the ESM build", () => {
    expect(publicKeys(Object.keys(cjs))).toEqual(publicKeys(Object.keys(esm)));
  });

  test("behaves like the ESM build", () => {
    expect(cjs.Ok(42).unwrap()).toBe(42);
    expect(cjs.ErrFromText("boom").unwrapErr().message).toBe("boom");
    expect(cjs.Err(new Error("x")).isError()).toBe(true);
    expect(cjs.Ok(1).isOk()).toBe(true);
  });
});
