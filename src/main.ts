import { Err, Ok } from "./mixens.ts";
import type { Callback, CustomError, Result } from "./types.ts";
import { toError } from "./utils.ts";

/**
 * Wraps a synchronous function, capturing its return value as an `Ok` result or any thrown error as an `Error` result.
 * @template T - The type of the success value returned by the callback.
 * @param callback - A synchronous function that may return a value or throw an error.
 * @returns {Result<T, CustomError>} A `Result` containing the function's return value (`Ok`) or the caught error (`Error`).
 * @example
 * function divide(a: number, b: number): number {
 *   if (b === 0) throw new Error("Division by zero");
 *   return a / b;
 * }
 * const result = wrap(() => divide(10, 2)); // { ok: 5, error: undefined }
 * const errorResult = wrap(() => divide(10, 0)); // { ok: undefined, error: Error("Division by zero") }
 */
export function wrap<T>(callback: () => T): Result<T, CustomError> {
  try {
    return Ok(callback());
  } catch (error) {
    return Err(toError(error));
  }
}

/**
 * Wraps an asynchronous function, capturing its resolved value as an `Ok` result or any rejected error as an `Error` result.
 * @template T - The type of the success value resolved by the callback's promise.
 * @param callback - An asynchronous function that returns a `Promise` which may resolve to a value or reject with an error.
 * @returns {Promise<Result<T, CustomError>>} A `Promise` resolving to a `Result` containing the resolved value (`Ok`) or the caught error (`Error`).
 * @example
 * async function divideAsync(a: number, b: number): Promise<number> {
 *   if (b === 0) throw new Error("Division by zero");
 *   return a / b;
 * }
 * const result = await wrapAsync(async () => await divideAsync(10, 2)); // { ok: 5, error: undefined }
 * const errRes = await wrapAsync(async () => await divideAsync(10, 0)); // { ok: undefined, error: Error("Division by zero") }
 */
export async function wrapAsync<T>(
  callback: () => Promise<T>
): Promise<Result<T, CustomError>> {
  try {
    return Ok(await callback());
  } catch (error) {
    return Err(toError(error));
  }
}

/**
 * Wraps a function that might throw errors into a function that returns a Result type.
 * @template Args - The tuple type of arguments the function accepts
 * @template T - The type of value the function returns
 * @param callback - The function to wrap, which may throw errors
 * @returns A new function that takes the same arguments but returns a Result type
 * @example
 * const divide = (a: number, b: number): number => {
 *   if (b === 0) throw new Error("Division by zero");
 *   return a / b;
 * };
 * const safeDivide = wrapThrowable(divide);
 * const result = safeDivide(10, 2); // { ok: 5, error: undefined }
 * const errorResult = safeDivide(10, 0); // { ok: undefined, error: Error("Division by zero") }
 */
export function wrapThrowable<T, Args extends unknown[] = []>(
  callback: Callback<Args, T>
): Callback<Args, Result<T, CustomError>> {
  return (...args: Args) => {
    try {
      return Ok(callback(...args));
    } catch (e) {
      return Err(toError(e));
    }
  };
}

/**
 * Wraps an async function that might throw errors into a function that returns a Promise of Result type.
 * @template Args - The tuple type of arguments the function accepts
 * @template T - The type of value the function's Promise resolves to
 * @param callback - The async function to wrap, which may throw errors or reject its Promise
 * @returns A new async function that takes the same arguments but returns a Promise of Result type
 * @example
 * const fetchJson = wrapAsyncThrowable(async (url: string) => {
 *   const res = await fetch(url);
 *   if (!res.ok) throw new Error("Failed to fetch");
 *   return res.json();
 * });
 *
 * const result = await fetchJson("https://example.com/data.json");
 * if (result.isOk()) {
 *   console.log(result.ok);
 * } else {
 *   console.error(result.error.message);
 * }
 */
export function wrapAsyncThrowable<T, Args extends unknown[] = []>(
  callback: Callback<Args, Promise<T>>
): Callback<Args, Promise<Result<T, CustomError>>> {
  return async (...args: Args) => {
    try {
      return Ok(await callback(...args));
    } catch (e) {
      return Err(toError(e));
    }
  };
}
