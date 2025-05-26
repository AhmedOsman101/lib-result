import { deepEqual, equal, ok, throws } from "node:assert/strict";
import test from "node:test";
import {
  Err,
  ErrFromText,
  isErr,
  isOk,
  Ok,
  type Result,
  unwrap,
} from "./index.ts";

class DivisionError extends Error {}

function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}

test("divide() returns correct OkState", () => {
  const result = divide(4, 2);
  deepEqual(result, { ok: 2, error: undefined });
  ok(isOk(result));
  ok(!isErr(result));
});

test("divide() returns correct ErrorState", () => {
  const failedResult = divide(4, 0);
  deepEqual(failedResult, {
    ok: undefined,
    error: new DivisionError("Cannot Divide By Zero"),
  });
  ok(isErr(failedResult));
  ok(!isOk(failedResult));
});

test("Ok() returns correct OkState", () => {
  const result = Ok(123);
  deepEqual(result, { ok: 123, error: undefined });
  ok(isOk(result));
  ok(!isErr(result));
});

test("Err() returns correct ErrorState", () => {
  const error = new Error("fail");
  const result = Err(error);
  deepEqual(result, { ok: undefined, error });
  ok(isErr(result));
  ok(!isOk(result));
});

test("Err() throws if not Error", () => {
  // @ts-expect-error: This is a test
  throws(() => Err("not an error"), TypeError);
});

test("ErrFromText() returns ErrorState with Error", () => {
  const result = ErrFromText("fail");
  ok(result.error instanceof Error);
  equal(result.error.message, "fail");
  ok(isErr(result));
});

test("unwrap() returns value for Ok and Result", () => {
  type User = { id: number; foo: string };
  const user: Result<User> = { ok: { id: 5, foo: "bar" }, error: undefined };

  const result = Ok(user);
  equal(unwrap(result), user);
});

test("unwrap() throws error for Err", () => {
  const error = new Error("fail");
  const result = Err(error);
  throws(() => unwrap(result), /fail/);
});
