import type { ErrorState, OkState, Result } from "./types.ts";
import { createCustomError, toError } from "./utils.ts";

type ResultFactory = {
  err: <T = undefined, E extends Error = Error>(error: E) => ErrorState<E, T>;
  ok: <T, E extends Error = Error>(ok: T) => OkState<T, E>;
};

type ResultErrorFactory = Pick<ResultFactory, "err">;

type ResultOkFactory = Pick<ResultFactory, "ok">;

type MethodInstaller = <T, E extends Error, R extends Result<T, E>>(
  base: R
) => R;

function createWithAndThen({ err }: ResultErrorFactory): MethodInstaller {
  return function withAndThen<T, E extends Error, R extends Result<T, E>>(
    base: R
  ): R {
    return Object.assign(base, {
      andThen<U>(this: R, fn: (value: T) => Result<U, E>): Result<U, E> {
        try {
          if (this.isOk()) return fn(this.ok as T);
          return err(this.error as E);
        } catch (e) {
          throw toError(e);
        }
      },
    });
  };
}

function withExpect<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    expect(this: R, message: string): T | never {
      if (this.isOk()) return this.ok as T;
      throw createCustomError({
        message,
        cause: this.error as E,
      });
    },
  });
}

function withIsError<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    isError(this: R): this is ErrorState<E, T> {
      return this.error !== undefined;
    },
  });
}

function withIsOk<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    isOk(this: R): this is OkState<T, E> {
      return this.error === undefined;
    },
  });
}

function createWithMap({ err, ok }: ResultFactory): MethodInstaller {
  return function withMap<T, E extends Error, R extends Result<T, E>>(
    base: R
  ): R {
    return Object.assign(base, {
      map<U>(this: R, fn: (value: T) => U): Result<U, E> {
        try {
          if (this.isOk()) return ok(fn(this.ok as T));
          return err(this.error as E);
        } catch (e) {
          throw toError(e);
        }
      },
    });
  };
}

function createWithMapErr({ err, ok }: ResultFactory): MethodInstaller {
  return function withMapErr<T, E extends Error, R extends Result<T, E>>(
    base: R
  ): R {
    return Object.assign(base, {
      mapErr<U extends Error>(this: R, fn: (error: E) => U): Result<T, U> {
        try {
          if (this.isOk()) return ok(this.ok as T);
          return err(fn(this.error as E));
        } catch (e) {
          throw toError(e);
        }
      },
    });
  };
}

function withMatch<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    match<U>(
      this: R,
      matchers: { okFn: (value: T) => U; errFn: ((error: E) => U) | (() => U) }
    ): U {
      try {
        return this.isError()
          ? matchers.errFn(this.error as E)
          : matchers.okFn(this.ok as T);
      } catch (e) {
        throw toError(e);
      }
    },
  });
}

function withOrElse<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    orElse<U>(this: R, errFn: (error: E) => U): T | U {
      try {
        if (this.isOk()) return this.ok as T;
        return errFn(this.error as E);
      } catch (e) {
        throw toError(e);
      }
    },
  });
}

function withUnwrap<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    unwrap(this: R): T | never {
      if (this.isOk()) return this.ok as T;
      throw this.error as E;
    },
  });
}

function withUnwrapOr<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    unwrapOr(this: R, fallback: T): T {
      return this.isOk() ? (this.ok as T) : fallback;
    },
  });
}

function withUnwrapOrElse<T, E extends Error, R extends Result<T, E>>(
  base: R
): R {
  return Object.assign(base, {
    unwrapOrElse(this: R, fn: (error: E) => T): T {
      try {
        if (this.isOk()) return this.ok as T;
        return fn(this.error as E);
      } catch (e) {
        throw toError(e);
      }
    },
  });
}

export function createResultMethods({
  err,
  ok,
}: ResultFactory): readonly MethodInstaller[] {
  return [
    createWithAndThen({ err }),
    withExpect,
    withIsError,
    withIsOk,
    createWithMap({ err, ok }),
    createWithMapErr({ err, ok }),
    withMatch,
    withOrElse,
    withUnwrap,
    withUnwrapOr,
    withUnwrapOrElse,
  ] as const;
}
