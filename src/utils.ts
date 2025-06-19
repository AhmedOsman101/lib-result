import type { CustomError, CustomErrorProps, KeyValue } from "./types.js";

/**
 * Converts an unknown value to an `Error` instance.
 * @param {unknown} e - The value to convert. Can be an `Error`, string, or any other value.
 * @returns {Error} An `Error` instance:
 * - Returns the input unchanged if it's already an `Error` instance
 * - Creates a new `Error` with the input as message if it's a string
 * - Creates a new `Error` with "Unknown error" message and the input as cause otherwise
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

  return new Error("Unknown error");
}

/**
 * Type guard to check if a value is a non-null object that can be used as a key-value store.
 * @param {unknown} value - The value to check.
 * @returns {boolean} `true` if the value is a non-null, non-array object; `false` otherwise.
 * @example
 * // Returns true
 * isKeyValue({ key: 'value' });
 * isKeyValue(Object.create(null));
 *
 * // Returns false
 * isKeyValue(null);
 * isKeyValue(undefined);
 * isKeyValue([]);
 * isKeyValue('string');
 * isKeyValue(123);
 */
export function isKeyValue(value: unknown): value is KeyValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Creates a custom error object that extends the built-in Error with additional properties.
 * @template T - The type of additional properties to add to the error.
 * @param {CustomErrorProps<T>} [props] - An object containing error properties including an optional message and cause.
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
  props?: CustomErrorProps<T>
): CustomError<T> {
  const error = new Error(props?.message || "Unknown Error");

  if (isKeyValue(props)) {
    return Object.assign(error, props) as CustomError<T>;
  }
  return error as CustomError<T>;
}
