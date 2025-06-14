import type { ErrorState, OkState, Result } from "./types.js";

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
  };
}

/**
 * Extracts the success value from a `Result` or throws the error if in the `Error` state.
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 * @param {Result<T, E>} result - The `Result` to unwrap.
 * @returns {T} The success value if the `Result` is in the `Ok` state.
 * @throws {E} The error if the `Result` is in the `Error` state.
 * @example
 * const result = Ok(42);
 * console.log(unwrap(result)); // 42
 * const errorResult = Err(new Error("Failed"));
 * try {
 *   unwrap(errorResult); // Throws Error: "Failed"
 * } catch (e) {
 *   console.error(e.message); // "Failed"
 * }
 */
export function unwrap<T, E extends Error = Error>(result: Result<T, E>): T {
  if (result.isOk()) return result.ok;
  throw result.error;
}

/**
 * Converts an unknown value to an `Error` instance.
 * @param {unknown} e - The value to convert, typically an error or a string.
 * @returns {Error} An `Error` instance. If `e` is already an `Error`, it is returned unchanged.
 * If `e` is a string, a new `Error` is created with that message. Otherwise, a new `Error`
 * with the message "Unknown error" is returned.
 * @example
 * try {
 *   throw "Something went wrong";
 * } catch (e) {
 *   const error = toError(e); // Error: "Something went wrong"
 *   console.log(error.message);
 * }
 */
function toError(e: unknown): Error {
  return e instanceof Error
    ? e
    : new Error(typeof e === "string" ? e : "Unknown error");
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
