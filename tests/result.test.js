import assert from "node:assert";
import test from "node:test";
import { Err, ErrFromText, Ok, wrap, wrapAsync } from "../dist/esm/index.js";
class DivisionError extends Error {
}
function divide(a, b) {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}
function toPromise(fn) {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}
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
  const errorResult = ErrFromText("Failed");
  assert.throws(() => errorResult.unwrap(), { message: "Failed" });
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
  const res = await wrapAsync(
    () => fetch("https://jsonplaceholder.typicode.com/users/1")
  );
  assert.ok(res.isOk());
  assert.ok(res.ok.ok);
});
test("wrapAsync(): resolves with ErrorState on failure (fetch)", async () => {
  const res = await wrapAsync(() => fetch("://invalid"));
  assert.ok(res.isError());
  assert.equal(res.error.cause.code, "ERR_INVALID_URL");
});
