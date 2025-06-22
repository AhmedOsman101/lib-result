import type {
  CustomError,
  CustomErrorProps,
  ErrorState,
  KeyValue,
  OkState,
  Result,
} from "./types.js";
import { createCustomError, toError } from "./utils.js";

const methodsArray = [
  withIsOk,
  withIsError,
  withUnwrap,
  withExpect,
  withMap,
  withPipe,
  withMatch,
  withOrElse,
  withUnwrapOr,
] as const;

function compose<T>(base: T, ...fns: ((obj: T) => T)[]) {
  return Object.freeze(fns.reduce((obj, fn) => fn(obj), base));
}

function withIsOk<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    isOk(this: R): this is OkState<T, E> {
      return this.error === undefined;
    },
  });
}

function withIsError<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    isError(this: R): this is ErrorState<E, T> {
      return this.error !== undefined;
    },
  });
}

function withUnwrap<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    unwrap(this: R): T | never {
      if (this.isOk()) return this.ok;
      throw this.error as E;
    },
  });
}

function withExpect<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    expect(this: R, message: string): T | never {
      if (this.isOk()) return this.ok;
      throw createCustomError({
        message,
        cause: this.error as E,
      });
    },
  });
}

function withMap<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    map<U>(this: R, fn: (value: T) => U): Result<U, E> {
      try {
        if (this.isOk()) return Ok(fn(this.ok as T));
      } catch (e) {
        return Err(toError(e) as E);
      }
      return Err(this.error as E);
    },
  });
}

function withPipe<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    pipe<U>(this: R, fn: (value: T) => Result<U, E>): Result<U, E> {
      try {
        if (this.isOk()) return fn(this.ok as T);
      } catch (e) {
        return Err(toError(e) as E);
      }
      return Err(this.error as E);
    },
  });
}

function withMatch<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    match<U>(this: R, okFn: (value: T) => U, errFn: (value: E) => U): U {
      try {
        if (this.isOk()) return okFn(this.ok as T);
        return errFn(this.error as E);
      } catch (e) {
        return errFn(toError(e) as E);
      }
    },
  });
}

function withOrElse<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    orElse<U>(this: R, errFn: (value: E) => U): T | U {
      try {
        if (this.isOk()) return this.ok as T;
        return errFn(this.error as E);
      } catch (e) {
        throw toError(e);
      }
    },
  });
}

function withUnwrapOr<T, E extends Error, R extends Result<T, E>>(base: R) {
  return Object.assign(base, {
    unwrapOr(this: R, fallback: T): T {
      return this.isOk() ? (this.ok as T) : fallback;
    },
  });
}

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
function Ok<T, E extends Error = Error>(ok: T): OkState<T, E> {
  return compose({ ok, error: undefined } as OkState<T, E>, ...methodsArray);
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
function Err<T = undefined, E extends Error = Error>(
  error: E
): ErrorState<E, T> {
  if (!(error instanceof Error)) {
    throw new TypeError(
      "Err expects an Error instance, use ErrFromObject instead."
    );
  }
  return compose({ ok: undefined, error } as ErrorState<E, T>, ...methodsArray);
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
function ErrFromText<T = undefined>(message: string): ErrorState<Error, T> {
  return compose(
    { ok: undefined, error: new Error(message) } as ErrorState<Error, T>,
    ...methodsArray
  );
}

/**
 * Creates a failure `Result` in the `Error` state from custom error properties.
 * This is particularly useful for creating type-safe error objects with additional metadata.
 *
 * @template T - The success type parameter (unused in the error case but maintains Result type compatibility)
 * @template P - The type of additional properties for the custom error
 * @param {CustomErrorProps<P>} props - An object containing error properties including an optional message and cause
 * @returns {ErrorState<CustomError<P>, T>} A `Result` in the `Error` state with the provided error properties
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
function ErrFromObject<P extends KeyValue = KeyValue, T = undefined>(
  props: CustomErrorProps<P>
): ErrorState<CustomError<P>, T> {
  return compose(
    {
      ok: undefined,
      error: createCustomError(props),
    } as ErrorState<CustomError<P>, T>,
    ...methodsArray
  );
}

export { Ok, Err, ErrFromText, ErrFromObject };
