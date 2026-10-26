import type { CustomError, KeyValue } from "./types.ts";

/**
 * Converts an unknown value to an `Error` instance or a compatible custom error.
 * @param {unknown} e - The value to convert. Can be an `Error`, string, or any other value.
 * @returns {Error} An `Error` instance or a compatible custom error:
 * - Returns the input if it's already an `Error` instance
 * - Creates a new `Error` with the input as message if it's a string
 * - Creates a new custom error with properties if it's a key-value object
 * - Otherwise, creates a new `Error` with "Unknown error" message
 * @example
 * // With Error instance
 * const error = toError(new Error("Failed"));
 * console.log(error.message); // "Failed"
 *
 * // With string
 * const stringError = toError("Operation failed");
 * console.log(stringError.message); // "Operation failed"
 *
 * // With other value
 * const unknownError = toError({ code: 404 });
 * console.log(unknownError.message); // "Unknown error"
 * console.log(unknownError.code); // 404
 */
export function toError<T extends KeyValue>(e: T): CustomError<T>;
export function toError(e: unknown): CustomError;
export function toError(e: unknown): CustomError {
  if (e instanceof Error) return e;

  if (typeof e === "string") return new Error(e);

  if (isKeyValue(e)) return createCustomError<typeof e>(e);

  if (e === undefined) return new Error("Unknown error");

  return new Error("Unknown error", { cause: e });
}

/**
 * Type guard to check if a value can be used as a key-value store.
 * Accepts plain objects (including `Object.create(null)`), `Map` instances,
 * and objects carrying own enumerable fields (e.g. class instances). Values
 * without representable key-value content — `Date`, `Set`, arrays,
 * primitives — are rejected.
 * @param {unknown} value - The value to check.
 * @returns {boolean} `true` if the value is a key-value store; `false` otherwise.
 * @example
 * // Returns true
 * isKeyValue({ key: 'value' });
 * isKeyValue(Object.create(null));
 * isKeyValue(new Map([['key', 'value']]));
 *
 * // Returns false
 * isKeyValue(null);
 * isKeyValue(undefined);
 * isKeyValue([]);
 * isKeyValue(new Date());
 * isKeyValue('string');
 * isKeyValue(123);
 */
export function isKeyValue(value: unknown): value is KeyValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  if (value instanceof Map) return true;

  const proto = Object.getPrototypeOf(value);
  if (proto === Object.prototype || proto === null) return true;

  return Object.keys(value).length > 0;
}

/**
 * Creates a custom error object that extends the built-in Error with additional properties.
 * @template T - The type of additional properties to add to the error.
 * @param {T} [props] - An object containing error properties. A `message` property is used as the Error message.
 * @returns {CustomError<T>} A new Error instance extended with the provided properties.
 * @example
 * // Basic usage
 * const err = createCustomError({
 *   message: 'Not found',
 *   code: 404,
 *   details: { path: '/api/resource' }
 * });
 * console.log(err instanceof Error); // true
 * console.log(err.code); // 404
 * console.log(err.details); // { path: '/api/resource' }
 *
 * // With cause
 * const cause = new Error('Original error');
 * const errWithCause = createCustomError({
 *   message: 'Operation failed',
 *   cause,
 *   retryable: true
 * });
 * console.log(errWithCause.cause === cause); // true
 */
export function createCustomError<T extends KeyValue>(
  props?: T
): CustomError<T> {
  const record: Record<PropertyKey, unknown> | undefined = props
    ? props instanceof Map
      ? Object.fromEntries(props)
      : props
    : undefined;
  const message =
    record && typeof record.message === "string"
      ? record.message
      : "Unknown Error";
  const error = new Error(message);

  if (record) {
    return Object.assign(error, { ...record, message }) as CustomError<T>;
  }
  return error as CustomError<T>;
}
