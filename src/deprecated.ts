import type { ErrorState, OkState, Result } from "./types.ts";

// DEPRECATED: Since v2.0.0, Completely removed in v3.0.0 //

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
