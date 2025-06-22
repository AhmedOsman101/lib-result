import { describe, expect, test, vi } from "vitest";
import { Err, Ok } from "../dist/index.js";
import { DivisionError, divide, double } from "./testing-utils.js";

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

  describe("expect()", () => {
    test("returns the value for Ok results", () => {
      const result = Ok(42);
      expect(result.expect("Failed")).toBe(42);
    });

    test("throws the error with the message for Err results", () => {
      const division = divide(1, 0);
      expect(() => division.expect("Failed to divide")).toThrow(
        "Failed to divide"
      );
    });

    test("Passes the cause property correctly", () => {
      const division = divide(1, 0);
      try {
        division.expect("Failed to divide");
        // biome-ignore lint/suspicious/noExplicitAny: testing
      } catch (e: any) {
        expect(e.cause).toBeInstanceOf(DivisionError);
        expect(e.cause.message).toBe("Cannot Divide By Zero");
      }
    });
  });

  describe("match()", () => {
    test("calls okFn and returns its result for Ok state", () => {
      const result = Ok(10);
      const message = result.match(
        value => `Success: ${value * 2}`,
        error => `Error: ${error.message}`
      );
      expect(message).toBe("Success: 20");
    });

    test("calls errFn and returns its result for Err state", () => {
      const errorResult = Err(new Error("Something went wrong"));
      const message = errorResult.match(
        value => `Success: ${value}`,
        error => `Error: ${error.message.toUpperCase()}`
      );
      expect(message).toBe("Error: SOMETHING WENT WRONG");
    });

    test("ensures okFn is not called for Err state", () => {
      const errorResult = Err(new Error("Test Error"));
      const okFn = vi.fn().mockReturnValue("Success: value");
      const message = errorResult.match(
        okFn,
        error => `Error: ${error.message}`
      );
      expect(okFn).not.toHaveBeenCalled();
      expect(message).toBe("Error: Test Error");
    });

    test("ensures errFn is not called for Ok state", () => {
      const okResult = Ok("Hello");
      const errFn = vi.fn().mockReturnValue("Error: message");
      const message = okResult.match(
        value => `Success: ${value.toUpperCase()}`,
        errFn
      );
      expect(errFn).not.toHaveBeenCalled();
      expect(message).toBe("Success: HELLO");
    });

    test("handles okFn throwing an error by calling errFn with the thrown error", () => {
      const result = Ok(5);
      const errorMessage = "Function failed!";
      const output = result.match(
        value => {
          if (value === 5) {
            throw new Error(errorMessage);
          }
          return `Success: ${value}`;
        },
        error => `Caught Error: ${error.message}`
      );
      expect(output).toBe(`Caught Error: ${errorMessage}`);
    });
  });

  describe("orElse()", () => {
    test("returns the ok value if Result is Ok", () => {
      const result = Ok(42);
      const value = result.orElse(() => 0);
      expect(value).toBe(42);
    });

    test("calls the error handler and returns its value if Result is Err", () => {
      const errorResult = Err(new Error("Failed"));
      const fallback = errorResult.orElse(e => e.message);
      expect(fallback).toBe("Failed");
    });

    test("ensures the error handler is not called for Ok state", () => {
      const okResult = Ok(100);
      const errorFn = vi.fn().mockReturnValue(0);
      const value = okResult.orElse(errorFn);
      expect(value).toBe(100);
      expect(errorFn).not.toHaveBeenCalled();
    });
  });

  describe("unwrapOr()", () => {
    test("returns the ok value if Result is Ok", () => {
      const result = Ok(42);
      const value = result.unwrapOr(0);
      expect(value).toBe(42);
    });

    test("returns the fallback value if Result is Err", () => {
      const errorResult = Err<string>(new Error("Failed"));
      const fallback = errorResult.unwrapOr("Failed");
      expect(fallback).toBe("Failed");
    });
  });
});
