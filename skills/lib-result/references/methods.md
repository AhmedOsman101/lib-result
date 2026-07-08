# API Method Reference

Full signatures and examples for every `Result` instance method.

---

## State Checking

### `isOk(): this is OkState<T, E>`

Type guard. Returns `true` if Ok, narrows type to `OkState` (access `result.ok`).

```ts
if (result.isOk()) {
  console.log(result.ok); // T is accessible
}
```

### `isError(): this is ErrorState<E, T>`

Type guard. Returns `true` if Err, narrows type to `ErrorState` (access `result.error`).

```ts
if (result.isError()) {
  console.error(result.error.message); // E is accessible
}
```

Always prefer these over checking `result.error === undefined` directly — the type guards enable proper narrowing.

---

## Value Extraction (Throwing)

### `unwrap(): T`

Returns the Ok value, or **throws the original error** if Err.

```ts
const result = divide(10, 2);
result.unwrap(); // 5

ErrFromText("fail").unwrap(); // throws Error("fail")
```

### `expect(message: string): T`

Returns the Ok value, or throws a `CustomError` with `message` and the original error as `cause`.

```ts
riskyOp().expect("Failed to perform operation");
// Err → throws CustomError("Failed to perform operation", { cause: originalError })
```

### `unwrapErr(): E`

Returns the error from an Err result. **Throws** if called on Ok.

```ts
Err(new Error("fail")).unwrapErr(); // Error("fail")
Ok(42).unwrapErr(); // throws Error("Received an Ok value '42' instead of an Error")
```

### `expectErr(message: string): E`

Returns the error from an Err result, or throws `CustomError` with the message if Ok.

```ts
Err(new Error("fail")).expectErr("Expected error"); // Error("fail")
Ok(42).expectErr("Expected error"); // throws CustomError("Expected error")
```

---

## Safe Extraction (With Fallbacks)

### `unwrapOr(fallback: T): T`

Returns the Ok value or the fallback (eager — `fallback` is always evaluated).

```ts
Ok(42).unwrapOr(0);          // 42
ErrFromText("fail").unwrapOr(0); // 0
```

### `unwrapOrElse(fn: (error: E) => T): T`

Returns the Ok value or computes a fallback from the error (lazy).

```ts
Ok(42).unwrapOrElse(e => e.message.length);        // 42
ErrFromText("fail").unwrapOrElse(e => e.message.length); // 4
```

If `fn` throws, the error is re-thrown as an Error instance.

---

## Transformation (Result → Result)

### `map<U>(fn: (value: T) => U): Result<U, E>`

Transforms the Ok value with a pure function. Preserves Err.

```ts
Ok(5).map(x => x * 2).map(x => x.toString()); // Ok("10")
Err<number>(new Error("fail")).map(x => x * 2); // Err(Error("fail"))
```

If `fn` throws, the error propagates (not caught as Err).

### `mapErr<U extends Error>(fn: (error: E) => U): Result<T, U>`

Transforms the error value. Preserves Ok.

```ts
Err(new Error("original")).mapErr(e => new AppError(e.message));
// Err(AppError("original"))

Ok(42).mapErr(e => new Error("won't run"));
// Ok(42) — mapErr is skipped
```

If `fn` throws, the error propagates.

### `andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>`

Chains a Result-returning function. Short-circuits on Err.

```ts
divide(10, 2)
  .andThen(x => divide(x, 2))   // Ok(2.5)
  .andThen(x => divide(x, 0));  // Err — short-circuits
```

If `fn` throws, the error propagates.

---

## Combinators

### `and<U>(result: Result<U, E>): Result<U, E>`

If Ok, returns the provided result (ignoring the Ok value). If Err, preserves the current error.

```ts
Ok(42).and(Ok("done"));             // Ok("done") — ignores 42
Err(new Error("fail")).and(Ok("done")); // Err(Error("fail"))
```

Use when the Ok value is irrelevant. Use `andThen` when you need the value.

### `or<F extends Error>(result: Result<T, F>): Result<T, F>`

If Ok, returns current. If Err, returns the provided fallback Result (eager).

```ts
Ok(42).or(Ok(0));                 // Ok(42)
Err(new Error("fail")).or(Ok(0)); // Ok(0)
```

### `orElse<F extends Error>(fn: (error: E) => Result<T, F>): Result<T, F>`

If Ok, returns current. If Err, calls fn to recover with another Result (lazy).

```ts
divide(1, 0).orElse(error => {
  if (error.message.includes("zero")) return Ok(0);
  return Err(error);
}); // Ok(0)
```

---

## Collapse (Result → Plain Value)

### `match<U>(matchers: { okFn, errFn }): U`

Exhaustive pattern matching on both states. Both branches must return the same type `U`.

```ts
result.match({
  okFn: value => `Success: ${value}`,
  errFn: error => `Error: ${error.message}`,
});
```

`errFn` can also ignore the error (0 args) — the implementation checks `fn.length` at runtime:

```ts
result.match({
  okFn: value => value,
  errFn: () => "default",
});
```

### `mapOr<U>(defaultValue: U, fn: (value: T) => U): U`

Transforms Ok to U, or returns an **eager** default. The default is always evaluated.

```ts
Ok(5).mapOr(0, x => x * 2);            // 10
Err<number>(new Error("fail")).mapOr(0, x => x * 2); // 0
```

Use `mapOrElse` for lazy fallback computation.

### `mapOrElse<U>(defaultFn: (error: E) => U, fn: (value: T) => U): U`

Transforms both branches into a plain value (lazy).

```ts
result.mapOrElse(
  error => `Error: ${error.message}`,
  value => `Success: ${value}`,
);
```

---

## Side Effects

### `inspect(fn: (value: T) => void): Result<T, E>`

Calls fn with the Ok value (if Ok). Returns the original Result unchanged.

```ts
Ok(42).inspect(value => console.log(value));
// logs 42, returns the same Result (identity)

Err(new Error("fail")).inspect(console.log);
// not called, returns Err
```

If `fn` throws, the error propagates.

### `inspectErr(fn: (error: E) => void): Result<T, E>`

Calls fn with the Err value (if Err). Returns the original Result unchanged.

```ts
Err(new Error("fail")).inspectErr(e => console.error(e.message));
// logs "fail", returns the same Result

Ok(42).inspectErr(console.error);
// not called, returns Ok
```

If `fn` throws, the error propagates.
