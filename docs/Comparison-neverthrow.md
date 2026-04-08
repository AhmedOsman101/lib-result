# `lib-result` vs `neverthrow`

This note compares `lib-result` against `neverthrow` by reading the current code in:

- `src/index.ts`, `src/main.ts`, `src/mixens.ts`, `src/types.ts`
- `../lib-result-rivals/neverthrow/src/index.ts`
- `../lib-result-rivals/neverthrow/src/result.ts`
- `../lib-result-rivals/neverthrow/src/result-async.ts`

`neverthrow` version inspected: `8.2.0`

## What `neverthrow` has that `lib-result` lacks

### Native async Result type

`neverthrow` has a dedicated `ResultAsync<T, E>` with method parity for async flows:

- `map`
- `mapErr`
- `andThen`
- `orElse`
- `match`
- `unwrapOr`
- `andTee`
- `orTee`
- `andThrough`
- `combine`
- `combineWithAllErrors`

`lib-result` currently only offers async capture helpers:

- `wrapAsync`
- `wrapAsyncThrowable`

That is simpler, but it means async composition falls back to `await` plus sync `Result` methods instead of a fluent async pipeline.

### Error-channel transforms

`neverthrow` exposes `mapErr` on both sync and async variants. `lib-result` currently has:

- `map` for the success channel
- `pipe` for chaining success-channel `Result`s
- `orElse` for extracting a fallback value
- `match` for collapse to a single value

What is missing is a direct error-to-error transform that preserves `Result<T, E2>` shape.

### Richer composition helpers

`neverthrow` supports more pipeline-style control-flow operators:

- `andThen`
- `andTee`
- `orTee`
- `andThrough`
- `asyncAndThen`
- `asyncMap`
- `asyncAndThrough`

The main practical gaps for `lib-result` are:

- side-effect taps for success and error paths
- a named error-recovery combinator that returns another `Result`
- first-class async chaining without leaving the fluent API

### Multi-result aggregation

`neverthrow` has:

- `Result.combine(...)`
- `Result.combineWithAllErrors(...)`
- `ResultAsync.combine(...)`
- `ResultAsync.combineWithAllErrors(...)`

`lib-result` has no built-in aggregator for arrays or tuples of results.

### `safeTry` / `yield*` ergonomics

`neverthrow` supports `safeTry(...)` with generator-based early return semantics that emulate Rust's `?` operator. `lib-result` has no equivalent shorthand for early propagation.

### Better non-throwing error typing flexibility

`neverthrow` allows any `E`. `lib-result` intentionally constrains `E extends Error` on `Result<T, E>`, and `Err()` enforces an actual `Error` instance.

This is a tradeoff, not a pure loss, but it does mean `neverthrow` can model string, object, or union error types without conversion.

## What `lib-result` has that `neverthrow` lacks

### Strong `Error` normalization

`lib-result` is more opinionated about errors being real `Error` objects.

That gives you:

- more consistent runtime behavior
- better interoperability with `cause`, stack traces, and standard JS error tooling
- less risk of `Err("oops")`-style weak error values leaking through an application

This is one of the clearest philosophical differences, and it is a real advantage if the goal is production-grade error objects rather than maximum flexibility.

### Purpose-built constructors for common JS failure inputs

`lib-result` includes:

- `ErrFromUnknown`
- `ErrFromText`
- `ErrFromObject`

`neverthrow` has `err(...)`, but it does not provide the same built-in normalization helpers for common JavaScript catch/input shapes.

### More direct wrap helpers for common usage

`lib-result` exports:

- `wrap`
- `wrapAsync`
- `wrapThrowable`
- `wrapAsyncThrowable`

`neverthrow` has equivalent throwable helpers, but `lib-result`'s naming and split are straightforward and easy to discover. In particular, the synchronous and asynchronous capture APIs are very explicit.

### `expect()` preserves the original failure as `cause`

In `lib-result`, `expect(message)` throws a custom error with the original error attached as `cause`. That is a good JavaScript-native behavior and fits modern Node and browser error handling well.

### Smaller conceptual surface

`lib-result` is materially easier to learn than `neverthrow`. `neverthrow` is stronger for advanced composition, but it also asks users to absorb a much larger API.

If your target is developers who want a pragmatic Result without FP-heavy vocabulary, `lib-result` is already in a better place on simplicity.

## Main design tradeoffs

### Simplicity vs power

`neverthrow` is the more complete algebra.

`lib-result` is the simpler API with stronger error normalization.

### Async fluency vs explicit async boundaries

`neverthrow` treats async as a first-class Result abstraction.

`lib-result` keeps async handling explicit and mostly outside the core result object.

### Flexible error values vs disciplined error objects

`neverthrow` maximizes type flexibility.

`lib-result` maximizes runtime error quality.

## Recommendations

If the goal is the most competitive `Result` implementation without losing `lib-result`'s identity, the best features to borrow from `neverthrow` are:

1. Add `mapErr`.
2. Add a `Result`-returning recovery combinator, likely named `orElseResult` or a redefined `orElse` with Result semantics.
3. Add tuple/array aggregation such as `Result.all` and optionally `Result.allErrors`.
4. Add tap-style helpers like `tap` and `tapError` instead of adopting the more opaque `andTee` and `orTee` names directly.
5. Consider a lightweight `AsyncResult` only if you want fluent async composition to become a core selling point.

What should probably not be copied directly:

1. Allowing arbitrary non-`Error` error types.
2. The full surface of sync and async combinators all at once.
3. Generator-based `safeTry` early on, unless you want to lean harder into advanced FP ergonomics.

## Bottom line

`neverthrow` is broader and more composable.

`lib-result` is stricter and cleaner around real-world JavaScript errors.

The highest-value gaps are `mapErr`, Result aggregation, and better error-recovery composition. Those would close much of the practical distance without giving up `lib-result`'s stronger `Error`-first design.
