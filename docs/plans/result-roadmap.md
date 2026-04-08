# Result API Evolution Plan

## Goal

Adopt the strongest ideas found across `neverthrow`, `ts-result`, and `ts-results` while preserving `lib-result`'s core advantage: an `Error`-first, JavaScript-native Result API with strong error normalization and a smaller conceptual surface.

## Guiding Principles

1. Keep `E extends Error` as the core contract.
2. Prefer practical JavaScript ergonomics over maximal Rust parity.
3. Add high-value primitives before advanced abstractions.
4. Avoid expanding the API with overlapping names or multiple ways to do the same thing.
5. Keep async support explicit unless a fluent async abstraction proves clearly worthwhile.

## Distilled Best Ideas To Implement

### Priority 1 — Core gaps with highest value

#### 1. Add `mapErr`

What it does:

- transforms the error branch while leaving the success value untouched
- lets users convert one error type into another without unwrapping the `Result`

Example shape:

```ts
const result = Err(new ValidationError("bad input"));

const mapped = result.mapErr(
  error => new HttpError(`Request failed: ${error.message}`)
);
// mapped: Result<never, HttpError>
```

Examples from rival libraries:

### `neverthrow`

```ts
const mapped = err("bad input").mapErr(error => `wrapped: ${error}`);
```

### `ts-result`

```ts
const mapped = Err("bad input").mapErr(error => `wrapped: ${error}`);
```

### `ts-results`

```ts
const mapped = Err(new Error("bad input")).mapErr(
  error => new Error(`wrapped: ${error.message}`)
);
```

Why:

- present in all three rival libraries
- the most obvious missing primitive in `lib-result`
- improves symmetry with `map`
- enables error transformation without unwrapping or collapsing the `Result`

Target outcome:

- `Result<T, E>.mapErr<F extends Error>(fn: (error: E) => F): Result<T, F>`

#### 2. Add `unwrapOrElse`

What it does:

- returns the success value when the `Result` is `Ok`
- computes a fallback value from the error when the `Result` is `Err`
- unlike `unwrapOr`, the fallback is lazy and has access to the error

Example shape:

```ts
const value = result.unwrapOrElse(error => {
  return error.message === "not found" ? 0 : -1;
});
```

Examples from rival libraries:

### `ts-result`

```ts
const value = Err("bad input").unwrapOrElse(error => error.length);
```

### Closest current `lib-result` equivalent

```ts
const value = result.orElse(error => {
  return error.message === "not found" ? 0 : -1;
});
```

Why this matters:

- users from Rust-style libraries will search for `unwrapOrElse`
- it makes the intention clearer than overloading `orElse` for plain values

Why:

- standard, recognizable API from Rust-style Result libraries
- semantically clearer than using the current `orElse` for plain fallback values
- improves discoverability for users coming from rival libraries

Target outcome:

- `Result<T, E>.unwrapOrElse(fn: (error: E) => T): T`

Note:

- after adding this, reevaluate whether the current `orElse` name should remain as-is, be deprecated, or be complemented by a Result-returning recovery method

#### 3. Add Result aggregation helpers

What they do:

- combine multiple `Result`s into one
- common fail-fast form: return all success values if every result is `Ok`, otherwise return the first `Err`
- optional all-errors form: collect all errors instead of stopping at the first one

Example shapes:

```ts
const combined = Result.all(Ok(1), Ok(2), Ok(3));
// Ok([1, 2, 3])

const failed = Result.all(Ok(1), Err(new Error("boom")), Ok(3));
// Err(Error("boom"))
```

Examples from rival libraries:

### `neverthrow`

```ts
const combined = Result.combine([ok(1), ok(2), ok(3)]);
```

### `ts-results`

```ts
const combined = Result.all(Ok(1), Ok(2), Ok(3));
const anyOk = Result.any(Err("a"), Ok(2), Err("c"));
```

Why:

- both `neverthrow` and `ts-results` offer strong aggregation helpers
- this unlocks ergonomic composition for arrays and tuples of results
- high practical value without changing core philosophy

Target outcome:

- `Result.all(...)` or `Result.combine(...)` for fail-fast success collection
- optional second helper for collecting all errors, if the API remains clean

Recommended naming direction:

- prefer explicit names like `all` and `allErrors` or `combine` and `combineAllErrors`
- avoid overloading too many variants initially

### Priority 2 — Improve composition without overcomplicating the API

#### 4. Add a Result-returning recovery combinator

What it does:

- if the result is `Ok`, return it unchanged
- if the result is `Err`, run a callback that returns a new `Result`
- this allows true recovery on the error path while staying inside the `Result` type

Example shape:

```ts
const recovered = result.recoverWith(error => {
  if (error.message === "missing cache") {
    return Ok(fallbackValue);
  }

  return Err(error);
});
```

Examples from rival libraries:

### `neverthrow`

```ts
const recovered = err("bad input").orElse(error => ok(error.length));
```

### `ts-result`

```ts
const recovered = Err("bad input").orElse(error => Ok(error.length));
```

Why this matters:

- this is different from `unwrapOr` and `unwrapOrElse`, which collapse to a plain value
- it enables retry, fallback loading, and selective recovery flows

Why:

- `neverthrow` and `ts-result` both support recovery that returns a new `Result`
- current `orElse` in `lib-result` returns a value, not a `Result`
- there is a real gap between `unwrapOr` / `orElse` and `match` versus full error-path composition

Target outcome:

- add a clearly named method for error recovery into another `Result`

Preferred direction:

- use a name that does not conflict with the current `orElse` semantics
- candidates: `recover`, `recoverWith`, or `orElseResult`

#### 5. Add side-effect tap helpers

What they do:

- run side effects for logging, tracing, or metrics
- return the original `Result` unchanged so the main pipeline can continue

Example shape:

```ts
const finalResult = divide(10, 2)
  .tap(value => logger.info(`value=${value}`))
  .tapError(error => logger.error(error.message));
```

Examples from rival libraries:

### `neverthrow`

```ts
const result = ok(1)
  .andTee(value => console.log(value))
  .orTee(error => console.error(error));
```

Why this matters:

- users often want observability without changing the carried value
- names like `tap` and `tapError` are clearer than `andTee` and `orTee`

Why:

- `neverthrow` demonstrates real value in success/error side-effect hooks
- useful for logging, metrics, tracing, and debugging
- can be made clearer than `andTee` / `orTee`

Target outcome:

- `tap(fn)` for the success branch
- `tapError(fn)` for the error branch

Design constraint:

- callbacks should not alter the contained value/error
- decide explicitly whether thrown callback errors are ignored, converted, or propagated

### Priority 3 — Nice-to-have parity features

#### 6. Add `unwrapErr`

What it does:

- returns the contained error if the `Result` is `Err`
- throws if the `Result` is `Ok`
- gives symmetry with `unwrap`

Examples from rival libraries:

### `ts-result`

```ts
const error = Err("bad input").unwrapErr();
```

### `ts-results`

`ts-results` documents `unwrapErr` / `expectErr` style symmetry as part of its Rust-inspired surface.

Why:

- improves API symmetry
- familiar to Rust-oriented users
- lower value than `mapErr`, aggregation, and recovery composition

#### 7. Add `mapOr` / `mapOrElse`

What they do:

- collapse a `Result` into a plain value without returning another `Result`
- `mapOr(defaultValue, mapFn)` uses a fixed fallback
- `mapOrElse(defaultFn, mapFn)` computes the fallback from the error

Example shapes:

```ts
const label = result.mapOr("unknown", value => value.name);

const label2 = result.mapOrElse(
  error => `error:${error.message}`,
  value => value.name
);
```

Examples from rival libraries:

### `ts-result`

```ts
const label = result.mapOr("unknown", value => value.name);
const label2 = result.mapOrElse(
  error => `error:${error}`,
  value => value.name
);
```

Why:

- useful convenience methods
- can reduce some `match` usage

Risk:

- may add API breadth without enough distinct value if `match` is already clear

### Priority 4 — Strategic decision, not immediate implementation

#### 8. Decide whether `Option` belongs in `lib-result`

What it is:

- `Option<T>` models presence or absence without an error payload
- usually represented as `Some(value)` or `None`
- useful when a missing value is expected and should not be treated as an error

Example from `ts-results`:

```ts
const image = getLoggedInUsername().andThen(getImageForUsername);
```

Why it matters:

- it broadens the library from error handling into general Rust-style data modeling
- it can be valuable, but it is a product-scope decision rather than a small API addition

Why:

- `ts-results` gains a lot of breadth from bundling `Option`
- however, adding `Option` changes the library from a focused Result package into a broader functional utility library

Recommendation:

- do not implement immediately
- first decide whether the product vision is:
  - a best-in-class Result library, or
  - a Rust-inspired error-and-option toolkit

#### 9. Evaluate a lightweight async abstraction later

What it would do:

- wrap `Promise<Result<T, E>>` in an object that still exposes Result-like methods
- allow async pipelines like `map`, `mapErr`, `andThen`, and `match` without constantly `await`ing intermediate results

Example from `neverthrow`:

```ts
const result = fromPromise(fetchUser(), toError)
  .map(user => user.name)
  .andThen(name => fromPromise(loadProfile(name), toError));
```

Why it matters:

- it is the biggest capability advantage `neverthrow` has
- but it adds a lot of API surface and implementation complexity

Why:

- `neverthrow`'s biggest structural advantage is fluent async composition
- but `ResultAsync` is a major surface-area expansion

Recommendation:

- do not implement in the first roadmap phase
- revisit only after the sync API becomes more complete and cohesive

## Ideas Explicitly Not Recommended Right Now

1. Allow arbitrary non-`Error` error types in the core `Result<T, E>` model.
2. Copy `neverthrow`'s full sync + async API surface in one release.
3. Add generator-based `safeTry` early.
4. Copy older `ts-results` patterns like deprecated `else(...)` or `val` payload shape.
5. Add framework-specific integrations such as RxJS operators before the core API is settled.

## Proposed Execution Order

### Phase 1 — Fill the obvious API holes

1. Add `mapErr`
2. Add `unwrapOrElse`
3. Add tests and docs for both

### Phase 2 — Add composition primitives

4. Add Result aggregation helpers
5. Add a Result-returning recovery combinator
6. Add tests and examples for multi-step recovery/composition

### Phase 3 — Add observability ergonomics

7. Add `tap` and `tapError`
8. Define and document callback-throw semantics clearly

### Phase 4 — Reassess breadth

9. Decide on `unwrapErr`, `mapOr`, and `mapOrElse`
10. Decide whether `Option` belongs in scope
11. Reevaluate whether an `AsyncResult` abstraction is worth the added complexity

## Acceptance Criteria

- `lib-result` closes the most important capability gaps identified across all three rivals.
- The API remains coherent and smaller than `neverthrow`.
- The library retains its `Error`-first runtime guarantees.
- New methods have clear semantics for thrown callback behavior.
- Docs and tests cover success paths, error paths, and edge cases.

## Recommended First Milestone

Ship a focused release containing:

- `mapErr`
- `unwrapOrElse`
- one aggregation helper

This would deliver the highest leverage improvement with minimal philosophy drift.
