import { describe, expect, test } from "vitest";
import { Ok } from "../dist/index.js";
import { divide, double } from "./testing-utils.js";

describe("Result API", () => {
  describe("isError()", () => {
    test("returns true on division by zero", () => {
      const division = divide(1, 0);
      expect(division.isError()).toBe(true);
      expect(division.error?.message).toBe("Cannot Divide By Zero");
    });

    test("returns false valid division", () => {
      const division = divide(10, 2);

      expect(division.isError()).toBe(false);
      expect(division.error).toBeUndefined();
    });
  });

  describe("isOk()", () => {
    test("returns true valid division", () => {
      const division = divide(10, 2);

      expect(division.isOk()).toBe(true);
      expect(division.ok).toBe(5);
    });

    test("returns false on division by zero", () => {
      const division = divide(1, 0);
      expect(division.isOk()).toBe(false);
      expect(division.ok).toBeUndefined();
    });
  });

  describe("map()", () => {
    test("transforms value type (number to string)", () => {
      const result = divide(8, 2);
      const mapped = result.map(x => `Value: ${x}`);
      expect(mapped.isOk()).toBe(true);
      expect(mapped.ok).toBe("Value: 4");
    });

    test("returns error when mapping fails", () => {
      const failedResult = Ok(5)
        .map(x => `value is ${x}`)
        .map(x => JSON.parse(x));
      expect(failedResult.isError()).toBe(true);
      expect(failedResult.error?.message).toMatch(/^Unexpected token/);
    });

    test("returns doubled value on successful division", () => {
      const division = divide(10, 2);
      const doubled = division.map(double);
      expect(doubled.isOk()).toBe(true);
      expect(doubled.ok).toBe(10);
    });

    test("returns error on division by zero", () => {
      const division = divide(10, 0);
      const doubled = division.map(double);
      expect(doubled.isError()).toBe(true);
      expect(doubled.error?.message).toBe("Cannot Divide By Zero");
    });
  });

  describe("pipe()", () => {
    test("chains Ok results", () => {
      const result = divide(10, 2);
      const piped = result
        .pipe(x => Ok(x * 2)) // Ok(10)
        .pipe(x => Ok(x.toString())); // Ok("10")

      expect(piped.isOk()).toBe(true);
      expect(piped.ok).toBe("10");
    });

    test("preserves Err state", () => {
      const error = divide(10, 0);
      const piped = error.pipe(x => Ok(x * 2));
      expect(piped.isError()).toBe(true);
      expect(piped.error?.message).toBe("Cannot Divide By Zero");
    });

    test("short-circuits on first Err in chain", () => {
      const result = divide(10, 2) // Ok(5)
        .pipe(x => divide(x, 0)) // Err
        .pipe(x => Ok(x * 100)); // Should not run
      expect(result.isError()).toBe(true);
      expect(result.error?.message).toBe("Cannot Divide By Zero");
    });
  });

  describe("unwrap()", () => {
    test("returns the value for Ok results", () => {
      const result = Ok(42);
      expect(result.unwrap()).toBe(42);
    });

    test("throws the error for Err results", () => {
      const division = divide(1, 0);
      expect(() => division.unwrap()).toThrow("Cannot Divide By Zero");
    });
  });
});
