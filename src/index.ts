type OkState<T> = { ok: T; error: undefined };
type ErrorState<E extends Error = Error> = { ok: undefined; error: E };

// Rust's Result enum simulation
export type Result<T, E extends Error = Error> = OkState<T> | ErrorState<E>;

export function Ok<T>(ok: T): OkState<T> {
  return { ok, error: undefined };
}

export function Err<E extends Error = Error>(error: E): ErrorState<E> {
  if (error instanceof Error) return { ok: undefined, error };
  throw new TypeError('Err expects an Error instance');
}

export function ErrFromText(message: string): ErrorState<Error> {
  return { ok: undefined, error: new Error(message) };
}

// Utility functions for javascript users
export function isOk<T, E extends Error = Error>(result: Result<T, E>): result is OkState<T> {
  return result.ok !== undefined;
}

export function isErr<T, E extends Error = Error>(result: Result<T, E>): result is ErrorState<E> {
  return result.error !== undefined;
}

export function unwrap<T, E extends Error = Error>(result: Result<T, E>): T {
  if (isOk(result)) return result.ok;
  throw result.error;
}
