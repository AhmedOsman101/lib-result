/**
 * Defines methods for a `Result` type, providing type-safe operations for checking and extracting values.
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error`.
 * @template U - The return type of `unwrap`, typically `T` for `OkState` or `never` for `ErrorState`.
 */
interface ResultMethods<T, E extends Error, U> {
  /**
   * Checks if the result is in the `Ok` state (contains a value and no error).
   * @returns `true` if the result is `Ok`, narrowing the type to `OkState<T, E>`.
   */
  isOk(): this is OkState<T, E>;

  /**
   * Checks if the result is in the `Err` state (contains an error and no value).
   * @returns `true` if the result is `Err`, narrowing the type to `ErrorState<E, T>`.
   */
  isError(): this is ErrorState<E, T>;

  /**
   * Extracts the value from an `OkState<T>` result or throws the error from an `ErrorState<E>` result.
   * @returns The success value (`T`) if `OkState<T>`, or throws the error (`E`) if `ErrorState<E>`.
   * @throws {E} The error if the result is in the Error state.
   */
  unwrap(): U;
}

/**
 * Represents a successful result state with an `ok` value and no error (undefined).
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 */
export type OkState<T, E extends Error = Error> = {
  /** The success value of type `T`. */
  ok: T;
  /** Always `undefined` in the `Ok` state, indicating no error. */
  error: undefined;
} & ResultMethods<T, E, T>;

/**
 * Represents an error result state with an error of type `E` and no value (undefined).
 * @template E - The error type, must extend `Error`.
 * @template T - The type of the success value (used for type compatibility with `Result`).
 */
export type ErrorState<E extends Error, T> = {
  /** Always `undefined` in the `Error` state, indicating no value. */
  ok: undefined;
  /** The error of type `E`. */
  error: E;
} & ResultMethods<T, E, never>;

/**
 * Simulates Rust's `Result` enum, representing either a success (`Ok`) or failure (`Err`).
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 * @remarks A `Result` is either an `OkState` with a value (`ok: T`, `error: undefined`)
 * or an `ErrorState` with an error (`ok: undefined`, `error: E`).
 * Use `isOk()` and `isError()` for type-safe checking, and `unwrap()` to extract the value or throw the error.
 */
export type Result<T, E extends Error = Error> =
  | OkState<T, E>
  | ErrorState<E, T>;
