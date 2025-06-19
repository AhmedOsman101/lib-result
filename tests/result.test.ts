import { describe, expect, test } from "vitest";
import {
  Err,
  ErrFromObject,
  ErrFromText,
  Ok,
  type Result,
  wrap,
  wrapAsync,
  wrapAsyncThrowable,
  wrapThrowable,
} from "../dist/index.js";

class DivisionError extends Error {}

function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}

function mayDivide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

function toPromise<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}

const double = (x: number) => x * 2;

const FAKE_API_URL = "https://jsonplaceholder.typicode.com/users/1" as const;
const INVALID_URL = "://invalid" as const;

describe("Result API", () => {
  describe("divide()", () => {
    test("returns error on division by zero", () => {
      const division = divide(1, 0);
      expect(division.isError()).toBe(true);
      expect(division.error?.message).toBe("Cannot Divide By Zero");
    });

    test("returns result on valid division", () => {
      const division = divide(10, 2);

      expect(division.isOk()).toBe(true);
      expect(division.ok).toBe(5);
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

  describe("ErrFromText", () => {
    test("unwrap throws error with correct message", () => {
      const errorResult: Result<string> = ErrFromText("Failed");
      expect(() => errorResult.unwrap()).toThrow("Failed");
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

  describe("ErrFromObject", () => {
    test("creates ErrorState with custom properties", () => {
      const errProps = { code: 404, info: "Not Found" };
      const result = ErrFromObject<number>(errProps, "Custom error");
      expect(result.isError()).toBe(true);
      expect(result.error?.message).toBe("Custom error");
      expect(result.error.code).toBe(404);
      expect(result.error.info).toBe("Not Found");
      expect(() => result.unwrap()).toThrow("Custom error");
    });

    test("map and pipe return ErrorState", () => {
      const result = ErrFromObject<number>({ foo: "bar" }, "fail");
      const mapped = result.map(x => x + 1);
      const piped = result.pipe(x => Ok(x + 1));
      expect(mapped.isError()).toBe(true);
      expect(piped.isError()).toBe(true);
      expect(mapped.error?.message).toBe("fail");
      expect(piped.error?.message).toBe("fail");
    });
  });
});

describe("wrap functions", () => {
  describe("wrap()", () => {
    test("returns Ok on success", () => {
      const res = wrap(() => 42);
      expect(res.isOk()).toBe(true);
      expect(res.ok).toBe(42);
    });

    test("returns Err on thrown error", () => {
      const res = wrap(() => {
        throw new Error("Boom!");
      });
      expect(res.isError()).toBe(true);
      expect(res.error?.message).toBe("Boom!");
    });
  });

  describe("wrapThrowable()", () => {
    test("returns Ok on success", () => {
      const safeDivide = wrapThrowable(mayDivide);
      const result = safeDivide(10, 2);
      expect(result.isOk()).toBe(true);
      expect(result.ok).toBe(5);
    });

    test("returns Err on thrown error", () => {
      const safeDivide = wrapThrowable(mayDivide);
      const result = safeDivide(10, 0);
      expect(result.isError()).toBe(true);
      expect(result.error?.message).toBe("Division by zero");
    });
  });

  describe("wrapAsync()", () => {
    test("resolves with Ok on success", async () => {
      const res = await wrapAsync(async () => {
        return await toPromise(() => "hello async");
      });
      expect(res.isOk()).toBe(true);
      expect(res.ok).toBe("hello async");
    });

    test("resolves with Err on failure", async () => {
      const res = await wrapAsync(async () => {
        return await toPromise(() => {
          throw new Error("Async fail");
        });
      });
      expect(res.isError()).toBe(true);
      expect(res.error?.message).toBe("Async fail");
    });

    test("resolves with Ok on success (fetch)", async () => {
      const res = await wrapAsync(() => fetch(FAKE_API_URL));
      expect(res.isOk()).toBe(true);
      expect(res.ok?.ok).toBe(true);
    });

    test("resolves with ErrorState on failure (fetch)", async () => {
      const res = await wrapAsync(() => fetch(INVALID_URL));
      expect(res.isError()).toBe(true);
      // @ts-expect-error: testing
      expect(res.error.cause.code).toBe("ERR_INVALID_URL");
    });
  });

  describe("wrapAsyncThrowable()", () => {
    test("resolves with Ok on success", async () => {
      const fetchJson = wrapAsyncThrowable(async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        return res;
      });

      const result = await fetchJson(FAKE_API_URL);
      expect(result.isOk()).toBe(true);
      expect(result.ok?.ok).toBe(true);
    });

    test("resolves with Err on failed fetch", async () => {
      const fetchJson = wrapAsyncThrowable(async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      });

      const result = await fetchJson(INVALID_URL);
      expect(result.isError()).toBe(true);
      // @ts-expect-error: testing
      expect(result.error.cause.code).toBe("ERR_INVALID_URL");
    });
  });
});
