import type { CustomError, CustomErrorProps } from "./types.js";

/**
 * Converts an unknown value to an `Error` instance.
 * @param {unknown} e - The value to convert, typically an error or a string.
 * @returns {Error} An `Error` instance. If `e` is already an `Error`, it is returned unchanged.
 * If `e` is a string, a new `Error` is created with that message. Otherwise, a new `Error`
 * with the message "Unknown error" is returned.
 * @example
 * try {
 *   throw "Something went wrong";
 * } catch (e) {
 *   const error = toError(e); // Error: "Something went wrong"
 *   console.log(error.message);
 * }
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
