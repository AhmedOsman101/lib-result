# `lib-result` vs `ts-result`

This note compares `lib-result` against `ts-result` by reading the current code in:

- `src/index.ts`, `src/main.ts`, `src/mixens.ts`, `src/types.ts`
- `../lib-result-rivals/ts-result/src/result.ts`
- `../lib-result-rivals/ts-result/README.md`

`ts-result` version inspected: `1.0.1`

## What `ts-result` has that `lib-result` lacks

### A more Rust-complete sync API

`ts-result` includes several classic Result helpers that `lib-result` does not currently expose:

- `mapErr`
- `unwrapErr`
- `unwrapOrElse`
- `and`
- `or`
- `andThen`
- `mapOr`
- `mapOrElse`

`lib-result` covers the basics well, but it is missing several common operations users expect if they come from Rust or from other TS Result libraries.

### Separate `unwrapErr`

`ts-result` allows explicit extraction of the error branch with `unwrapErr()`. `lib-result` currently exposes the error value by property access after narrowing, but does not provide a symmetric method for unwrapping the error path.

This is not essential, but some users expect API symmetry.

### Fallback computation without leaving the success type

`ts-result` has `unwrapOrElse((error) => fallback)` while `lib-result` currently has:

- `unwrapOr(fallback)`
- `orElse((error) => fallback)`

So the capability exists, but `ts-result`'s naming is more standard and easier for Rust users to predict.

### Rust-style boolean combinators

`ts-result` implements `and` and `or`, which can be useful for concise control flow and API completeness. `lib-result` has no direct equivalent.

### Value-level mapping helpers

`ts-result` includes:

- `mapOr`
- `mapOrElse`

Those are convenient for collapsing a `Result` to a plain value without using `match`.

## What `lib-result` has that `ts-result` lacks

### Better JavaScript error discipline

`ts-result` allows arbitrary error values. `lib-result` requires `Error`-based failures in its core `Result<T, E extends Error>` model and validates `Err()` inputs at runtime.

That gives `lib-result` more predictable stack/cause behavior and fewer weak error values.

### Better unknown-error conversion helpers

`lib-result` provides:

- `ErrFromUnknown`
- `ErrFromText`
- `ErrFromObject`

These are practical helpers for real JavaScript and TypeScript codebases where errors often come from `catch (error: unknown)` or from ad hoc metadata.

`ts-result` does not appear to provide comparable built-in normalization constructors.

### Throwable wrapper helpers

`lib-result` has first-class wrappers for sync and async exception capture:

- `wrap`
- `wrapAsync`
- `wrapThrowable`
- `wrapAsyncThrowable`

`ts-result` focuses more on the core `Result` object and less on these JS-specific ergonomics.

### `expect()` with `cause`

`lib-result.expect(message)` throws a new error that keeps the original failure as `cause`. That is more useful than plain string replacement because it preserves debugging context.

### Smaller and more opinionated API

Compared with `ts-result`, `lib-result` feels more intentionally curated around a smaller set of operations and around JavaScript-native error objects.

## Main design tradeoffs

### API completeness vs opinionated ergonomics

`ts-result` is closer to a conventional Rust-style method surface.

`lib-result` is more focused on practical JS error conversion and smaller API size.

### Arbitrary error types vs `Error`-first model

`ts-result` is more flexible.

`lib-result` is safer at runtime when the project standard is "errors should actually be `Error` objects".

### Symmetry vs pragmatism

`ts-result` has more symmetric helpers like `unwrap` and `unwrapErr`.

`lib-result` tends to rely on narrowing plus property access for the error path.

## Recommendations

The highest-value ideas to borrow from `ts-result` are:

1. Add `mapErr`.
2. Add `unwrapOrElse` as a standard alias or replacement for the current value-returning `orElse` semantics.
3. Add `unwrapErr` if you want stronger API symmetry.
4. Consider `mapOr` and `mapOrElse` only if you want closer Rust parity.

What `lib-result` should keep:

1. The `Error`-first constraint.
2. The normalization helpers for unknown, text, and object errors.
3. The wrapper helpers that match how JS and TS code actually fail.

## Bottom line

`ts-result` is stronger on classic Result method completeness.

`lib-result` is stronger on JavaScript-oriented error normalization and wrapping ergonomics.

If you want the best synthesis, add `mapErr` and `unwrapOrElse` first. Those would close much of the usability gap without changing the library's core philosophy.
