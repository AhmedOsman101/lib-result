# `lib-result` Through a Rust `Result` Lens

This note does not redo the rival-library comparison work.

It builds on:

- `docs/Comparison-neverthrow.md`
- `docs/Comparison-ts-result.md`
- `docs/Comparison-vultix-ts-results.md`
- `docs/plans/result-roadmap.md`

The goal here is narrower: identify what developers coming from Rust will most strongly expect from a `Result` API, then decide what `lib-result` should adopt without weakening its `Error`-first identity or expanding into a large, overlapping surface area.

## What Rust users usually expect

For Rust users, `Result<T, E>` ergonomics are not just about having `Ok` and `Err`.

The strongest expectations are usually:

1. Familiar branch transforms: `map`, `map_err`, `and_then`, `or_else`.
2. Familiar extraction helpers: `unwrap`, `expect`, `unwrap_or`, `unwrap_or_else`.
3. Side-effect inspection without changing the value: `inspect`, `inspect_err`.
4. Straightforward aggregation of many results into one result.
5. Short-circuit semantics that stay consistent across helpers.
6. Clear distinction between:
   - helpers that return plain values, and
   - helpers that return another `Result`.

The naming distinction matters a lot. In Rust, `unwrap_or_else` returns a plain value, while `or_else` stays in the `Result` world.

That expectation is more important than broad method count.

## Where `lib-result` already aligns well

`lib-result` already matches Rust expectations in several important ways:

1. `Ok(...)` and `Err(...)` constructors are explicit and recognizable.
2. `map(...)` behaves like Rust users expect on the success channel.
3. `unwrap()` and `expect(message)` are present, and `expect()` is especially strong because it preserves the original error as `cause`.
4. Short-circuit behavior is already the core model.
5. `mapErr(...)` now exists and, after the v4.0.0 fix, follows the better semantic rule: callback exceptions propagate instead of being wrapped into fake-typed `Err(...)` values.

That last point is important. Rust closures do not silently turn panics into `Err`, and rival TS libraries also generally let thrown callback errors escape. Keeping that rule is the right direction.

## Where `lib-result` currently diverges from Rust mental models

### `pipe` is Rust-like in behavior, but not in naming

`pipe((value) => Result<...>)` is effectively the role Rust users expect from `and_then`.

That means the capability is present, but discoverability is weaker for Rust-minded users.

This is a documentation gap more than an urgent API gap.

### `orElse` is the biggest naming mismatch

Today, `orElse((error) => fallback)` returns a plain value.

That matches Rust `unwrap_or_else`, not Rust `or_else`.

This is the most meaningful mismatch in the current API because it affects user prediction:

1. Rust users will look for `unwrapOrElse` and not find it.
2. Rust users may assume `orElse` returns another `Result`, but it does not.
3. Adding a true Result-returning recovery combinator later will require careful naming to avoid confusion.

### There is no built-in inspection helper

Rust users commonly expect `inspect` and `inspect_err` for logging and debugging without changing the carried value.

`lib-result` has no direct equivalent today.

### There is no aggregation helper

Rust often gets this through iterator `collect`, while TypeScript libraries usually expose a helper like `Result.all(...)` or `combine(...)`.

For TypeScript, a built-in aggregation helper is more important than strict Rust naming parity because the language does not have Rust's iterator/result collection ergonomics.

## Constraints this repo should keep

The following should remain non-negotiable unless the product direction changes substantially:

1. Keep `E extends Error`.
2. Keep `ErrFromUnknown`, `ErrFromText`, and `ErrFromObject` as the JavaScript-facing normalization story.
3. Keep `wrap`, `wrapAsync`, `wrapThrowable`, and `wrapAsyncThrowable` as first-class APIs.
4. Keep thrown callback errors propagating from methods like `map`, `pipe`, `match`, and `mapErr`.
5. Keep the smaller, curated surface area instead of chasing full parity with `neverthrow`.

These are not deviations from quality. They are part of `lib-result`'s identity.

## Prioritized recommendations

## Must-Have

### 1. Add `unwrapOrElse`

This is the smallest, highest-signal addition for Rust-oriented ergonomics.

Why it matters:

1. Rust users expect it immediately.
2. The behavior already exists conceptually in current `orElse`.
3. It reduces the biggest naming surprise without changing core semantics.
4. It is a very small feature with high discoverability value.

Recommendation:

- add `unwrapOrElse(fn: (error: E) => T): T`
- keep callback-throw behavior consistent with v4.0.0 direction: exceptions propagate

### 2. Add a Result-returning recovery combinator

Rust users expect a way to recover on the error branch while staying inside `Result`.

Why it matters:

1. This is one of the most important missing control-flow primitives after `mapErr`.
2. It closes a real capability gap, not just a naming gap.
3. It makes the distinction between value fallback and Result recovery explicit.

Recommendation:

- do not overload current `orElse`
- add a new name such as `recoverWith` or `orElseResult`

Preferred direction:

- `recoverWith` is clearer for this repo than reusing `orElse`
- it avoids conflict with the existing `orElse` behavior
- it fits the repo's preference for explicit names over copied FP jargon

### 3. Add a fail-fast aggregation helper

Rust users expect ergonomic collection of multiple results, even if TypeScript needs a library helper rather than iterator magic.

Why it matters:

1. It is genuinely useful in TypeScript code.
2. Both rival analysis and Rust expectations point to it.
3. It improves composition without adding many overlapping instance methods.

Recommendation:

- start with one helper only
- prefer `Result.all(...)` over `combine(...)`

Why `all`:

1. It is easier to scan in TS code.
2. It matches existing JS naming instincts.
3. It is close enough to Rust's collect-style mental model without pretending to be identical.

## Nice-To-Have

### 4. Add side-effect inspection helpers

Rust users know these as `inspect` and `inspect_err`.

For this repo, the naming choice matters:

1. `inspect` / `inspectErr` is the closest Rust mapping.
2. `tap` / `tapError` is more idiomatic to many JS users.

Recommendation:

- if these are added, prefer one pair only
- choose based on product identity:
  - if Rust familiarity is the goal, use `inspect` / `inspectErr`
  - if broader JS clarity is the goal, use `tap` / `tapError`

My recommendation is to prefer `tap` / `tapError` only if the repo wants JS-first naming consistently. Otherwise, `inspect` / `inspectErr` gives stronger Rust recognition.

### 5. Add documentation that maps current names to Rust names

This is high-value even without code changes.

Recommended mapping table:

- `map` -> `map`
- `mapErr` -> `map_err`
- `pipe` -> `and_then`
- `unwrapOr` -> `unwrap_or`
- `unwrapOrElse` -> `unwrap_or_else` once added
- current `orElse` -> value fallback helper, not Rust `or_else`
- `recoverWith` -> closest to Rust `or_else` if added

This would reduce onboarding friction immediately.

### 6. Consider `unwrapErr`, but only later

Rust users recognize it, but it is mostly symmetry.

Why it is not urgent:

1. Narrowing plus `.error` already works.
2. It does not unlock much new composition power.
3. It adds surface area faster than it adds real capability.

## Avoid / Not Worth Copying Right Now

### 1. Do not weaken `E extends Error`

This would erase one of the clearest differences between `lib-result` and its rivals.

Rust users may accept rich error types, but in JavaScript and TypeScript the runtime quality of real `Error` objects is more valuable than unrestricted error payloads.

### 2. Do not add `Option` yet

Rust users know `Option`, but adding it changes the product from a focused Result library into a broader Rust-inspired toolkit.

That is a scope decision, not a small ergonomic improvement.

### 3. Do not rush into `mapOr` and `mapOrElse`

They are legitimate Rust-style helpers, but `match(...)` already covers the same ground clearly.

These are convenience methods, not core gaps.

### 4. Do not copy broad async abstractions yet

Rust familiarity does not require a `ResultAsync` equivalent.

`wrapAsync` and `wrapAsyncThrowable` already give the repo a clean async story. A fluent async result type would be a major surface-area decision.

### 5. Do not cargo-cult boolean combinators like `and` and `or`

They are part of Rust completeness, but they are lower-value than:

1. `unwrapOrElse`
2. Result recovery
3. aggregation
4. inspection helpers

## Naming guidance

The repo should avoid renaming existing APIs unless there is a strong compatibility plan.

The better approach is:

1. add the missing Rust-recognizable names where they solve real confusion
2. document the mapping from current names to Rust concepts
3. avoid adding multiple synonyms for the same behavior

Concretely:

1. Keep `pipe`.
2. Add docs that say it is the equivalent of Rust `and_then`.
3. Add `unwrapOrElse` because the current gap is user-visible and high-friction.
4. Do not redefine current `orElse`.
5. Add a new Result-returning recovery name instead of overloading `orElse`.

## Smallest justified next feature

If work proceeds into code, the best next feature is still `unwrapOrElse`.

Why this should go first:

1. It is tiny.
2. It immediately improves Rust familiarity.
3. It clarifies the meaning of current `orElse` by giving the expected Rust-style value-fallback name its own method.
4. It does not undermine the library's `Error`-first philosophy.
5. It creates a cleaner path for adding `recoverWith` later.

## Bottom line

The highest-value Rust-oriented improvements for `lib-result` are not the broadest ones.

The right sequence is:

1. add `unwrapOrElse`
2. add a Result-returning recovery helper such as `recoverWith`
3. add a single fail-fast aggregation helper such as `Result.all`
4. optionally add inspection helpers and a Rust mapping table in the docs

What should not change is just as important:

1. keep `E extends Error`
2. keep explicit unknown-error normalization helpers
3. keep callback exceptions propagating
4. keep the surface area smaller and more deliberate than rival libraries

That path makes `lib-result` feel more natural to Rust users without turning it into a clone of `neverthrow`, `ts-result`, or `ts-results`.
