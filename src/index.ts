/**
 * @typedef {Object} OkState
 * @template T
 * @property {T} ok - The success value
 * @property {undefined} error - Always undefined in the Ok state
 */

/**
 * @typedef {Object} ErrorState
 * @template E
 * @property {undefined} ok - Always undefined in the Err state
 * @property {E} error - The error object, typically an instance of Error
 */

/** Represents a successful result state with a value and no error */
export type OkState<T> = { ok: T; error: undefined };

/** Represents an error result state with an error and no value */
export type ErrorState<E extends Error = Error> = { ok: undefined; error: E };

/**
 * Simulates Rust's Result enum, representing either success (Ok) or failure (Err)
 * @template T - The type of the success value
 * @template E - The error type, must extend Error (defaults to Error)
 */
export type Result<T, E extends Error = Error> = OkState<T> | ErrorState<E>;

/**
 * Creates a successful Result
 * @template T - The type of the success value
 * @param {T} ok - The success value
 * @returns {OkState<T>} A Result in the Ok state
 * @example
 * const result = Ok(42);
 * // result: { ok: 42, error: undefined }
 */
export function Ok<T>(ok: T): OkState<T> {
  return { ok, error: undefined };
}

/**
 * Creates a failure Result from an Error instance
 * @template E - The error type, must extend Error (defaults to Error)
 * @param {E} error - The error instance, must be an instance of Error
 * @returns {ErrorState<T>} A Result in the Err state
 * @throws TypeError If the provided error is not an Error instance
 * @example
 * const result = Err(new Error("Something went wrong"));
 * // result: { ok: undefined, error: Error("Something went wrong") }
 */
export function Err<E extends Error = Error>(error: E): ErrorState<E> {
  if (error instanceof Error) return { ok: undefined, error };
  throw new TypeError("Err expects an Error instance");
}

/**
 * Creates a failure Result from a string message
 * @param {string} message - The error message
 * @returns {ErrorState<Error>} A Result in the Err state with a new Error instance
 * @example
 * const result = ErrFromText("Something went wrong");
 * // result: { ok: undefined, error: Error("Something went wrong") }
 */
export function ErrFromText(message: string): ErrorState<Error> {
  return { ok: undefined, error: new Error(message) };
}

// --- Utility functions for javascript users --- //

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
