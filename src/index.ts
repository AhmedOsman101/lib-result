import type { ErrorState, OkState, Result } from "./index.d";

/**
 * @returns {OkState<T>} A Result in the Ok state
 * @example
 * const result = Ok(42);
 * // result: { ok: 42, error: undefined }
 */
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

  throw new TypeError("Errorexpects an Error instance");
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
 * Checks if a Result is in the Ok state
 * @template T - The type of the success value
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to check
 * @returns {result is OkState<T>} True if the Result is in the Ok state
 * @example
 * if (isOk(result)) {
 *   console.log(result.ok); // Safe to access result.ok
 * }
 */
export function isOk<T, E extends Error = Error>(
  result: Result<T, E>
): result is OkState<T> {
  return result.error === undefined;
}

/**
 * Checks if a Result is in the Err state
 * @template T - The type of the success value
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to check
 * @returns {result is ErrorState<E>} True if the Result is in the Err state
 * @example
 * if (isErr(result)) {
 *   console.error(result.error.message); // Safe to access result.error
 * }
 */
export function isErr<T, E extends Error = Error>(
  result: Result<T, E>
): result is ErrorState<E> {
  return result.error !== undefined;
}

/**
 * Extracts the success value from a Result, or throws the error if it's in the Err state
 * @template T - The type of the success value
 * @template E - The error type
 * @param {Result<T, E>} result - The Result to unwrap
 * @returns {T} The success value if the Result is in the Ok state
 * @throws The error E if the Result is in the Err state
 * @example
 * try {
 *   const value = unwrap(result);
 *   console.log(value); // Only runs if result is Ok
 * } catch (error) {
 *   console.error(error); // Runs if result is Err
 * }
 */
export function unwrap<T, E extends Error = Error>(result: Result<T, E>): T {
  if (isOk(result)) return result.ok;
  throw result.error;
}
