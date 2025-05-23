import { deepEqual, equal, ok, throws } from "node:assert/strict";
import test from "node:test";
import { Err, ErrFromText, isErr, isOk, Ok, unwrap } from "./index.ts";
class DivisionError extends Error {
  constructor(message) {
    super(message);
  }
}
function divide(a, b) {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}
test("divide() returns correct OkState", () => {
  const result = divide(4, 2);
  deepEqual(result, { ok: 2, error: void 0 });
  ok(isOk(result));
  ok(!isErr(result));
});
test("divide() returns correct ErrorState", () => {
  const failedResult = divide(4, 0);
  deepEqual(failedResult, { ok: void 0, error: new DivisionError("Cannot Divide By Zero") });
  ok(isErr(failedResult));
  ok(!isOk(failedResult));
});
test("Ok() returns correct OkState", () => {
  const result = Ok(123);
  deepEqual(result, { ok: 123, error: void 0 });
  ok(isOk(result));
  ok(!isErr(result));
});
test("Err() returns correct ErrorState", () => {
  const error = new Error("fail");
  const result = Err(error);
  deepEqual(result, { ok: void 0, error });
  ok(isErr(result));
  ok(!isOk(result));
});
test("Err() throws if not Error", () => {
  throws(() => Err("not an error"), TypeError);
});
test("ErrFromText() returns ErrorState with Error", () => {
  const result = ErrFromText("fail");
  ok(result.error instanceof Error);
  equal(result.error.message, "fail");
  ok(isErr(result));
});
test("unwrap() returns value for Ok", () => {
  const result = Ok("hello");
  equal(unwrap(result), "hello");
});
test("unwrap() throws error for Err", () => {
  const error = new Error("fail");
  const result = Err(error);
  throws(() => unwrap(result), /fail/);
});
test("Prettify<OkState<number>> is OkState<number>", () => {
  const ResultFunction = (a) => {
    return a;
  };
  const result = ResultFunction(Ok(2));
  deepEqual(result, { ok: 2, error: void 0 });
});
