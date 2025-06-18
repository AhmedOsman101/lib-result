import type { CustomError, CustomErrorProps } from "./types.js";

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
 * console.log(unknownError.cause); // { code: 404 }
 */
export function toError(e: unknown): Error {
  if (e instanceof Error) return e;
  if (typeof e === "string") new Error(e);
  return new Error("Unknown error", { cause: e });
}

// Factory function to create an Error with custom properties
export function createCustomError(
  props?: CustomErrorProps,
  message = ""
): CustomError {
  const error = new Error(message);
  return props !== undefined ? Object.assign(error, props) : error;
}
