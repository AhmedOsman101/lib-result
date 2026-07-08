---
name: lib-result
description: Use when writing Result-driven error handling in TypeScript — converting try/catch to typed Results, chaining fallible operations, recovering from errors without throwing, or wrapping throwing functions. Activates when the user mentions lib-result, Result/Ok/Err types, error handling patterns, or any TypeScript code that throws and would benefit from type-safe error handling, even if they don't name the library.
license: MIT
compatibility: TypeScript project with lib-result installed. Node.js or browser.
metadata:
  version: "5.0.0"
  source: https://github.com/AhmedOsman101/lib-result
---

# lib-result Skill Guide

A Rust-inspired `Result<T, E>` type for type-safe error handling.

**When to use each method:** See the [API Quick Reference](#api-quick-reference) below. For full signatures and examples of any method, read `references/methods.md`.

## Core Concepts

### `Result<T, E extends Error>` = `OkState<T, E> | ErrorState<E, T>`

```
OkState:   { ok: T,          error: undefined }
ErrorState:{ ok: undefined,  error: E          }
```

`E` is **always** a real `Error` instance — enforced at runtime by `Err()`.

### Imports

```ts
import { Ok, Err, ErrFromText, ErrFromUnknown, ErrFromObject } from "lib-result";
import { wrap, wrapAsync, wrapThrowable, wrapAsyncThrowable } from "lib-result";
import type { Result, CustomError } from "lib-result";
```

Use `import type` for types.

---

## Which Constructor to Use

| Situation | Constructor |
|-----------|-------------|
| Operation succeeded | `Ok(value)` |
| Operation failed with an Error instance | `Err(new Error(...))` |
| Quick string error, no custom class needed | `ErrFromText("message")` |
| In a `catch (e)` block (value is `unknown`) | `ErrFromUnknown(e)` |
| Error needs typed extra properties (status codes, metadata) | `ErrFromObject({ message, code: 500 })` |

**Key constraint:** `Err()` throws `TypeError` if given a non-Error. Use `ErrFromText()` or `ErrFromUnknown()` for strings and unknown values.

---

## Which Wrap Function to Use

| Situation | Function |
|-----------|----------|
| Wrap a sync function call | `wrap(() => fn())` |
| Wrap an async function call | `wrapAsync(() => fn())` |
| Convert a sync throwing function to Result-returning | `wrapThrowable(fn)` |
| Convert an async throwing function to Result-returning | `wrapAsyncThrowable(fn)` |

`wrap()`/`wrapAsync()` are for **one-off calls**. `wrapThrowable()`/`wrapAsyncThrowable()` create reusable safe functions.

---

## Common Patterns

### Pattern 1: Declaring a Result-returning function

```ts
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

function validateEmail(email: string): Result<string, ValidationError> {
  if (!email.includes("@")) {
    return Err(new ValidationError("Invalid email", "email"));
  }
  return Ok(email);
}
```

### Pattern 2: Chaining fallible ops with `andThen`

```ts
function processUser(id: number): Result<User, AppError> {
  return fetchUser(id)
    .andThen(user => validateUser(user))
    .andThen(user => saveUser(user));
  // short-circuits on first Err
}
```

### Pattern 3: Converting throwing code with `wrap`

```ts
// Before: throws on bad input or I/O error
function readConfig(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf-8"));
}

// After: returns Result
function readConfig(path: string): Result<Config, CustomError> {
  return wrap(() => JSON.parse(fs.readFileSync(path, "utf-8")));
}
```

### Pattern 4: Error recovery with `orElse`

```ts
class NetworkError extends Error {}
class CacheError extends Error {}

fetchData(url)                          // Result<Data, NetworkError>
  .orElse(() => readCache(key));        // Result<Data, NetworkError | CacheError>
```

### Pattern 5: Exhaustive handling with `match`

```ts
const content = readFile("/path").match({
  okFn: data => data,
  errFn: () => "default content",
});
```

### Pattern 6: Creating an async API client

```ts
class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

const safeGet = wrapAsyncThrowable(async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new ApiError("Request failed", res.status);
  return res.json() as Promise<unknown>;
});
```

### Pattern 7: Error with cause chain

```ts
parseJson(raw)
  .andThen(data => validateData(data))
  .mapErr(e => ErrFromObject({
    message: "Validation failed",
    cause: e,
    inputType: "json",
  }));
```

---

## Adding error properties with `ErrFromObject`

`ErrFromObject` creates typed errors with extra properties. The `P` type parameter describes the additional fields:

```ts
const result = ErrFromObject<{ field: string; code: number }>({
  message: "Validation failed",
  field: "email",
  code: 400,
});

if (result.isError()) {
  console.log(result.error.field);  // "email"
  console.log(result.error.code);   // 400
}
```

The error is still an `Error` instance — properties are merged via `Object.assign`.

---

## Gotchas

### GOTCHA 1: `Err()` requires an Error instance

```ts
Err("string");          // TypeError — USE THIS INSTEAD:
ErrFromText("string");  // ✓
ErrFromUnknown(e);      // ✓ (catch blocks)
```

### GOTCHA 2: Always use `ErrFromUnknown` in catch blocks

```ts
catch (e) {
  return ErrFromUnknown(e); // handles Error, string, object, any type
  // NOT Err(e) — throws TypeError if e is not an Error
}
```

### GOTCHA 3: Callback throws propagate — not caught as Err

```ts
Ok(5).map(() => { throw new Error("boom"); }); // throws, does NOT return Err
// To handle, wrap in Result:
Ok(5).andThen(() => ErrFromText("boom"));
```

This applies to `map`, `andThen`, `mapErr`, `orElse`, `unwrapOrElse`, `inspect`, `inspectErr`, `match`.

### GOTCHA 4: `mapOr` default is eager

```ts
mapOr(computeExpensiveDefault(), ...) // ALWAYS called
// Use mapOrElse for lazy:
mapOrElse(() => computeExpensiveDefault(), ...)
```

### GOTCHA 5: `and()` ignores the value vs `andThen()` uses it

```ts
Ok(42).and(Ok("done"));            // Ok("done") — ignores 42
Ok(42).andThen(x => Ok(x * 2));    // Ok(84) — uses 42
```

### GOTCHA 6: `or()` is eager, `orElse()` is lazy

```ts
Err("fail").or(Ok(42));               // Ok(42) — result already created
Err("fail").orElse(e => Ok(42));      // Ok(42) — fn called only if Err
```

### GOTCHA 7: `orElse()` stays in Result, `unwrapOrElse()` collapses to value

```ts
result.orElse(e => Ok(0));           // Result<number, Error> ← still a Result
result.unwrapOrElse(e => e.message.length); // number ← plain value
```

### GOTCHA 8: Naming diff from Rust

| Concept | Rust | lib-result |
|---------|------|------------|
| Is success? | `is_ok()` | `isOk()` |
| Is error? | `is_err()` | `isError()` |
| Chain | `and_then()` | `andThen()` |
| Recover | `or_else()` | `orElse()` |

### GOTCHA 9: `match()` errFn accepts 0 or 1 args

```ts
result.match({ okFn: v => v, errFn: e => `Error: ${e.message}` });  // with error
result.match({ okFn: v => v, errFn: () => "default" });             // ignore error
```

Implementation uses `fn.length` at runtime.

### GOTCHA 10: `unwrap()` throws the original error, `expect()` wraps it

```ts
result.unwrap();           // throws E directly
result.expect("context");  // throws CustomError with msg + { cause: E }
```

### GOTCHA 11: Results are frozen (shallow)

```ts
const r = Ok(42);
r.ok = 43; // fails silently in strict mode
```

---

## Architecture Notes

- **Composition over inheritance**: Methods are mixed in via `Object.assign` on frozen plain objects. No classes or prototypes.
- **`E extends Error` enforced**: `Err()` validates at runtime that the argument is an Error instance.
- **Rust API alignment**: Method names follow Rust conventions (`andThen`, `orElse`, `mapErr`, `inspect`, `expect`).
- **Callback wrapping**: All methods accepting callbacks wrap them in try/catch. Thrown errors are re-thrown as Error instances via `toError()` — they are NOT returned as `Err`.
- **Dual ESM/CJS**: Ships both module formats with type declarations.

---

## API Quick Reference

For full examples, see `references/methods.md`.

| Category | Method | Input | Output | Short-circuit? |
|----------|--------|-------|--------|----------------|
| State | `isOk()` | — | `boolean` | — |
| State | `isError()` | — | `boolean` | — |
| Extract | `unwrap()` | — | `T / throw E` | — |
| Extract | `expect(msg)` | `string` | `T / throw` | — |
| Extract | `unwrapErr()` | — | `E / throw` | — |
| Extract | `expectErr(msg)` | `string` | `E / throw` | — |
| Safe | `unwrapOr(fb)` | `T` | `T` | — |
| Safe | `unwrapOrElse(fn)` | `E => T` | `T` | — |
| Transform | `map(fn)` | `T => U` | `Result<U, E>` | Yes |
| Transform | `mapErr(fn)` | `E => U` | `Result<T, U>` | Yes |
| Transform | `andThen(fn)` | `T => Result<U, E>` | `Result<U, E>` | Yes |
| Transform | `mapOr(def, fn)` | `U, T => U` | `U` | — |
| Transform | `mapOrElse(def, fn)` | `E => U, T => U` | `U` | — |
| Combinator | `and(result)` | `Result<U, E>` | `Result<U, E>` | Yes |
| Combinator | `or(result)` | `Result<T, F>` | `Result<T, F>` | Yes |
| Combinator | `orElse(fn)` | `E => Result<T, F>` | `Result<T, F>` | Yes |
| Pattern | `match({ okFn, errFn })` | `T => U, E => U` | `U` | — |
| Side-effect | `inspect(fn)` | `T => void` | `Result<T, E>` | Yes |
| Side-effect | `inspectErr(fn)` | `E => void` | `Result<T, E>` | Yes |
| Wrap | `wrap(fn)` | `() => T` | `Result<T, CustomError>` | — |
| Wrap | `wrapAsync(fn)` | `() => Promise<T>` | `Promise<Result<T, CustomError>>` | — |
| Wrap | `wrapThrowable(fn)` | `Fn` | `Fn => Result` | — |
| Wrap | `wrapAsyncThrowable(fn)` | `AsyncFn` | `AsyncFn => Promise<Result>` | — |
