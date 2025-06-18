import assert from "node:assert";
import test from "node:test";
import {
  Err,
  ErrFromObject,
  ErrFromText,
  Ok,
  wrap,
  wrapAsync,
  wrapAsyncThrowable,
  wrapThrowable
} from "../dist/index.js";
class DivisionError extends Error {
}
function divide(a, b) {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}
function mayDivide(a, b) {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}
function toPromise(fn) {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}
const double = (x) => x * 2;
const FAKE_API_URL = "https://jsonplaceholder.typicode.com/users/1";
const INVALID_URL = "://invalid";
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
test("successful divide map returns doubled value", () => {
  const division = divide(10, 2);
  const doubled = division.map(double);
  assert.ok(doubled.isOk());
  assert.equal(doubled.ok, 10);
});
test("failed divide map returns Error value", () => {
  const division = divide(10, 0);
  const doubled = division.map(double);
  assert.ok(doubled.isError());
  assert.equal(doubled.error.message, "Cannot Divide By Zero");
});
test("ErrFromText unwrap throws error with correct message", () => {
  const errorResult = ErrFromText("Failed");
  assert.throws(() => errorResult.unwrap(), { message: "Failed" });
});
test("map transforms value type (number to string)", () => {
  const result = divide(8, 2);
  const mapped = result.map((x) => `Value: ${x}`);
  assert.ok(mapped.isOk());
  assert.equal(mapped.ok, "Value: 4");
});
test("failed map returns the error", () => {
  const failedResult = Ok(5).map((x) => `value is ${x}`).map((x) => JSON.parse(x));
  assert.ok(failedResult.isError());
  assert.ok(failedResult.error.message.startsWith("Unexpected token"));
});
test("pipe chains Ok results", () => {
  const result = divide(10, 2);
  const piped = result.pipe((x) => Ok(x * 2)).pipe((x) => Ok(x.toString()));
  assert.ok(piped.isOk());
  assert.equal(piped.ok, "10");
});
test("pipe preserves Err state", () => {
  const error = divide(10, 0);
  const piped = error.pipe((x) => Ok(x * 2));
  assert.ok(piped.isError());
  assert.equal(piped.error.message, "Cannot Divide By Zero");
});
test("pipe short-circuits on first Err in chain", () => {
  const result = divide(10, 2).pipe((x) => divide(x, 0)).pipe((x) => Ok(x * 100));
  assert.ok(result.isError());
  assert.equal(result.error.message, "Cannot Divide By Zero");
});
test("ErrFromObject creates ErrorState with custom properties", () => {
  const errProps = { code: 404, info: "Not Found" };
  const result = ErrFromObject(errProps, "Custom error");
  assert.ok(result.isError());
  assert.equal(result.error.message, "Custom error");
  assert.equal(result.error.code, 404);
  assert.equal(result.error.info, "Not Found");
  assert.throws(() => result.unwrap(), { message: "Custom error" });
});
test("ErrFromObject methods: map and pipe return ErrorState", () => {
  const result = ErrFromObject({ foo: "bar" }, "fail");
  const mapped = result.map((x) => x + 1);
  const piped = result.pipe((x) => Ok(x + 1));
  assert.ok(mapped.isError());
  assert.ok(piped.isError());
  assert.equal(mapped.error.message, "fail");
  assert.equal(piped.error.message, "fail");
});
test("wrap(): returns Ok on success", () => {
  const res = wrap(() => 42);
  assert.ok(res.isOk());
  assert.equal(res.ok, 42);
});
test("wrap(): returns Err on thrown error", () => {
  const res = wrap(() => {
    throw new Error("Boom!");
  });
  assert.ok(res.isError());
  assert.equal(res.error.message, "Boom!");
});
test("wrapThrowable(): returns Ok on success", () => {
  const safeDivide = wrapThrowable(mayDivide);
  const result = safeDivide(10, 2);
  assert.ok(result.isOk());
  assert.equal(result.ok, 5);
});
test("wrapThrowable(): returns Err on thrown error", () => {
  const safeDivide = wrapThrowable(mayDivide);
  const result = safeDivide(10, 0);
  assert.ok(result.isError());
  assert.equal(result.error.message, "Division by zero");
});
test("wrapAsync(): resolves with Ok on success", async () => {
  const res = await wrapAsync(async () => {
    return await toPromise(() => "hello async");
  });
  assert.ok(res.isOk());
  assert.equal(res.ok, "hello async");
});
test("wrapAsync(): resolves with Err on failure", async () => {
  const res = await wrapAsync(async () => {
    return await toPromise(() => {
      throw new Error("Async fail");
    });
  });
  assert.ok(res.isError());
  assert.equal(res.error.message, "Async fail");
});
test("wrapAsync(): resolves with Ok on success (fetch)", async () => {
  const res = await wrapAsync(() => fetch(FAKE_API_URL));
  assert.ok(res.isOk());
  assert.ok(res.ok.ok);
});
test("wrapAsync(): resolves with ErrorState on failure (fetch)", async () => {
  const res = await wrapAsync(() => fetch(INVALID_URL));
  assert.ok(res.isError());
  assert.equal(res.error.cause.code, "ERR_INVALID_URL");
});
test("wrapAsyncThrowable(): resolves with Ok on success", async () => {
  const fetchJson = wrapAsyncThrowable(async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    return res;
  });
  const result = await fetchJson(FAKE_API_URL);
  assert.ok(result.isOk());
  assert.ok(result.ok.ok);
});
test("wrapAsyncThrowable(): resolves with Err on failed fetch", async () => {
  const fetchJson = wrapAsyncThrowable(async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });
  const result = await fetchJson(INVALID_URL);
  assert.ok(result.isError());
  assert.equal(result.error.cause.code, "ERR_INVALID_URL");
});
