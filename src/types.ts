/** biome-ignore-all lint/complexity/noBannedTypes: No alternative */
// deno-lint-ignore-file no-explicit-any ban-types

/**
 * Defines methods for a `Result` type, providing type-safe operations for checking and extracting values.
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error`.
 * @template U - The return type of `unwrap`, typically `T` for `OkState` or `never` for `ErrorState`.
 */
export interface ResultMethods<T, E extends Error> {
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
  unwrap(): T;

  /**
   * Transforms the success value of a `Result` using the provided function, preserving the error if in the `Err` state.
   * @template U - The type of the transformed success value.
   * @param fn - A function that takes the `Ok` value of type `T` and returns a new value of type `U`.
   * @returns A new `Result` containing the transformed value (`Ok<U>`) if the original `Result` is `Ok`, or the same error (`Err<E>`) if the original `Result` is `Err`.
   * @example
   * const result = Ok(5);
   * const mapped = result.map(x => x.toString());
   * // mapped: Result<string, Error> = Ok("5")
   *
   * const error: Result<number, Error> = Err(new Error("Failed"));
   * const mappedError = error.map(x => x.toString());
   * // mappedError: Result<string, Error> = Err(Error("Failed"))
   */
  map<U>(fn: (value: T) => U): Result<U, E>;

  /**
   * Chains a transformation by passing the `Ok` value to a function that returns a new `Result`, preserving the `Err` state if present.
   * @template U - The type of the success value in the returned `Result`.
   * @param {(value: T) => Result<U, E>} fn - A function that takes the `Ok` value of type `T` and returns a new `Result<U, E>`.
   * @returns {Result<U, E>} A new `Result<U, E>`: the result of `fn` if the original `Result` is `Ok`, or the same `Err` state if the original `Result` is `Err`.
   * @example
   * // Chaining transformations
   * const result: Result<number, Error> = Ok(5);
   * const chained = result
   *   .pipe(x => Ok(x * 2)) // Result<number, Error> = Ok(10)
   *   .pipe(x => Ok(x.toString())); // Result<string, Error> = Ok("10")
   * if (chained.isOk()) {
   *   console.log(chained.ok); // "10"
   * }
   *
   * // Preserving Err state
   * const error: Result<number, Error> = Err(new Error("Failed"));
   * const chainedError = error.pipe(x => Ok(x * 2)); // Result<number, Error> = Err(Error("Failed"))
   * if (chainedError.isErr()) {
   *   console.log(chainedError.error.message); // "Failed"
   * }
   */
  pipe<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
}

/**
 * Represents a successful result state with an `ok` value and no error (undefined).
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 */
export interface OkState<T, E extends Error = Error>
  extends ResultMethods<T, E> {
  /** The success value of type `T`. */
  ok: T;
  /** Always `undefined` in the `Ok` state, indicating no error. */
  error: undefined;
}

/**
 * Represents an error result state with an error of type `E` and no value (undefined).
 * @template E - The error type, must extend `Error`.
 * @template T - The type of the success value (used for type compatibility with `Result`).
 */
export interface ErrorState<E extends Error = Error, T = undefined>
  extends ResultMethods<T, E> {
  /** Always `undefined` in the `Error` state, indicating no value. */
  ok: undefined;
  /** The error of type `E`. */
  error: E;
}

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

/**
 * Represents a custom error type that extends the built-in `Error` object
 * with additional properties defined in `CustomErrorProps`.
 *
 * @example
 * const err: CustomError<{ code: number; info: string }> =
 *   Object.assign(new Error("Oops"), { code: 404, info: "Not Found" });
 * console.log(err.info); // "Not Found"
 * console.log(err.code); // 404
 */
export type CustomError<T extends OptionalKeyValue = undefined> =
  T extends undefined ? Error : Error & CustomErrorProps<T>;

/**
 * Defines the shape of properties that can be added to a custom error.
 * When `T` is `undefined`, resolves to `never`. Otherwise, it combines `T` with optional
 * standard error properties.
 * @template T - The type of additional properties to include in the error.
 * @example
 * type ApiErrorProps = CustomErrorProps<{ code: number; status: string }>;
 * // Equivalent to: { code: number; status: string; message?: string; cause?: unknown }
 */
export type CustomErrorProps<T extends OptionalKeyValue> = T extends undefined
  ? never
  : T &
      // if T already has a `message` key, add nothing; otherwise add an optional message
      (T extends { message: string } ? {} : { message?: string }) &
      // biome-ignore lint/suspicious/noExplicitAny: cause can accept any value
      (T extends { cause: any } ? {} : { cause?: unknown });

// --- Helper Types --- //

/**
 * A function type that takes a tuple of arguments and returns a value.
 * @template Args - A tuple type representing the arguments the function accepts.
 * @template T - The return type of the function.
 * @example
 * // A function that takes two numbers and returns a number
 * type Add = Callback<[number, number], number>;
 *
 * // A function that takes no arguments and returns a string
 * type GetText = Callback<[], string>;
 */
export type Callback<Args extends unknown[], T> = (...args: Args) => T;

/**
 * Represents an object that can have any string or symbol keys with unknown value types.
 * Useful for type-checking objects with dynamic property access.
 * @example
 * const config: KeyValue = {
 *   timeout: 1000,
 *   retry: true,
 *   onError: (err: Error) => {}
 * };
 */
export type KeyValue = Record<string | symbol, unknown>;

/**
 * A variant of KeyValue that can also be undefined.
 * Useful for optional configuration objects or function parameters.
 * @example
 * function configure(options?: OptionalKeyValue) {
 *   // options might be undefined
 *   const timeout = options?.timeout; // unknown
 * }
 */
export type OptionalKeyValue = KeyValue | undefined;
