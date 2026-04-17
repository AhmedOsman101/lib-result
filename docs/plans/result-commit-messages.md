# Suggested Commit Messages

These are suggested conventional commit messages for the current `Result` API work.
They are grouped by method so you can partially stage them however you want.

## 1. `and`

Commit message:
`feat!: add Result.and`

Includes:
- `src/result-methods.ts`
  - `createWithAnd({ err })`
  - `createResultMethods(...)` entry for `createWithAnd({ err })`
- `src/types.ts`
  - `and<U>(result: Result<U, E>): Result<U, E>;`
  - JSDoc for `and`

## 2. `expectErr`

Commit message:
`feat!: add Result.expectErr`

Includes:
- `src/result-methods.ts`
  - `withExpectErr(...)`
  - `createResultMethods(...)` entry for `withExpectErr`
- `src/types.ts`
  - `expectErr(message: string): E;`
  - JSDoc for `expectErr`

## 3. `inspect` and `inspectErr`

Commit message:
`feat!: add Result.inspect and Result.inspectErr`

Includes:
- `src/result-methods.ts`
  - `withInspect(...)`
  - `withInspectErr(...)`
  - `createResultMethods(...)` entries for `withInspect` and `withInspectErr`
- `src/types.ts`
  - `inspect(fn: (value: T) => void): Result<T, E>;`
  - `inspectErr(fn: (error: E) => void): Result<T, E>;`
  - JSDoc for both methods

## 4. `mapOr` and `mapOrElse`

Commit message:
`feat!: add Result.mapOr and Result.mapOrElse`

Includes:
- `src/result-methods.ts`
  - `withMapOr(...)`
  - `withMapOrElse(...)`
  - `createResultMethods(...)` entries for `withMapOr` and `withMapOrElse`
- `src/types.ts`
  - `mapOr<U>(defaultValue: U, fn: (value: T) => U): U;`
  - `mapOrElse<U>(defaultFn: (error: E) => U, fn: (value: T) => U): U;`
  - JSDoc for both methods

## 5. `or` and Rust-style `orElse`

Commit message:
`feat!: add Result.or and Result.orElse`

Includes:
- `src/result-methods.ts`
  - `type ResultOkFactory = Pick<ResultFactory, "ok">;`
  - `createWithOr({ ok })`
  - `createWithOrElse({ ok })`
  - `createResultMethods(...)` entries for `createWithOr({ ok })` and `createWithOrElse({ ok })`
- `src/types.ts`
  - `or<F extends Error>(result: Result<T, F>): Result<T, F>;`
  - `orElse<F extends Error>(fn: (error: E) => Result<T, F>): Result<T, F>;`
  - JSDoc for both methods

## 6. `unwrapErr`

Commit message:
`feat!: add Result.unwrapErr`

Includes:
- `src/result-methods.ts`
  - `withUnwrapErr(...)`
  - `createResultMethods(...)` entry for `withUnwrapErr`
- `src/types.ts`
  - `unwrapErr(): E;`
  - JSDoc for `unwrapErr`

## 7. Supporting internal typing updates

Commit message:
`refactor!: align internal result method typings`

Includes:
- `src/result-methods.ts`
  - `Result` import renamed to `ResultType`
  - `MethodInstaller` updated to use `ResultType`
  - generic signatures updated from `Result<...>` to `ResultType<...>`

This is best committed together with the earliest method commit that needs it.
If you want fewer commits, merge this into commit 1.

## Lower-commit alternative

If one-commit-per-method feels too annoying, this is a cleaner reduced set:

1. `feat!: add Result.and, Result.or, and Result.orElse`
2. `feat!: add Result.expectErr and Result.unwrapErr`
3. `feat!: add Result.inspect and Result.inspectErr`
4. `feat!: add Result.mapOr and Result.mapOrElse`
5. `docs: add JSDoc for new Result methods`
6. `refactor!: align internal result method typings`

## Breaking change note

All method-addition commits above are marked with `!` only because you explicitly asked to use breaking-change labels for breaking API work. If you want stricter conventional-commit semantics, only use `!` on commits that actually remove or rename public API.

## Proper breaking-change commit

The real breaking changes in this API work are:

- `pipe(...)` was removed and replaced by `andThen(...)`
- `orElse(...)` no longer returns a plain fallback value
- the old lazy plain-value fallback behavior moved to `unwrapOrElse(...)`

Suggested commit message:

```text
feat(result)!: align method names with Rust Result semantics

Rename `pipe(...)` to `andThen(...)` so chaining methods that return `Result`
uses Rust-style naming.

Change `orElse(...)` to the Rust-style recovery combinator that returns a
`Result`, and move the old plain-value lazy fallback behavior to
`unwrapOrElse(...)`.

BREAKING CHANGE: `pipe(...)` has been removed in favor of `andThen(...)`.
BREAKING CHANGE: `orElse(...)` no longer returns a plain fallback value and
now expects a callback that returns `Result<T, F>`.
BREAKING CHANGE: code using the old lazy fallback behavior must switch from
`orElse(...)` to `unwrapOrElse(...)`.
```
