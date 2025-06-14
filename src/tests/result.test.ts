import assert from "node:assert";
import test from "node:test";
import type { Result } from "../index.d.ts";
import {
  Err,
  ErrFromText,
  isErr,
  isOk,
  Ok,
  wrap,
  wrapAsync,
} from "../index.ts";

class DivisionError extends Error {}

function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}

function toPromise<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}

// ─── TESTS ─────────────────────────────────────────────────────────────

test("divide returns error on division by zero", () => {
  const division = divide(1, 0);

  assert.ok(division.isError());
  assert.equal(division.error.message, "Cannot Divide By Zero");
});

test("divide returns result on valid division", () => {
  const division = divide(10, 2);

  assert.ok(division.isOk());
  assert.equal(division.ok, 5);
});

test("ErrFromText unwrap throws error with correct message", () => {
  const errorResult: Result<string> = ErrFromText("Failed");

  assert.throws(() => errorResult.unwrap(), { message: "Failed" });
});

// ─── SYNC TESTS ─────────────────────────────────────────────────────────────

test("wrap(): returns Ok on success", () => {
  const res = wrap(() => 42);

  assert.ok(isOk(res));
  assert.equal(res.ok, 42);
});

test("wrap(): returns Err on thrown error", () => {
  const res = wrap(() => {
    throw new Error("Boom!");
  });

  assert.ok(isErr(res));
  assert.equal(res.error?.message, "Boom!");
});

// ─── ASYNC TESTS ─────────────────────────────────────────────────────────────

test("wrapAsync(): resolves with Ok on success", async () => {
  const res = await wrapAsync(async () => {
    return await toPromise(() => "hello async");
  });

  assert.ok(isOk(res));
  assert.equal(res.ok, "hello async");
});

test("wrapAsync(): resolves with Err on failure", async () => {
  const res = await wrapAsync(async () => {
    return await toPromise(() => {
      throw new Error("Async fail");
    });
  });

  assert.ok(isErr(res));
  assert.equal(res.error?.message, "Async fail");
});
