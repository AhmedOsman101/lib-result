import { describe, expect, test } from "vitest";
import { createCustomError, isKeyValue, toError } from "../src/utils.ts";

describe("Internal Utils", () => {
  describe("toError", () => {
    test("Returns error when passed", () => {
      const error = new Error("error");
      const convertedError = toError(error);

      expect(convertedError).toBeInstanceOf(Error);
      expect(convertedError.message).toBe(error.message);
    });

    test("Returns new Error with the passed parameter as message if string", () => {
      const message = "error";
      const convertedError = toError(message);

      expect(convertedError).toBeInstanceOf(Error);
      expect(convertedError.message).toBe(message);
    });

    test("Returns new Error with the passed parameters as props if of type KeyPair", () => {
      const error = { info: "failed" };
      const convertedError = toError(error);

      expect(convertedError).toBeInstanceOf(Error);
      expect(convertedError.info).toBe("failed");
    });

    test("Returns a normal Error instance with message 'Unknown error' as a fallback", () => {
      const message = "Unknown error";
      const convertedError = toError(true);

      expect(convertedError).toBeInstanceOf(Error);
      expect(convertedError.message).toBe(message);
    });
  });

  describe("createCustomError()", () => {
    test("Adds type-safe properties to the Error object", () => {
      const info = "NOT_FOUND";
      const status = 404;
      const convertedError = createCustomError({
        status,
        info,
      });

      expect(convertedError).toBeInstanceOf(Error);
      expect(convertedError.info).toBe(info);
      expect(convertedError.status).toBe(status);
    });

    test("Returns an Error instance with a default message", () => {
      const convertedError = createCustomError();

      expect(convertedError).toBeInstanceOf(Error);
      expect(convertedError.message).toBe("Unknown Error");
    });
  });

  describe("isKeyValue()", () => {
    test("Checks for a valid KeyValue", () => {
      // Returns true
      expect(isKeyValue({ key: "value" })).toBe(true);
      expect(isKeyValue(Object.create(null))).toBe(true);

      // Returns false
      expect(isKeyValue(null)).toBe(false);
      expect(isKeyValue(undefined)).toBe(false);
      expect(isKeyValue([])).toBe(false);
      expect(isKeyValue("string")).toBe(false);
      expect(isKeyValue(123)).toBe(false);
    });
  });
});
