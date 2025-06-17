import assert from "node:assert";
import test from "node:test";
import {
  Err,
  ErrFromObject,
  ErrFromText,
  Ok,
  type Result,
  wrap,
  wrapAsync,
} from "../dist/index.js";

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

const double = (x: number) => x * 2;

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
  const errorResult: Result<string> = ErrFromText("Failed");

  assert.throws(() => errorResult.unwrap(), { message: "Failed" });
});

test("map transforms value type (number to string)", () => {
  const result = divide(8, 2); // Ok(4)
  const mapped = result.map(x => `Value: ${x}`);
  assert.ok(mapped.isOk());
  assert.equal(mapped.ok, "Value: 4");
});

test("pipe chains Ok results", () => {
  const result = divide(10, 2); // Ok(5)
  const piped = result
    .pipe(x => Ok(x * 2)) // Ok(10)
    .pipe(x => Ok(x.toString())); // Ok("10")
  assert.ok(piped.isOk());
  assert.equal(piped.ok, "10");
});

test("pipe preserves Err state", () => {
  const error = divide(10, 0); // Division Error
  const piped = error.pipe(x => Ok(x * 2));
  assert.ok(piped.isError());
  assert.equal(piped.error.message, "Cannot Divide By Zero");
});

test("pipe short-circuits on first Err in chain", () => {
  const result = divide(10, 2) // Ok(5)
    .pipe(x => divide(x, 0)) // Err
    .pipe(x => Ok(x * 100)); // Should not run
  assert.ok(result.isError());
  assert.equal(result.error.message, "Cannot Divide By Zero");
});

test("ErrFromObject creates ErrorState with custom properties", () => {
  const errProps = { code: 404, info: "Not Found" };
  const result = ErrFromObject<number>(errProps, "Custom error");
  assert.ok(result.isError());
  assert.equal(result.error.message, "Custom error");
  assert.equal(result.error.code, 404);
  assert.equal(result.error.info, "Not Found");
  assert.throws(() => result.unwrap(), { message: "Custom error" });
});

test("ErrFromObject methods: map and pipe return ErrorState", () => {
  const result = ErrFromObject<number>({ foo: "bar" }, "fail");
  const mapped = result.map(x => x + 1);
  const piped = result.pipe(x => Ok(x + 1));
  assert.ok(mapped.isError());
  assert.ok(piped.isError());
  assert.equal(mapped.error.message, "fail");
  assert.equal(piped.error.message, "fail");
});

// ─── SYNC TESTS ─────────────────────────────────────────────────────────────

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

// ─── ASYNC TESTS ─────────────────────────────────────────────────────────────

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
  const res = await wrapAsync(() =>
    fetch("https://jsonplaceholder.typicode.com/users/1")
  );

  assert.ok(res.isOk());
  assert.ok(res.ok.ok);
});

test("wrapAsync(): resolves with ErrorState on failure (fetch)", async () => {
  const res = await wrapAsync(() => fetch("://invalid"));

  assert.ok(res.isError());
  // @ts-expect-error: testing
  assert.equal(res.error.cause.code, "ERR_INVALID_URL");
});
