import { describe, expect, test, vi } from "vitest";
import {
  Err,
  ErrFromObject,
  ErrFromText,
  Ok,
  wrap,
  wrapAsync,
  wrapAsyncThrowable,
  wrapThrowable,
} from "../src/main.ts";
import { toPromise } from "./testing-utils.ts";

describe("Result Type", () => {
  describe("Ok()", () => {
    test("creates a successful result", () => {
      const result = Ok(42);
      expect(result.ok).toBe(42);
      expect(result.error).toBeUndefined();
      expect(result.isOk()).toBe(true);
      expect(result.isError()).toBe(false);
      expect(result.unwrap()).toBe(42);
    });

    test("maps over a successful result", () => {
      const result = Ok(2)
        .map(x => x * 2)
        .map(x => x.toString());
      expect(result.ok).toBe("4");
    });

    test("pipes through a function that returns a Result", () => {
      const result = Ok(2).pipe(x => Ok(x * 2));
      expect(result.ok).toBe(4);
    });
  });

  describe("Err()", () => {
    test("creates an error result", () => {
      const error = new Error("Failed");
      const result = Err(error);

      expect(result.error).toBe(error);
      expect(result.ok).toBeUndefined();
      expect(result.isOk()).toBe(false);
      expect(result.isError()).toBe(true);
      expect(() => result.unwrap()).toThrow("Failed");
    });

    test("does not map over an error result", () => {
      const result = Err<number>(new Error("Failed")).map(x => x * 2);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("Failed");
    });

    test("does not pipe through a function when in error state", () => {
      const mockFn = vi.fn();
      const result = Err(new Error("Failed")).pipe(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.isError()).toBe(true);
      expect(result.error?.message).toBe("Failed");
    });

    test("throws TypeError when non-Error is passed", () => {
      // @ts-expect-error Testing invalid input
      expect(() => Err("not an error")).toThrow(TypeError);
    });
  });

  describe("ErrFromText()", () => {
    test("creates an error result from a string message", () => {
      const result = ErrFromText("Failed");

      expect(result.error).toBeInstanceOf(Error);
      expect(result.ok).toBeUndefined();
      expect(result.isOk()).toBe(false);
      expect(result.isError()).toBe(true);
      expect(() => result.unwrap()).toThrow("Failed");
    });

    test("does not map over an error result", () => {
      const result = ErrFromText("Failed").map(value => value);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("Failed");
    });

    test("does not pipe through a function when in error state", () => {
      const mockFn = vi.fn();
      const result = ErrFromText("Failed").pipe(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.isError()).toBe(true);
      expect(result.error?.message).toBe("Failed");
    });
  });

  describe("ErrFromObject()", () => {
    test("creates a custom error with additional properties", () => {
      const result = ErrFromObject({
        message: "Not found",
        code: 404,
      });

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe("Not found");
      expect(result.error.code).toBe(404);
      expect(result.ok).toBeUndefined();
      expect(result.isOk()).toBe(false);
      expect(result.isError()).toBe(true);
      expect(() => result.unwrap()).toThrow("Not found");
    });

    test("creates a custom error with cause", () => {
      const cause = new Error("Original error");
      const result = ErrFromObject({ cause, message: "hi" });

      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.cause).toBe(cause);
    });

    test("does not map over an error result", () => {
      const result = ErrFromObject({ message: "Failed" }).map(value => value);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe("Failed");
    });

    test("does not pipe through a function when in error state", () => {
      const mockFn = vi.fn();
      const result = ErrFromObject({ message: "Failed" }).pipe(mockFn);

      expect(mockFn).not.toHaveBeenCalled();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.isError()).toBe(true);
      expect(result.error?.message).toBe("Failed");
    });
  });
  describe("wrap functions", () => {
    describe("wrap()", () => {
      test("wraps a successful function call in Ok", () => {
        const result = wrap(() => 42);
        expect(result.ok).toBe(42);
        expect(result.isOk()).toBe(true);
      });

      test("wraps a throwing function in Err", () => {
        const result = wrap(() => {
          throw new Error("Failed");
        });

        expect(result.isError()).toBe(true);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe("Failed");
        expect(result.ok).toBeUndefined();
        expect(result.isOk()).toBe(false);
        expect(() => result.unwrap()).toThrow("Failed");
      });
    });

    describe("wrapAsync()", () => {
      test("wraps a successful function call in Ok", async () => {
        const result = await wrapAsync(() => toPromise(() => 7 * 8));
        expect(result.ok).toBe(56); // Corrected expected value
        expect(result.isOk()).toBe(true);
      });

      test("wraps a throwing function in Err", async () => {
        const result = await wrapAsync(async () => {
          return await toPromise(() => {
            throw new Error("Async fail");
          });
        });

        expect(result.isError()).toBe(true);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe("Async fail");
        expect(result.ok).toBeUndefined();
        expect(result.isOk()).toBe(false);
        expect(() => result.unwrap()).toThrow("Async fail");
      });
    });

    describe("wrapThrowable", () => {
      test("wraps a function that might throw", () => {
        const fn = vi.fn().mockReturnValue(42);
        const safeFn = wrapThrowable<number>(fn);

        const result = safeFn();
        expect(fn).toHaveBeenCalled();
        expect(result.ok).toBe(42);
        expect(result.isOk()).toBe(true);
      });

      test("catches errors from the wrapped function", () => {
        const fn = vi.fn().mockImplementation(() => {
          throw new Error("Failed");
        });
        const safeFn = wrapThrowable(fn);

        const result = safeFn();
        expect(result.isError()).toBe(true);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe("Failed");
        expect(() => result.unwrap()).toThrow("Failed");
      });
    });

    describe("wrapAsyncThrowable", () => {
      test("wraps an async function that resolves", async () => {
        const asyncFn = vi.fn().mockResolvedValue(42);
        const safeAsyncFn = wrapAsyncThrowable<number>(asyncFn);

        const result = await safeAsyncFn();
        expect(result.ok).toBe(42);
        expect(asyncFn).toHaveBeenCalled();
      });

      test("catches promise rejections", async () => {
        const asyncFn = vi.fn().mockRejectedValue(new Error("Async failed"));
        const safeAsyncFn = wrapAsyncThrowable(asyncFn);

        const result = await safeAsyncFn();
        expect(result.isError()).toBe(true);
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error?.message).toBe("Async failed");
        expect(() => result.unwrap()).toThrow("Async failed");
      });
    });
  });
});
