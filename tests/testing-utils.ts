import { Err, Ok, type Result } from "../dist/index.js";

export class DivisionError extends Error {
  constructor(message = "Cannot Divide By Zero") {
    super(message);
  }
}

export function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return Err(new DivisionError());
  }
  return Ok(a / b);
}

export function mayDivide(a: number, b: number): number {
  if (b === 0) throw new Error("Division by zero");
  return a / b;
}

export function toPromise<T>(fn: () => T | Promise<T>): Promise<T> {
  try {
    return Promise.resolve(fn());
  } catch (err) {
    return Promise.reject(err);
  }
}

export const double = (x: number) => x * 2;

export const FAKE_API_URL =
  "https://jsonplaceholder.typicode.com/users/1" as const;
export const INVALID_URL = "://invalid" as const;
