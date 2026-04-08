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

Why:

- present in all three rival libraries
- the most obvious missing primitive in `lib-result`
- improves symmetry with `map`
- enables error transformation without unwrapping or collapsing the `Result`

Target outcome:

- `Result<T, E>.mapErr<F extends Error>(fn: (error: E) => F): Result<T, F>`

#### 2. Add `unwrapOrElse`

Why:

- standard, recognizable API from Rust-style Result libraries
- semantically clearer than using the current `orElse` for plain fallback values
- improves discoverability for users coming from rival libraries

Target outcome:

- `Result<T, E>.unwrapOrElse(fn: (error: E) => T): T`

Note:

- after adding this, reevaluate whether the current `orElse` name should remain as-is, be deprecated, or be complemented by a Result-returning recovery method

#### 3. Add Result aggregation helpers

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

Why:

- improves API symmetry
- familiar to Rust-oriented users
- lower value than `mapErr`, aggregation, and recovery composition

#### 7. Add `mapOr` / `mapOrElse`

Why:

- useful convenience methods
- can reduce some `match` usage

Risk:

- may add API breadth without enough distinct value if `match` is already clear

### Priority 4 — Strategic decision, not immediate implementation

#### 8. Decide whether `Option` belongs in `lib-result`

Why:

- `ts-results` gains a lot of breadth from bundling `Option`
- however, adding `Option` changes the library from a focused Result package into a broader functional utility library

Recommendation:

- do not implement immediately
- first decide whether the product vision is:
  - a best-in-class Result library, or
  - a Rust-inspired error-and-option toolkit

#### 9. Evaluate a lightweight async abstraction later

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
