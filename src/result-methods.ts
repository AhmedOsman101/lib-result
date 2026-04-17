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

function createWithAnd({ err }: ResultErrorFactory): MethodInstaller {
  return function withAnd<T, E extends Error, R extends Result<T, E>>(
    base: R
  ): R {
    return Object.assign(base, {
      and<U>(this: R, result: Result<U, E>): Result<U, E> {
        if (this.isOk()) return result;
        return err(this.error as E);
      },
    });
  };
}

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

function withExpectErr<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    expectErr(this: R, message: string): E {
      if (this.isError()) return this.error as E;
      throw createCustomError({
        message,
        cause: this.error as E,
      });
    },
  });
}

function withInspect<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    inspect(this: R, fn: (value: T) => void): Result<T, E> {
      if (this.isOk()) fn(this.ok as T);
      return this;
    },
  });
}

function withInspectErr<T, E extends Error, R extends Result<T, E>>(
  base: R
): R {
  return Object.assign(base, {
    inspectErr(this: R, fn: (error: E) => void): Result<T, E> {
      if (this.isError()) fn(this.error as E);
      return this;
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

function withMapOr<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    mapOr<U>(this: R, defaultValue: U, fn: (value: T) => U): U {
      try {
        if (this.isError()) return defaultValue;
        return fn(this.ok as T);
      } catch (e) {
        throw toError(e);
      }
    },
  });
}

function withMapOrElse<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    mapOrElse<U>(this: R, defaultFn: (error: E) => U, fn: (value: T) => U): U {
      try {
        if (this.isError()) return defaultFn(this.error as E);
        return fn(this.ok as T);
      } catch (e) {
        throw toError(e);
      }
    },
  });
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

function createWithOr({ ok }: ResultOkFactory): MethodInstaller {
  return function withOr<T, E extends Error, R extends Result<T, E>>(
    base: R
  ): R {
    return Object.assign(base, {
      or<F extends Error>(this: R, result: Result<T, F>): Result<T, F> {
        if (this.isOk()) return ok(this.ok as T);
        return result;
      },
    });
  };
}

function createWithOrElse({ ok }: ResultOkFactory): MethodInstaller {
  return function withOrElse<T, E extends Error, R extends Result<T, E>>(
    base: R
  ): R {
    return Object.assign(base, {
      orElse<F extends Error>(
        this: R,
        fn: (error: E) => Result<T, F>
      ): Result<T, F> {
        try {
          if (this.isError()) return fn(this.error as E);
          return ok(this.ok as T);
        } catch (e) {
          throw toError(e);
        }
      },
    });
  };
}

function withUnwrap<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    unwrap(this: R): T | never {
      if (this.isOk()) return this.ok as T;
      throw this.error as E;
    },
  });
}

function withUnwrapErr<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    unwrapErr(this: R): E {
      if (this.isError()) return this.error as E;
      throw new Error(`Received an Ok value '${this.ok}' instead of an Error`);
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
    createWithAnd({ err }),
    createWithAndThen({ err }),
    withExpect,
    withExpectErr,
    withInspect,
    withInspectErr,
    withIsError,
    withIsOk,
    createWithMap({ err, ok }),
    withMapOr,
    withMapOrElse,
    createWithMapErr({ err, ok }),
    withMatch,
    createWithOr({ ok }),
    createWithOrElse({ ok }),
    withUnwrap,
    withUnwrapErr,
    withUnwrapOr,
    withUnwrapOrElse,
  ] as const;
}
