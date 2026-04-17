/** biome-ignore-all lint/complexity/noBannedTypes: No alternative */
// deno-lint-ignore-file

/**
 * Defines methods for a `Result` type, providing type-safe operations for checking and extracting values.
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error`.
 * @template U - The return type of `unwrap`, typically `T` for `OkState` or `never` for `ErrorState`.
 */
export interface ResultMethods<T, E extends Error> {
  /**
   * Returns the provided `Result` if this value is `Ok`, otherwise preserves the current `Err`.
   * This is the eager counterpart to `andThen`.
   * @template U - The success type of the provided `Result`.
   * @param {Result<U, E>} result - The `Result` to return when this value is `Ok`.
   * @returns {Result<U, E>} The provided `result` when `Ok`, or the current error when `Err`.
   * @example
   * const ok = Ok(1).and(Ok("done"));
   * // ok: Result<string, Error> = Ok("done")
   *
   * const err = Err<string>(new Error("Failed")).and(Ok("done"));
   * // err: Result<string, Error> = Err(Error("Failed"))
   */
  and<U>(result: Result<U, E>): Result<U, E>;

  /**
   * Chains a transformation by passing the `Ok` value to a function that returns a new `Result`, preserving the `Err` state if present.
   * This is the Rust-style composition method for sequencing operations that may fail.
   * @template U - The type of the success value in the returned `Result`.
   * @param {(value: T) => Result<U, E>} fn - A function that takes the `Ok` value of type `T` and returns a new `Result<U, E>`.
   * @returns {Result<U, E>} A new `Result<U, E>`: the result of `fn` if the original `Result` is `Ok`, or the same `Err` state if the original `Result` is `Err`.
   * @example
   * // Chaining transformations
   * const result: Result<number, Error> = Ok(5);
   * const chained = result
   *   .andThen(x => Ok(x * 2)) // Result<number, Error> = Ok(10)
   *   .andThen(x => Ok(x.toString())); // Result<string, Error> = Ok("10")
   * if (chained.isOk()) {
   *   console.log(chained.ok); // "10"
   * }
   *
   * // Preserving Err state
   * const error: Result<number, Error> = Err(new Error("Failed"));
   * const chainedError = error.andThen(x => Ok(x * 2));
   * // Result<number, Error> = Err(Error("Failed"))
   * if (chainedError.isError()) {
   *   console.log(chainedError.error.message); // "Failed"
   * }
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>;

  /**
   * Extracts the success value from an `OkState<T>` result.
   * If the result is an `ErrorState<E>`, it throws a `CustomError` with the provided message,
   * and the original error from `ErrorState<E>` is passed as the `cause` property.
   * @returns {T} The success value if `OkState<T>`.
   * @throws {CustomError} Throws a `CustomError` containing the provided message and the original error as its cause, if the result is in the Error state.
   */
  expect(message: string): T;

  /**
   * Extracts the error value from an `Err` result.
   * If the result is `Ok`, it throws a `CustomError` with the provided message.
   * @param {string} message - Message used when the result unexpectedly contains an `Ok` value.
   * @returns {E} The contained error when the result is `Err`.
   * @throws {CustomError} Throws when the result is `Ok`.
   */
  expectErr(message: string): E;

  /**
   * Runs a side-effect function on the success value when the result is `Ok`.
   * The original `Result` is returned unchanged.
   * @param {(value: T) => void} fn - Function invoked with the `Ok` value.
   * @returns {Result<T, E>} The original result.
   * @example
   * const result = Ok(42).inspect(value => console.log(value));
   * // logs 42 and returns the same Result
   */
  inspect(fn: (value: T) => void): Result<T, E>;

  /**
   * Runs a side-effect function on the error value when the result is `Err`.
   * The original `Result` is returned unchanged.
   * @param {(error: E) => void} fn - Function invoked with the `Err` value.
   * @returns {Result<T, E>} The original result.
   * @example
   * const result = Err(new Error("Failed")).inspectErr(error => console.error(error.message));
   * // logs "Failed" and returns the same Result
   */
  inspectErr(fn: (error: E) => void): Result<T, E>;

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
   * Transforms the `Ok` value into a plain value, or returns the provided default when the result is `Err`.
   * The default is evaluated eagerly.
   * @template U - The plain value type returned by either branch.
   * @param {U} defaultValue - Value returned when the result is `Err`.
   * @param {(value: T) => U} fn - Function used to transform the `Ok` value.
   * @returns {U} Either the transformed `Ok` value or `defaultValue`.
   */
  mapOr<U>(defaultValue: U, fn: (value: T) => U): U;

  /**
   * Transforms either branch of the result into a plain value.
   * When the result is `Err`, `defaultFn` receives the error; when it is `Ok`, `fn` receives the success value.
   * @template U - The plain value type returned by either branch.
   * @param {(error: E) => U} defaultFn - Function used to transform the `Err` value.
   * @param {(value: T) => U} fn - Function used to transform the `Ok` value.
   * @returns {U} The value returned by the matching branch transformer.
   */
  mapOrElse<U>(defaultFn: (error: E) => U, fn: (value: T) => U): U;

  /**
   * Transforms the error value of a `Result` using the provided function, preserving the ok value if in the `Ok` state.
   * @template U - The type of the transformed error value.
   * @param fn - A function that takes the `Err` value of type `E` and returns a new error of type `U`.
   * @returns A new `Result` containing the transformed error (`Err<U>`) if the original `Result` is `Err`, or the same value (`Ok<T>`) if the original `Result` is `Ok`.
   * @example
   * const error = ErrFromText("Something happened");
   * const mapped = error.mapErr(e => new AppError(`Error: ${e.message}`));
   * // mapped: Result<undefined, AppError>;
   *
   * const result = Ok(5);
   * const mapped = result.mapErr(e => new AppError(`Error: ${e.message}`));
   * // mapped: Result<number, Error> = Ok("5")
   */
  mapErr<U extends Error>(fn: (error: E) => U): Result<T, U>;

  /**
   * Pattern matches on the Result state, transforming both `Ok` and `Err` cases into a common type.
   *
   * @template U - The type that both transformations will produce.
   * @param {object} matchers - An object containing the transformation functions for `Ok` and `Err` states.
   * @param {(value: T) => U} matchers.okFn - The function to apply if the Result is `Ok`. It receives the `Ok` value.
   * @param {(value: E) => U} matchers.errFn - The function to apply if the Result is `Err`. It receives the `Err` value.
   * @returns {U} The result of either `okFn` or `errFn` depending on the Result state.
   *
   * @example
   * const result: Result<number, Error> = Ok(42);
   * const message = result.match({
   * okFn: value => `Success: ${value}`,
   * errFn: error => `Error: ${error.message}`
   * }); // "Success: 42"
   *
   * const error: Result<number> = Err(new Error("Failed"));
   * const errorMessage = error.match({
   * okFn: value => `Success: ${value}`,
   * errFn: error => `Error: ${error.message}`
   * }); // "Error: Failed"
   */
  match<U>(matchers: {
    okFn: (value: T) => U;
    errFn: ((error: E) => U) | (() => U);
  }): U;

  /**
   * Extracts the value from an `OkState<T>` result or throws the error from an `ErrorState<E>` result.
   * @returns The success value (`T`) if `OkState<T>`, or throws the error (`E`) if `ErrorState<E>`.
   * @throws {E} The error if the result is in the Error state.
   */
  unwrap(): T;

  /**
   * Returns the success value if the Result is `Ok`, or computes a fallback value from the error if it's `Err`.
   * Unlike `unwrapOr`, the fallback is lazy and receives the original error.
   * @param {(error: E) => T} fn - Function to handle the error case and provide a fallback value.
   * @returns {T} Either the success value or the value returned by the error handler.
   * @example
   * const result: Result<number, Error> = Ok(42);
   * const value = result.unwrapOrElse(() => 0); // 42
   *
   * const error: Result<number, Error> = Err(new Error("Failed"));
   * const fallback = error.unwrapOrElse(err => err.message.length); // 6
   */
  unwrapOrElse(fn: (error: E) => T): T;

  /**
   * Returns the success value if the Result is `Ok`, or the fallback value if it's `Err`.
   * @template T - The type of the ok and the fallback value.
   * @param {T} fallback - Fallback value to return if the result is `ErrorState`.
   * @returns {T} Either the success value or the fallback value.
   * @example
   * const result: Result<number, Error> = Ok(42);
   * const value = result.unwrapOr(0); // 42
   *
   * const error: Result<number, Error> = Err(new Error("Failed"));
   * const fallback = error.unwrapOr(0); // 0
   */
  unwrapOr(fallback: T): T;
}

/**
 * Represents a successful result state with an `ok` value and no error (undefined).
 * @template T - The type of the success value.
 * @template E - The error type, must extend `Error` (defaults to `Error`).
 */
export interface OkState<T, E extends Error = Error>
  extends ResultMethods<T, E> {
  /** The success value of type `T`. */
  readonly ok: T;
  /** Always `undefined` in the `Ok` state, indicating no error. */
  readonly error: undefined;
}

/**
 * Represents an error result state with an error of type `E` and no value (undefined).
 * @template E - The error type, must extend `Error`.
 * @template T - The type of the success value (used for type compatibility with `Result`).
 */
export interface ErrorState<E extends Error = Error, T = undefined>
  extends ResultMethods<T, E> {
  /** Always `undefined` in the `Error` state, indicating no value. */
  readonly ok: undefined;
  /** The error of type `E`. */
  readonly error: E;
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
