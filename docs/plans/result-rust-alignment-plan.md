# Rust Result Alignment Plan

## Goal

Align `lib-result` more closely with Rust's original `Result` API, even when that requires breaking changes, while preserving the library's core runtime constraint that `E extends Error`.

## Scope

This plan covers only the `Result` API surface and method naming/semantics.

It is intentionally organized into:

1. Needs to be renamed
2. Needs to be created
3. Needs to be removed

Each item includes:

1. Reference signature
2. What arguments it expects
3. What it returns
4. Example usage
5. Explanation

## Needs To Be Renamed

### 1. `pipe` -> `andThen` (Done)

Current shape:

```ts
pipe<U>(fn: (value: T) => Result<U, E>): Result<U, E>
```

Target shape:

```ts
andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>
```

Arguments:

- `fn`: a callback that receives the `Ok` value and must return another `Result`

Returns:

- `Result<U, E>`

Example:

```ts
const result = Ok(10)
  .andThen(value => Ok(value * 2))
  .andThen(value => Ok(value.toString()));
```

Explanation:

This method already behaves like Rust's `and_then`, but the current name `pipe` is JavaScript-flavored rather than Rust-flavored. Renaming it to `andThen` makes the API easier to predict for Rust users and aligns the library with the naming used by most Result libraries in TypeScript.

### 2. Current `orElse` -> `unwrapOrElse` (Done)

Current shape:

```ts
orElse<U>(fn: (error: E) => U): T | U
```

Target shape:

```ts
unwrapOrElse(fn: (error: E) => T): T
```

Arguments:

- `fn`: a callback that receives the `Err` value and returns a fallback success value

Returns:

- `T`

Example:

```ts
const port = Err(new Error("missing env")).unwrapOrElse(error => {
  return error.message.includes("env") ? 3000 : 8080;
});
```

Explanation:

The current implementation is correct for value fallback semantics, but the name is wrong from a Rust perspective. In Rust, `or_else` stays inside `Result`, while `unwrap_or_else` collapses the result into a plain value, so keeping the current name would keep misleading users.

## Needs To Be Created

### 1. `and` (Done)

Signature:

```ts
and<U>(result: Result<U, E>): Result<U, E>
```

Arguments:

- `result`: another `Result` to return if the current result is `Ok`

Returns:

- `Result<U, E>`

Example:

```ts
const result = Ok(1).and(Ok("next"));
// Ok("next")
```

Explanation:

`and` is a small but standard Rust combinator for sequencing results when the left-hand success value is not needed. It improves parity with Rust and makes some control-flow chains more expressive without requiring an extra callback.

### 2. `orElse` (Done)

Signature:

```ts
orElse<F extends Error>(fn: (error: E) => Result<T, F>): Result<T, F>
```

Arguments:

- `fn`: a callback that receives the current error and returns a replacement `Result`

Returns:

- `Result<T, F>`

Example:

```ts
const result = Err(new Error("cache miss")).orElse(error => {
  if (error.message === "cache miss") {
    return Ok("fallback value");
  }

  return Err(error);
});
```

Explanation:

This is the real Rust meaning of `or_else`: recover on the error branch while staying inside `Result`. It is one of the most important missing primitives because it enables fallback loading, retry strategies, and selective recovery without unwrapping.

### 3. `or` (Done)

Signature:

```ts
or<F extends Error>(result: Result<T, F>): Result<T, F>
```

Arguments:

- `result`: another `Result` to return if the current result is `Err`

Returns:

- `Result<T, F>`

Example:

```ts
const result = Err<string>(new Error("primary failed")).or(Ok("backup"));
// Ok("backup")
```

Explanation:

`or` is the non-lazy counterpart to `orElse`. It is useful when the fallback result is already available and improves completeness for users who expect the standard Rust pairing of `and`/`or` and `and_then`/`or_else`.

### 4. `unwrapErr` (Done)

Signature:

```ts
unwrapErr(): E
```

Arguments:

- none

Returns:

- `E`

Example:

```ts
const error = Err(new Error("validation failed")).unwrapErr();
console.log(error.message);
```

Explanation:

This method provides symmetry with `unwrap()`. It is not the highest-value combinator, but it is part of the standard Rust surface and makes the library feel more complete and more predictable to Rust users.

### 5. `expectErr` (Done)

Signature:

```ts
expectErr(message: string): E
```

Arguments:

- `message`: the message to use when the result is unexpectedly `Ok`

Returns:

- `E`

Example:

```ts
const error = Err(new Error("failed")).expectErr("expected operation to fail");
console.log(error.message);
```

Explanation:

This complements `expect(...)` and aligns the error branch API with Rust's expectations. It also gives test code and negative-path assertions a cleaner way to express intent.

### 6. `mapOr` (Done)

Signature:

```ts
mapOr<U>(defaultValue: U, fn: (value: T) => U): U
```

Arguments:

- `defaultValue`: the value to return if the result is `Err`
- `fn`: a callback that maps the `Ok` value into the final output value

Returns:

- `U`

Example:

```ts
const label = Ok({ name: "Ada" }).mapOr("unknown", user => user.name);
// "Ada"
```

Explanation:

`mapOr` is a compact Rust utility for collapsing a `Result` into a plain value with a fixed fallback. It is especially useful in UI formatting, config extraction, and other places where `match` would be correct but verbose.

### 7. `mapOrElse` (Done)

Signature:

```ts
mapOrElse<U>(defaultFn: (error: E) => U, fn: (value: T) => U): U
```

Arguments:

- `defaultFn`: a callback that maps the error into a fallback output value
- `fn`: a callback that maps the success value into the final output value

Returns:

- `U`

Example:

```ts
const label = Err<{ name: string }>(new Error("missing"))
  .mapOrElse(error => `error:${error.message}`, user => user.name);
// "error:missing"
```

Explanation:

This method is the lazy sibling of `mapOr`. It is valuable when fallback behavior depends on the actual error, and it avoids forcing users into a full `match(...)` when they only need a single collapsed output.

### 8. `inspect` (Done)

Signature:

```ts
inspect(fn: (value: T) => void): Result<T, E>
```

Arguments:

- `fn`: a callback invoked only when the result is `Ok`

Returns:

- `Result<T, E>`

Example:

```ts
const result = Ok(5)
  .inspect(value => console.log("before", value))
  .map(value => value * 2);
```

Explanation:

`inspect` is a Rust-native way to perform logging, metrics, or tracing without changing the carried value. It helps keep debugging and observability inside fluent pipelines while preserving clear intent that no transformation is happening.

### 9. `inspectErr` (Done)

Signature:

```ts
inspectErr(fn: (error: E) => void): Result<T, E>
```

Arguments:

- `fn`: a callback invoked only when the result is `Err`

Returns:

- `Result<T, E>`

Example:

```ts
const result = Err(new Error("network"))
  .inspectErr(error => console.error("request failed", error.message));
```

Explanation:

This mirrors `inspect` for the error branch. It is a useful tool for diagnostics and gives the library a direct Rust equivalent for side-effect-only error observation.

### 10. `Result.all`

Signature:

```ts
Result.all<T, E extends Error>(...results: Result<T, E>[]): Result<T[], E>
```

Arguments:

- `...results`: one or more results to aggregate

Returns:

- `Result<T[], E>`

Example:

```ts
const result = Result.all(Ok(1), Ok(2), Ok(3));
// Ok([1, 2, 3])
```

Explanation:

Rust typically gets this style of behavior through iterator collection, but TypeScript benefits from a dedicated helper. `Result.all` is the highest-value aggregation primitive because it supports fail-fast collection without introducing many overlapping static helpers at once.

### 11. `Result.any`

Signature:

```ts
Result.any<T, E extends Error>(...results: Result<T, E>[]): Result<T, E[]>
```

Arguments:

- `...results`: one or more results to search for the first success

Returns:

- `Result<T, E[]>`

Example:

```ts
const result = Result.any(
  Err(new Error("a")),
  Ok(2),
  Err(new Error("c"))
);
// Ok(2)
```

Explanation:

This helper is not from Rust's core `Result`, but it is a pragmatic TypeScript complement once aggregation exists. It is useful when trying multiple strategies in order and only caring that one succeeds, while still returning collected errors if all attempts fail.

## Needs To Be Removed

### 1. Remove `pipe` (Done)

Current signature:

```ts
pipe<U>(fn: (value: T) => Result<U, E>): Result<U, E>
```

Arguments:

- `fn`: callback receiving the `Ok` value and returning another `Result`

Returns:

- `Result<U, E>`

Example of replacement:

```ts
const result = Ok(2).andThen(value => Ok(value * 2));
```

Explanation:

This method should be removed because its behavior overlaps exactly with the Rust-aligned `andThen`. Keeping both names would add duplicate surface area and make the library less coherent just when the goal is stronger semantic alignment.

### 2. Remove current `orElse` (Done)

Current signature:

```ts
orElse<U>(fn: (error: E) => U): T | U
```

Arguments:

- `fn`: callback receiving the error and returning a fallback value

Returns:

- `T | U`

Example of replacement:

```ts
const value = Err(new Error("missing")).unwrapOrElse(error => {
  return error.message === "missing" ? 0 : -1;
});
```

Explanation:

This method should not survive under its current name because it directly conflicts with Rust meaning. The implementation idea is still useful, but the API name is misleading enough that keeping it would undermine the purpose of the breaking-change release.

## Recommended Release Order

### Phase 1: Breaking rename release

1. Rename `pipe` to `andThen`
2. Rename current `orElse` to `unwrapOrElse`
3. Add true Rust `orElse`
4. Add `and` and `or`
5. Update tests, docs, and README examples to use new names

### Phase 2: Rust completeness release

1. Add `unwrapErr`
2. Add `expectErr`
3. Add `mapOr`
4. Add `mapOrElse`
5. Add `inspect` and `inspectErr`

### Phase 3: TypeScript-friendly extras

1. Add `Result.all`
2. Optionally add `Result.any`
3. Reevaluate whether any non-Rust helpers still deserve to remain

## Final Recommendation

If the goal is to push `lib-result` much closer to Rust's original `Result`, the most important naming corrections are:

1. `pipe` -> `andThen`
2. current `orElse` -> `unwrapOrElse`
3. use `orElse` for Result-returning recovery

Those three changes fix the most important semantic mismatches first. After that, the rest of the Rust surface can be added in a way that feels coherent instead of mixed between JavaScript naming and Rust naming.
