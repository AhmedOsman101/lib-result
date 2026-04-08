# `lib-result` vs `ts-results` (vultix)

This note compares `lib-result` against `ts-results` from the `vultix-ts-results` checkout by reading:

- `src/index.ts`, `src/main.ts`, `src/mixens.ts`, `src/types.ts`
- `../lib-result-rivals/vultix-ts-results/src/result.ts`
- `../lib-result-rivals/vultix-ts-results/src/option.ts`
- `../lib-result-rivals/vultix-ts-results/src/index.ts`
- `../lib-result-rivals/vultix-ts-results/README.md`

`ts-results` version inspected: `3.3.0`

## What `ts-results` has that `lib-result` lacks

### Built-in `Option`

This is the biggest feature gap.

`ts-results` ships both:

- `Result`
- `Option`

with conversion between them via `toOption()` and `toResult(...)`.

If the long-term goal is the most complete Rust-inspired utility library, `lib-result` currently has no `Option` story.

### Result aggregation helpers

`ts-results` includes:

- `Result.all(...)`
- `Result.any(...)`

Those cover two useful cases:

- collect all success values or fail fast
- return the first success or collect all errors

`lib-result` currently has no aggregation helpers.

### `mapErr`

Like the other rivals, `ts-results` exposes `mapErr`, which remains one of the clearest practical gaps in `lib-result`.

### More Rust-flavored utilities

`ts-results` also includes or documents support for:

- `expectErr`
- `safeUnwrap` on `Ok`
- `unwrapErr`
- `Result.wrap`
- `Result.wrapAsync`
- `Result.isResult`

Not all of these are equally valuable, but together they make the library feel more complete to Rust-minded users.

### RxJS integration

This repo includes a separate `rxjs-operators` package for working with streams of `Result`s. `lib-result` has no framework-specific integrations today.

That is only relevant if you want the library to be more ecosystem-oriented.

## What `lib-result` has that `ts-results` lacks

### Better error object quality

`ts-results` accepts arbitrary error values and stores them directly. `lib-result` insists on `Error` objects in the main path and normalizes foreign values when needed.

That gives `lib-result` an advantage in:

- stack trace quality
- compatibility with `cause`
- consistency of downstream error handling

### Custom error constructors for JavaScript reality

`lib-result` has a stronger story for converting messy runtime inputs into structured errors:

- `ErrFromUnknown`
- `ErrFromText`
- `ErrFromObject`

This is more practical than `ts-results` for modern application code where catch values are often untyped or inconsistent.

### Cleaner naming around wrapped execution

`ts-results` exposes `Result.wrap` and `Result.wrapAsync` as namespace helpers. `lib-result` makes wrapping a top-level export and additionally offers:

- `wrapThrowable`
- `wrapAsyncThrowable`

That is a more complete and discoverable wrapper story.

### More modern error semantics in `expect`

`lib-result.expect(...)` preserves the original failure as `cause`. `ts-results.expect(...)` throws a formatted error string and stack, but it is less aligned with the modern JS `Error` model.

### Simpler result shape for property access

`lib-result` uses `ok` and `error` fields consistently. `ts-results` multiplexes the payload through `val` and distinguishes branch state through boolean fields `ok` and `err`.

`lib-result`'s shape is clearer to many JS users because value and error have separate names.

## Where `ts-results` is weaker than both `lib-result` and the other rivals

### Older style API surface

This library still carries some older patterns:

- deprecated `else(...)`
- `ok` / `err` boolean flags instead of method-based narrowing alone
- callable constructor tricks tied to older compilation targets

It is useful and fairly complete, but it feels less modern than both `lib-result` and `neverthrow`.

### Less disciplined error semantics

It leans harder into "any error value is acceptable" without much built-in normalization.

## Recommendations

The best ideas to borrow from `ts-results` are:

1. Add `mapErr`.
2. Add aggregation helpers like `Result.all` and `Result.any`.
3. Decide whether `Option` is in scope for this library's identity.
4. Consider a small `isResult` helper if runtime detection matters.

What should probably not be copied directly:

1. The deprecated `else(...)` style.
2. The `val` payload shape.
3. Stack-string formatting in place of proper `Error` cause chaining.

## Bottom line

`ts-results` is most interesting as a "broader Rust utility kit" because it includes `Option`, aggregation helpers, and ecosystem add-ons.

`lib-result` is better on modern JavaScript error behavior and clearer result payload naming.

If you want to absorb the best parts, the top candidates are `mapErr`, aggregation helpers, and a deliberate decision on whether `Option` belongs in `lib-result` at all.
