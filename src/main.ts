import type {
  Callback,
  CustomError,
  CustomErrorProps,
  ErrorState,
  KeyValue,
  OkState,
  Result,
} from "./types.js";
import { createCustomError, toError } from "./utils.js";

/**
 * Creates a successful `Result` in the `Ok` state.
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 * @param {T} ok - The success value
 * @returns {OkState<T, E>} A `Result` in the `Ok` state.
 * @example
 * const result = Ok(42);
 * // result: { ok: 42, error: undefined } // and some helper methods
 */
export function Ok<T, E extends Error = Error>(ok: T): OkState<T, E> {
  return {
    ok,
    error: undefined,
    isError(): this is ErrorState<E, T> {
      return this.error !== undefined;
    },
    isOk(): this is OkState<T, E> {
      return this.error === undefined;
    },
    unwrap(): T {
      return this.ok;
    },
    map<U>(fn: (value: T) => U): Result<U, E> {
      try {
        return Ok(fn(this.ok));
      } catch (e) {
        return Err(toError(e) as E);
      }
    },
    pipe<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
      try {
        return fn(this.ok);
      } catch (e) {
        return Err(toError(e) as E);
      }
    },
  };
}

/**
 * Creates a failure `Result` in the `Error` state from an `Error` instance.
 * @template E - The error type, must extend `Error`.
 * @template T - The type of the success value (used for type compatibility with `Result`).
 * @param {E} error - The error instance, must be an instance of `Error` or a subclass.
 * @returns {ErrorState<E, T>} A `Result` in the `Error` state with the provided error and no value.
 * @throws {TypeError} If the provided `error` is not an instance of `Error`.
 * @example
 * const result = Err(new Error("Something went wrong"));
 * // result: { ok: undefined, error: Error("Something went wrong") } // and some helper methods
 */
export function Err<E extends Error, T>(error: E): ErrorState<E, T> {
  if (error instanceof Error) {
    return {
      ok: undefined,
      error,
      isError(): this is ErrorState<E, T> {
        return this.error !== undefined;
      },
      isOk(): this is OkState<T, E> {
        return this.error === undefined;
      },
      unwrap(): never {
        throw this.error;
      },
      map<U>(_fn: (value: T) => U): Result<U, E> {
        return Err(this.error);
      },
      pipe<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
        return Err(this.error);
      },
    };
  }

  throw new TypeError("Err expects an Error instance");
}

/*
 **
 * Creates a failure `Result` in the `Error` state from a string message.
 * @template T - The type of the success value (used for type compatibility with `Result`).
 * @param {string} message - The error message
 * @returns {ErrorState<Error, T>} A `Result` in the `Err` state with a new `Error` instance containing the message.
 * @example
 * const result = ErrFromText("Something went wrong");
 * // result: { ok: undefined, error: Error("Something went wrong") } // and some helper methods
 */
export function ErrFromText<T>(message: string): ErrorState<Error, T> {
  return {
    ok: undefined,
    error: new Error(message),
    isError(): this is ErrorState<Error, T> {
      return this.error !== undefined;
    },
    isOk(): this is OkState<T, Error> {
      return this.error === undefined;
    },
    unwrap(): never {
      throw this.error;
    },
    map<U>(_fn: (value: T) => U): Result<U, Error> {
      return Err(this.error);
    },
    pipe<U>(_fn: (value: T) => Result<U, Error>): Result<U, Error> {
      return Err(this.error);
    },
  };
}

/**
 * Creates a failure `Result` in the `Error` state from custom error properties.
 * This is particularly useful for creating type-safe error objects with additional metadata.
 *
 * @template T - The success type parameter (unused in the error case but maintains Result type compatibility)
 * @template E - The type of additional properties for the custom error
 * @param {CustomErrorProps<E>} props - An object containing error properties including an optional message and cause
 * @returns {ErrorState<CustomError<E>, T>} A `Result` in the `Error` state with the provided error properties
 *
 * @example
 * // Basic usage with custom properties
 * const result = ErrFromObject<number, { code: number; status: string }>({
 *   message: 'Resource not found',
 *   code: 404,
 *   status: 'Not Found'
 * });
 *
 * if (result.isError()) {
 *   console.log(result.error.message); // 'Resource not found'
 *   console.log(result.error.code);    // 404
 *   console.log(result.error.status);   // 'Not Found'
 * }
 *
 * // With error cause
 * try {
 *   // Some operation that might throw
 * } catch (cause) {
 *   const result = ErrFromObject({
 *     message: 'Operation failed',
 *     cause,
 *     timestamp: new Date().toISOString()
 *   });
 * }
 */
export function ErrFromObject<T, E extends KeyValue = KeyValue>(
  props?: CustomErrorProps<E>
): ErrorState<CustomError<E>, T> {
  return {
    ok: undefined,
    error: createCustomError(props),
    isError(): this is ErrorState<CustomError<E>, T> {
      return this.error !== undefined;
    },
    isOk(): this is OkState<T, CustomError<E>> {
      return this.error === undefined;
    },
    unwrap(): never {
      throw this.error;
    },
    map<U>(_fn: (value: T) => U): Result<U, CustomError<E>> {
      return Err(this.error);
    },
    pipe<U>(
      _fn: (value: T) => Result<U, CustomError<E>>
    ): Result<U, CustomError<E>> {
      return Err(this.error);
    },
  };
}

/**
 * Wraps a synchronous function, capturing its return value as an `Ok` result or any thrown error as an `Error` result.
 * @template T - The type of the success value returned by the callback.
 * @param callback - A synchronous function that may return a value or throw an error.
 * @returns {Result<T, Error>} A `Result` containing the function's return value (`Ok`) or the caught error (`Error`).
 * @example
 * function divide(a: number, b: number): number {
 *   if (b === 0) throw new Error("Division by zero");
 *   return a / b;
 * }
 * const result = wrap(() => divide(10, 2)); // { ok: 5, error: undefined }
 * const errorResult = wrap(() => divide(10, 0)); // { ok: undefined, error: Error("Division by zero") }
 */
export function wrap<T>(callback: () => T): Result<T, Error> {
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
 * @returns {Promise<Result<T, Error>>} A `Promise` resolving to a `Result` containing the resolved value (`Ok`) or the caught error (`Error`).
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
): Promise<Result<T, Error>> {
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
export function wrapThrowable<Args extends unknown[], T>(
  callback: Callback<Args, T>
): Callback<Args, Result<T, Error>> {
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
export function wrapAsyncThrowable<Args extends unknown[], T>(
  callback: Callback<Args, Promise<T>>
): Callback<Args, Promise<Result<T, Error>>> {
  return async (...args: Args) => {
    try {
      return Ok(await callback(...args));
    } catch (e) {
      return Err(toError(e));
    }
  };
}

// --- Functions for backward compatibility with v1 (deprecated since v2.0.0 ) --- //

/**
 * Checks if a `Result` is in the `Ok` state.
 * @template T - The type of the success value.
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to check
 * @returns {result is OkState<T>} `true` if the `Result` is in the `Ok` state, narrowing the type to `OkState<T, E>`.
 * @deprecated Since version 2.0.0. Use `result.isOk()` for a more consistent and encapsulated API.
 * @example
 * const result = Ok(42);
 * // Deprecated usage
 * if (isOk(result)) {
 *   console.log(result.ok);
 * }
 * // Preferred usage
 * if (result.isOk()) {
 *   console.log(result.ok);
 * }
 */
export function isOk<T, E extends Error = Error>(
  result: Result<T, E>
): result is OkState<T, E> {
  return result.error === undefined;
}

/**
 * Checks if a `Result` is in the `Error` state.
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 * @param {Result<T, E>} result - The `Result` to check.
 * @returns {result is ErrorState<E>} `true` if the `Result` is in the `Error` state, narrowing the type to `ErrorState<E, T>`.
 * @deprecated Since version 2.0.0. Use `result.isError()` for a more consistent and encapsulated API.
 * @example
 * const result = Err(new Error("Failed"));
 * // Deprecated usage
 * if (isError(result)) {
 *   console.error(result.error.message);
 * }
 * // Preferred usage
 * if (result.isErr()) {
 *   console.error(result.error.message);
 * }
 */
export function isErr<T, E extends Error = Error>(
  result: Result<T, E>
): result is ErrorState<E, T> {
  return result.error !== undefined;
}

/**
 * Extracts the success value from a `Result` or throws the error if in the `Error` state.
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 * @param {Result<T, E>} result - The `Result` to unwrap.
 * @returns {T} The success value if the `Result` is in the `Ok` state.
 * @throws {E} The error if the `Result` is in the `Error` state.
 * @deprecated Since version 2.1.4. Use `result.unwrap()` for a more consistent and encapsulated API.
 * @example
 * const result = Ok(42);
 * const errorResult = Err(new Error("Failed"));
 * // Deprecated usage
 * console.log(unwrap(result)); // 42
 * try {
 *   unwrap(errorResult); // Throws Error: "Failed"
 * } catch (e) {
 *   console.error(e.message); // "Failed"
 * }
 * // Preferred usage
 * console.log(result.unwrap()); // 42
 * try {
 *   errorResult.unwrap(); // Throws Error: "Failed"
 * } catch (e) {
 *   console.error(e.message); // "Failed"
 * }
 */
export function unwrap<T, E extends Error = Error>(result: Result<T, E>): T {
  if (result.isOk()) return result.ok;
  throw result.error;
}
