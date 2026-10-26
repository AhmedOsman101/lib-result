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

    test("Preserves the original value as cause for unrecognized types", () => {
      for (const value of [42, Symbol("sym"), true]) {
        const error = toError(value);

        expect(error.message).toBe("Unknown error");
        expect(error.cause).toBe(value);
      }
    });

    test("Omits cause when the original value is undefined", () => {
      const error = toError(undefined);

      expect(error.message).toBe("Unknown error");
      expect(Object.hasOwn(error, "cause")).toBe(false);
    });

    test("Preserves non-plain objects as cause", () => {
      for (const value of [new Date(0), new Set([1, 2])]) {
        const error = toError(value);

        expect(error.message).toBe("Unknown error");
        expect(error.cause).toBe(value);
      }
    });

    test("Normalizes a Map of props into error fields", () => {
      const error = toError(
        new Map<PropertyKey, unknown>([
          ["message", "boom"],
          ["code", 404],
        ])
      );

      expect(error.message).toBe("boom");
      expect(error.code).toBe(404);
    });

    test("Merges own fields of class instances", () => {
      class HttpError {
        message = "Not found";
        code = 404;
      }
      const error = toError(new HttpError());

      expect(error.message).toBe("Not found");
      expect((error as { code?: number }).code).toBe(404);
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
      expect(isKeyValue(new Map([["key", "value"]]))).toBe(true);
      expect(isKeyValue(new Map())).toBe(true);
      class WithFields {
        code = 404;
      }
      expect(isKeyValue(new WithFields())).toBe(true);

      // Returns false
      expect(isKeyValue(null)).toBe(false);
      expect(isKeyValue(undefined)).toBe(false);
      expect(isKeyValue([])).toBe(false);
      expect(isKeyValue("string")).toBe(false);
      expect(isKeyValue(123)).toBe(false);
      expect(isKeyValue(new Date())).toBe(false);
      expect(isKeyValue(new Set())).toBe(false);
      class Custom {}
      expect(isKeyValue(new Custom())).toBe(false);
    });
  });
});
