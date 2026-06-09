# Full API Audit: lib-result v5.0.0

**Date:** 2026-06-09
**Status:** Draft

---

# 1. API Surface Map

## 1.1 Exported Functions

### Constructors

| Function         | Signature                                                             | Returns                     | Can Throw                                     | Notes                                         |
| ---------------- | --------------------------------------------------------------------- | --------------------------- | --------------------------------------------- | --------------------------------------------- |
| `Ok`             | `<T, E>(ok: T) => OkState<T, E>`                                      | `Result<T, E>`              | No                                            | Creates success result                        |
| `Err`            | `<T, E>(error: E) => ErrorState<E, T>`                                | `Result<T, E>`              | **Yes** — `TypeError` if not `Error` instance | Validates at construct time                   |
| `ErrFromText`    | `<T>(message: string) => ErrorState<Error, T>`                        | `Result<T, Error>`          | No                                            | Wraps string in `new Error(message)`          |
| `ErrFromObject`  | `<P, T>(props: CustomErrorProps<P>) => ErrorState<CustomError<P>, T>` | `Result<T, CustomError<P>>` | No                                            | Creates error with extra properties           |
| `ErrFromUnknown` | `<T>(error: unknown) => ErrorState<CustomError, T>`                   | `Result<T, CustomError>`    | No                                            | Normalizes unknown to Error, for catch blocks |

### Wrappers

| Function             | Signature                                                                                            | Returns                                          | Can Throw                    | Notes                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------- | ----------------------------------------- |
| `wrap`               | `<T>(callback: () => T) => Result<T, CustomError>`                                                   | `Result<T, CustomError>`                         | No                           | Catches sync throws, converts to Err      |
| `wrapAsync`          | `<T>(callback: () => Promise<T>) => Promise<Result<T, CustomError>>`                                 | `Promise<Result<T, CustomError>>`                | No (promise always resolves) | Catches rejections and sync throws        |
| `wrapThrowable`      | `<T, Args>(callback: Callback<Args, T>) => Callback<Args, Result<T, CustomError>>`                   | A new function returning `Result`                | No from the wrapper itself   | Returns a Result-returning function       |
| `wrapAsyncThrowable` | `<T, Args>(callback: Callback<Args, Promise<T>>) => Callback<Args, Promise<Result<T, CustomError>>>` | A new async function returning `Promise<Result>` | No from the wrapper itself   | Returns a Result-returning async function |

### Exported Types

```typescript
Result<T, E extends Error = Error>          // Core union type
CustomError<T extends OptionalKeyValue>      // Error with optional extra props
```

## 1.2 Result Methods

All methods are defined in `ResultMethods<T, E>` interface and implemented on both `OkState` and `ErrorState`.

### State Checking (no throw, always return)

| Method      | Returns                    | Ok State | Err State |
| ----------- | -------------------------- | -------- | --------- |
| `isOk()`    | `this is OkState<T, E>`    | `true`   | `false`   |
| `isError()` | `this is ErrorState<E, T>` | `false`  | `true`    |

### Value Extraction

| Method               | Returns | Ok State                                          | Err State                                | Can Throw?               |
| -------------------- | ------- | ------------------------------------------------- | ---------------------------------------- | ------------------------ |
| `unwrap()`           | `T`     | returns `ok`                                      | **throws** `E`                           | Yes                      |
| `unwrapErr()`        | `E`     | **throws** `new Error("Received an Ok value...")` | returns `error`                          | Yes                      |
| `expect(message)`    | `T`     | returns `ok`                                      | **throws** `CustomError` with `cause: E` | Yes                      |
| `expectErr(message)` | `E`     | **throws** `CustomError`                          | returns `error`                          | Yes                      |
| `unwrapOr(fallback)` | `T`     | returns `ok`                                      | returns `fallback`                       | No                       |
| `unwrapOrElse(fn)`   | `T`     | returns `ok`                                      | returns `fn(error)`                      | **Yes** — if `fn` throws |

### Transformations that return Result

| Method        | Returns        | Ok State                    | Err State                    | Callback Throws?                        |
| ------------- | -------------- | --------------------------- | ---------------------------- | --------------------------------------- |
| `map(fn)`     | `Result<U, E>` | `Ok(fn(value))`             | preserves `this` (via err()) | **Propagates** (rethrown via `toError`) |
| `andThen(fn)` | `Result<U, E>` | `fn(value)`                 | preserves `this` (via err()) | **Propagates** (rethrown via `toError`) |
| `mapErr(fn)`  | `Result<T, U>` | preserves `this` (via ok()) | `Err(fn(error))`             | **Propagates** (rethrown via `toError`) |
| `and(result)` | `Result<U, E>` | returns `result`            | returns `err(this.error)`    | N/A (no callback)                       |
| `or(result)`  | `Result<T, F>` | returns `ok(this.ok)`       | returns `result`             | N/A (no callback)                       |
| `orElse(fn)`  | `Result<T, F>` | returns `ok(this.ok)`       | `fn(error)`                  | **Propagates** (rethrown via `toError`) |

### Collapsing to Plain Value

| Method                     | Returns | Ok State      | Err State          | Callback Throws?                        |
| -------------------------- | ------- | ------------- | ------------------ | --------------------------------------- |
| `match(matchers)`          | `U`     | `okFn(value)` | `errFn(error)`     | **Propagates** (rethrown via `toError`) |
| `mapOr(default, fn)`       | `U`     | `fn(value)`   | `default`          | **Propagates** (rethrown via `toError`) |
| `mapOrElse(defaultFn, fn)` | `U`     | `fn(value)`   | `defaultFn(error)` | **Propagates** (rethrown via `toError`) |

### Side-Effect (returns original Result)

| Method           | Returns        | Ok State          | Err State         | Callback Throws?                          |
| ---------------- | -------------- | ----------------- | ----------------- | ----------------------------------------- |
| `inspect(fn)`    | `Result<T, E>` | calls `fn(value)` | no-op             | **Propagates** (UNWRAPPED — no try/catch) |
| `inspectErr(fn)` | `Result<T, E>` | no-op             | calls `fn(error)` | **Propagates** (UNWRAPPED — no try/catch) |

## 1.3 Deprecated (in `src/deprecated.ts`, not exported)

```typescript
isOk(result: Result<T, E>): result is OkState<T, E>    // deprecated since v2.0.0
isErr(result: Result<T, E>): result is ErrorState<E, T> // deprecated since v2.0.0
unwrap<T, E>(result: Result<T, E>): T                   // deprecated since v2.1.4
```

These are defined in `src/deprecated.ts` but NOT exported from `src/index.ts`. They remain in the codebase for reference but are dead code.

---

# 2. Error Flow Model

## 2.1 Three Distinct Error Systems

### System A: Result-Based Errors (Err)

The primary error handling path. Errors live inside the `Result.error` property.

**Created via:**

- `Err(new Error(...))` — direct Error instance
- `ErrFromText("message")` — string to Error
- `ErrFromObject({ message, code })` — structured error with extra props
- `ErrFromUnknown(someValue)` — catch-block normalization
- `wrap()` / `wrapAsync()` catching exceptions
- `wrapThrowable()` / `wrapAsyncThrowable()` catching exceptions
- Methods returning `Err(..)` internally: `andThen` on Err, `map` on Err, etc.

**Consumed via:**

- `result.isError()` + `result.error` — safe access
- `result.isOk()` + narrowing — never access error
- `result.match({ errFn })` — pattern match
- `result.mapOrElse(defaultFn, fn)` — collapsing

**File references:** `src/mixins.ts` (lines 40–139), `src/result-methods.ts` (throughout)

### System B: Thrown Synchronous Errors

Errors that escape the Result model entirely. These crash the current execution context unless caught with an outer `try/catch`.

**Thrown by the library itself:**

| Location             | File & Line                 | What Throws                            |
| -------------------- | --------------------------- | -------------------------------------- |
| `Err()` constructor  | `src/mixins.ts:44`          | `TypeError` if not `Error` instance    |
| `result.unwrap()`    | `src/result-methods.ts:222` | The contained error `E`                |
| `result.unwrapErr()` | `src/result-methods.ts:231` | `new Error("Received an Ok value...")` |
| `result.expect()`    | `src/result-methods.ts:52`  | `CustomError` with cause               |
| `result.expectErr()` | `src/result-methods.ts:64`  | `CustomError` with cause               |

**Thrown by user callbacks (propagated through):**

All the following rethrow callback errors via `throw toError(e)` — the error propagates but is normalized to an `Error` instance:

| Method         | File & Line                 |
| -------------- | --------------------------- |
| `map`          | `src/result-methods.ts:117` |
| `andThen`      | `src/result-methods.ts:41`  |
| `mapErr`       | `src/result-methods.ts:160` |
| `match`        | `src/result-methods.ts:178` |
| `orElse`       | `src/result-methods.ts:210` |
| `unwrapOrElse` | `src/result-methods.ts:252` |
| `mapOr`        | `src/result-methods.ts:132` |
| `mapOrElse`    | `src/result-methods.ts:144` |

**Not caught:** `inspect` and `inspectErr` callback throws propagate WITHOUT `toError` wrapping (no try/catch at all).

### System C: Async Promise Rejections

Errors that occur inside `Promise<Result>` or during async operations:

- `wrapAsync` — catches synchronous throws AND async rejections, converts both to `Err`
- `wrapAsyncThrowable` — same, but returns a wrapped function
- If a user manually creates a `Promise<Result>` and the promise rejects (not caught by the library), this is outside the model. For example: `Promise.reject(Err(new Error(...)))` — this rejection has nothing to do with the Result type.
- If a user-created async function throws before reaching any `.await` on a Result, the throw escapes.

### Key Insight: The three error systems are NOT composed

There is no mechanism to convert System B -> System A automatically, except through the explicit `wrap*` functions. A thrown error in a `map` callback propagates to the caller — it does not become an `Err`. This is documented and tested behavior (see `result.test.ts` line 39: "throws when andThen callback throws").

---

# 3. Escape Points (CRITICAL)

## 3.1 Direct Throwers (methods that unconditionally throw)

These are the _intended_ escape hatches — users call them knowingly:

1. **`result.unwrap()`** (`src/result-methods.ts:221`)
   - Throws `this.error as E` when called on an ErrorState
   - The error can be any `E extends Error`
   - **Impact:** Execution leaves Result model with the original error

2. **`result.expect(message)`** (`src/result-methods.ts:51-55`)
   - Throws a new `CustomError` with the message and original error as `cause`
   - **Impact:** Execution leaves Result model, but the original error is preserved as cause

3. **`result.unwrapErr()`** (`src/result-methods.ts:229-232`)
   - Throws `new Error(...)` when called on OkState
   - **Impact:** Clean error message, but still leaves the Result model

4. **`result.expectErr(message)`** (`src/result-methods.ts:63-66`)
   - Throws `CustomError` when called on OkState
   - **Impact:** Leaves Result model

## 3.2 Constructor Throw

5. **`Err(error)`** (`src/mixins.ts:43-47`)
   - Throws `TypeError` if error is not an `Error` instance
   - **Impact:** A simple type mistake during Result construction throws unexpectedly
   - **Note:** This is the ONLY place the Result contract is violated during construction. All other `Err*` constructors normalize non-Error values instead of throwing.

## 3.3 Callback Throw Propagation (all locations)

Every method that accepts a callback that can throw is an escape point:

| Method             | Wrapping                        | Source Line                   |
| ------------------ | ------------------------------- | ----------------------------- |
| `map(fn)`          | `throw toError(e)`              | `src/result-methods.ts:117`   |
| `andThen(fn)`      | `throw toError(e)`              | `src/result-methods.ts:41`    |
| `mapErr(fn)`       | `throw toError(e)`              | `src/result-methods.ts:160`   |
| `match(matchers)`  | `throw toError(e)`              | `src/result-methods.ts:178`   |
| `orElse(fn)`       | `throw toError(e)`              | `src/result-methods.ts:210`   |
| `unwrapOrElse(fn)` | `throw toError(e)`              | `src/result-methods.ts:252`   |
| `mapOr(fn)`        | `throw toError(e)`              | `src/result-methods.ts:132`   |
| `mapOrElse(fn)`    | `throw toError(e)`              | `src/result-methods.ts:144`   |
| `inspect(fn)`      | **No wrapping** (raw propagate) | `src/result-methods.ts:74-77` |
| `inspectErr(fn)`   | **No wrapping** (raw propagate) | `src/result-methods.ts:84-87` |

**Critical observation:** `inspect` and `inspectErr` lack even the `toError` normalization that other methods have. If a side-effect callback throws a string or object, it propagates as-is without conversion to `Error`.

## 3.4 Chaining Safety Illusion

Consider this code:

```typescript
const result = Ok(5)
  .map(x => {
    throw new Error("boom");
  })
  .andThen(x => Ok(x * 2)); // NEVER RUNS

// result is NOT a Result — it threw!
```

The chain _looks_ safe (everything returns `Result`), but `map` with a throwing callback breaks the chain by throwing. The `andThen` never executes. This is the most critical escape point because:

- TypeScript types suggest `map` returns `Result<U, E>` (safe)
- But a throwing callback makes the entire expression throw (unsafe)
- The compiler does not warn about this
- Users from Rust (where `map` panics propagate) may expect this, but users from safe-Result libraries may not

## 3.5 Async Escape

```typescript
// This can throw if callback throws synchronously before returning a promise
const result = await wrapAsync(() => {
  throw new Error("sync throw inside wrapAsync");
});
// This is SAFE — wrapAsync catches it

// But this is UNSAFE:
function badAsync(): Promise<Result<number>> {
  const r = Ok(5);
  throw new Error("before promise"); // throws before returning Promise
}
// The caller gets a rejected promise, not a Result
```

---

# 4. Behavioral Issues

## 4.1 `andThen` Error Type Constraint

```typescript
// Current: error type E is fixed
andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>
```

In Rust, `and_then` allows changing the error type: `fn and_then<U, F>(self, op: impl FnOnce(T) -> Result<U, F>) -> Result<U, E>` where `E` and `F` can differ. In neverthrow, the return type is `Result<U, E | F>`.

lib-result (and ts-result) constrains E to be the same type. This means:

```typescript
// COMPILE ERROR in lib-result:
Ok(5).andThen(x => Err(new AppError("custom")));
//                    ^ AppError is not assignable to Error (or whatever E is)
```

Users must first `mapErr` to convert the error type, or ensure all operations share the same error type. This is a deliberate design choice (simpler types, no union merging) but differs from Rust and neverthrow.

**Impact:** Mild ergonomic friction when building heterogeneous error chains. Users must unify error types before chaining.

## 4.2 `Err()` Constructor Throws

```typescript
Err("not an error"); // throws TypeError at runtime
// Compare with:
ErrFromUnknown("not an error"); // normalizes to Error, returns Err
```

This is the **only constructor that can throw**. Every other `Err*` variant normalizes. The inconsistency is likely to surprise users who:

1. First use `ErrFromText("message")` successfully
2. Then try `Err("message")` and get a TypeError
3. The TypeScript type system does not warn about this

## 4.3 `isError()` vs `isErr()` Naming

The method is named `isError()` while Rust uses `is_err()`. The existing `deprecated.ts` has `isErr()` (the standalone function, deprecated since v2.0.0). The method is consistently named `isError()` in the current API.

This is a deliberate JavaScript-friendly choice, but creates a minor mismatch:

- Rust users will type `result.isErr()` — wrong
- JavaScript `Error` terminology aligns with `isError()` — correct for JS

## 4.4 `inspect` / `inspectErr` Callback Throw Handling

Unlike all other callback-accepting methods, `inspect` and `inspectErr` do NOT wrap their callbacks in try/catch. This means:

```typescript
Ok(5).inspect(value => {
  throw "side effect failed"; // raw string propagates
});
```

All other methods wrap with `toError(e)` before rethrowing. The inconsistency means:

- `inspect` callback throws propagate raw (no Error normalization)
- Side-effect failures crash the pipeline without warning

## 4.5 `match` errFn Type Allows No-Args But Always Gets Error

```typescript
match<U>(matchers: {
  okFn: (value: T) => U;
  errFn: ((error: E) => U) | (() => U); // can be () => U
}): U
```

The `() => U` variant lets users write `errFn: () => "default"` without accepting the error parameter. This is user-friendly. However, the implementation always calls `matchers.errFn(this.error as E)` — passing the error. This means:

- If user writes `errFn: () => U`, the error argument is passed but ignored — fine
- If user writes `errFn: (error: E) => U`, it works as expected
- **No actual problem here** — this is just a design choice to allow simpler errFn signatures

## 4.6 `mapOr` Parameter Order

```typescript
mapOr<U>(defaultValue: U, fn: (value: T) => U): U
```

Default value comes FIRST, mapping function SECOND. This matches Rust (`map_or(default, f)`) but is unusual for JavaScript where callbacks typically come before configuration values. Compare with:

```typescript
arr.map(x => x * 2)       // callback comes first in JS
arr.reduce((acc, x) => ..., initial)  // callback comes first

// lib-result:
result.mapOr(0, x => x * 2)  // default first, callback second
```

**Impact:** Users may expect `mapOr(x => x * 2, 0)` (callback first) and get confused by the parameter order.

## 4.7 `andThen` Not `flatMap`

In many functional languages and libraries, the operation that takes `T -> Result<U, E>` and returns `Result<U, E>` is called `flatMap` or `chain`. lib-result uses `andThen` (Rust name). This is correct for Rust alignment, but:

- Users from fp-ts or Scala expect `chain` or `flatMap`
- Users from RxJS expect `flatMap` or `mergeMap`
- The name `andThen` is unique to Rust-style Result libraries

## 4.8 Version History of `orElse`

The `orElse` method has undergone semantic changes across versions:

- **v3.x**: `orElse(fn)` returned a plain value (like current `unwrapOrElse`)
- **v4.x**: `orElse(fn)` changed to return a `Result` (Rust-style recovery)
- **v5.0.0**: Breaking change made this the official `orElse` semantic, adding `unwrapOrElse` for value fallback

This history means:

- Code found online may use the old semantics
- Users migrating between major versions need to understand the change
- The current v5.0.0 API is correct and aligned with Rust

---

# 5. User Mental Models

## 5.1 Rust Users

**Expectations:**

- `Ok(T)` and `Err(E)` constructors work like Rust's `Ok(T)` and `Err(E)`
- `andThen` works like Rust `and_then`
- `unwrap()` throws (panics in Rust) on Err
- `?` operator equivalent (no direct equivalent in lib-result)
- `E extends Error` constraint is unfamiliar — Rust allows any type
- `isError()` instead of `is_err()` is a naming mismatch
- `match()` with object patterns is different from Rust's `match` expression

**Likely surprises:**

- `Err("string")` throws TypeError (Rust allows any error type)
- `map` callback throws propagate (but in Rust, panics in `map` propagate too — so this may be expected!)
- No `Result::collect()` equivalent (no aggregation helpers)
- Error type is constrained to `Error` — can't use plain strings, numbers, or unions
- `andThen` error type is fixed (can't widen)

## 5.2 neverthrow Users

**Expectations:**

- Same `Ok`/`Err` constructors
- `andThen` for chaining (same name)
- `map`, `mapErr`, `match` (similar names)
- `ResultAsync` for fluent async chains — lib-result does not have this
- Arbitrary error types — lib-result constrains to `Error`

**Likely surprises:**

- No `ResultAsync` — must `await` between operations
- `E extends Error` — can't use string errors
- No `Result.combine()` or `Result.combineWithAllErrors()`
- No `safeTry` / generator-based `?` operator
- Callback throws in `map`/`andThen` are re-thrown via `toError()` (normalized to Error)
- In neverthrow, callback exceptions propagate directly (no `toError` normalization)

## 5.3 fp-ts Users

**Expectations:**

- `pipe()` function for composition — lib-result removed `pipe(name)` and renamed it to `andThen`
- `chain` instead of `andThen`
- `bimap` for transforming both channels — lib-result has `map` + `mapErr` separately
- `fold` instead of `match`
- `fromEither` / `tryCatch` — lib-result has `wrap` / `wrapThrowable`
- Lazy evaluation — lib-result is eager

**Likely surprises:**

- Method-based API (not free functions + pipe)
- `andThen` instead of `chain`
- Eager evaluation
- No `TaskEither` equivalent for async
- `E extends Error` instead of arbitrary error types

## 5.4 General JS / Async/Await Users

**Expectations:**

- Simple try/catch replacement
- Error objects are actual `Error` instances (good — aligns with JS conventions)
- `unwrap()` to get the value, `catch` the error
- `result.ok` / `result.error` for direct property access

**Likely surprises:**

- `map` and `andThen` can throw — need to wrap chains in try/catch or use `match` at the end
- `Err("text")` throws TypeError — must use `ErrFromText("text")`
- Four different `Err*` constructors is confusing
- No built-in async chaining — must `await` between operations
- No aggregation helpers

---

# 6. Misuse Cases

## 6.1 Uncaught Callback Throws in Chains

```typescript
// User expects safe chaining, but map throws
const result = Ok(input)
  .map(x => JSON.parse(x)) // throws if x is invalid JSON
  .andThen(x => process(x)); // never runs — the throw above escapes

// result never gets assigned — the expression throws
// User must wrap in try/catch:
try {
  const result = Ok(input).map(x => JSON.parse(x));
  // ...
} catch (e) {
  // This is essentially abandoning the Result model
}
```

**Root cause:** `map` accepts `(value: T) => U` where `U` is a plain value. If `JSON.parse` throws, the callback throw propagates. The user expected `map` to be safe.

**Correct usage:** The user should either:

1. Use `wrap(() => JSON.parse(x))` inside the map callback
2. Or use a different pattern that catches errors

## 6.2 Using `Err()` Instead of `ErrFromText()`

```typescript
// BUG: throws TypeError at runtime
return Err("Operation failed");

// CORRECT:
return Err(new Error("Operation failed"));
// OR:
return ErrFromText("Operation failed");
```

**Root cause:** `Err()` requires an `Error` instance but the error message is a string. The user intuitively passes a string. TypeScript does not catch this because `Err<T, E extends Error>` constrains `E` — but at runtime, `"string"` is not an `instanceof Error`, so it throws.

## 6.3 Missing `await` in Async Chains

```typescript
// WRONG: map on Promise<Result>, not Result
const r = wrapAsync(() => fetch(url)); // Promise<Result>
const doubled = r.map(x => x * 2); // ERROR: map does not exist on Promise

// CORRECT:
const r = await wrapAsync(() => fetch(url));
const doubled = r.map(x => x * 2); // Result<number, CustomError>
```

**Root cause:** Async operations return `Promise<Result>`, not `Result`. Users forget to `await` and try to chain on the Promise.

## 6.4 Assuming `andThen` Can Change Error Type

```typescript
// COMPILE ERROR:
Ok(5).andThen(x => {
  if (x > 10) return Err(new AppError("too big")); // AppError != Error
  return Ok(x * 2);
});

// Must do:
Ok(5)
  .mapErr(e => new AppError(e.message)) // convert error type first
  .andThen(x => {
    if (x > 10) return Err(new AppError("too big"));
    return Ok(x * 2);
  });
```

**Root cause:** `andThen` requires the same error type `E`. Users who come from Rust or neverthrow expect the error type to widen automatically.

## 6.5 Using `unwrapOrElse` for Result Recovery Instead of `orElse`

```typescript
// WRONG — collapses to plain value:
const recovered = result.unwrapOrElse(err => Ok(42 as const));
// recovered type is Result<number, Error> | number — confusing

// CORRECT — stays in Result world:
const recovered = result.orElse(err => Ok(42));
// recovered: Result<number, Error>
```

**Root cause:** `unwrapOrElse` returns a plain value `T`. If the callback returns a `Result`, the return type becomes `Result<U, E> | T`, which is confusing.

## 6.6 Destructuring Breaks Type Narrowing

```typescript
const result = divide(10, 2);

// Safe:
if (result.isOk()) {
  console.log(result.ok); // number
}

// BUG: destructuring loses the narrowing:
const { ok, error } = result;
if (result.isOk()) {
  console.log(ok); // still T | undefined — not narrowed!
}
```

**Root cause:** TypeScript's control flow narrowing works on property access on the narrowed variable, not on destructured bindings.

## 6.7 Chaining After `mapErr` Expects Wrong Error Type

```typescript
const r = Err(new Error("original")).mapErr(e => new AppError(e.message)); // Result<never, AppError>

// WORKS — error type is now AppError:
r.mapErr(e => new OtherError(e.message));

// COMPILE ERROR — andThen still expects AppError:
r.andThen(x => Err(new SomeOtherError("")));
// SomeOtherError is not assignable to AppError
```

**Root cause:** Once `mapErr` changes the error type, all subsequent operations use the new error type. Users need to unify error types carefully.

---

# 7. Design Problems

## 7.1 Structural Design Issues

### 7.1.1 Callback Throws Break the Result Contract

**Problem:** Every method that accepts a callback (`map`, `andThen`, `mapErr`, `match`, `orElse`, `unwrapOrElse`, `mapOr`, `mapOrElse`, `inspect`, `inspectErr`) can throw if the callback throws. The type signatures suggest Result safety, but runtime behavior can escape.

**Severity:** HIGH. This is the most fundamental design tension in the library. The type system promises "one path in, one of two paths out (Ok or Err)" but callback throws create a third path: thrown exception.

**Alternatives considered:**

- **Catch and convert to Err** (like `wrap` does): This was v4.0.0's behavior for `map` and was changed because it violated type safety (casting the caught error to the wrong type with `as U`).
- **Current approach** (propagate): Matches all three rival libraries (neverthrow, ts-result, vultix-ts-results all propagate). But it means Result methods are not exception-safe.
- **Mark as throws in JSDoc**: Currently done inconsistently — some methods document it, others don't.

### 7.1.2 `Err()` Throws TypeError at Construct Time

**Problem:** `Err()` is the only constructor that validates its argument at runtime by throwing. All other `Err*` constructors normalize.

**Severity:** MEDIUM. This is a real trap for new users. The fix is simple: normalize non-Error values instead of throwing.

### 7.1.3 No AsyncResult Type

**Problem:** Async composition requires manual `await` + sync Result methods. There is no fluent async pipeline.

**Severity:** MEDIUM (for now). All rivals either have `ResultAsync` (neverthrow) or accept `Promise<Result>` patterns. lib-result's approach is simpler but less powerful.

### 7.1.4 No Aggregation Helpers

**Problem:** `Result.all([...])`, `Result.any([...])`, `Result.combine(...)` are missing. Users must manually loop or use `Promise.all` on `Promise<Result>` arrays.

**Severity:** MEDIUM. Both neverthrow and vultix-ts-results provide this. It's a common need.

### 7.1.5 Dead Code: `src/deprecated.ts`

**Problem:** The file exists but is not imported or exported anywhere. It contains the old standalone `isOk`, `isErr`, `unwrap` functions.

**Severity:** LOW. Dead code that should be removed for clarity.

### 7.1.6 `inspect` / `inspectErr` Missing Callback Safety

**Problem:** Unlike all other callback methods, `inspect` and `inspectErr` do not wrap callbacks in try/catch or even `toError`. This is inconsistent.

**Severity:** LOW. The inconsistency is minor, but the lack of any normalization means raw values (strings, objects) propagate without being converted to Error.

### 7.1.7 `mapOr` Parameter Order is Non-Idiomatic for JS

**Problem:** The default value comes before the callback function, which is opposite to JavaScript conventions (where callbacks typically come last).

**Severity:** LOW. Matches Rust convention, which is the library's target audience, but may surprise JS developers.

## 7.2 Naming Issues

### 7.2.1 `isError()` vs Rust `is_err()`

**Issue:** The method is named `isError()` (JS-friendly) but Rust users expect `isErr()`. The deprecated standalone function was called `isErr()`.

**Assessment:** Not a bug — the current naming is intentional and consistent. But the `deprecated.ts` file still uses `isErr` for the old standalone version, which adds confusion.

### 7.2.2 `CustomError` Type Name Generic

**Issue:** `CustomError<T>` is a very generic name. When imported alongside user-defined `CustomError` types, it can shadow or conflict.

**Assessment:** LOW risk. The type is part of the public API but not commonly referenced by name.

### 7.2.3 Four `Err*` Constructors

**Issue:** `Err`, `ErrFromText`, `ErrFromObject`, `ErrFromUnknown` — four ways to create an error result. This is a lot of surface area.

**Assessment:** MEDIUM concern. Each has clear JS use cases:

- `Err(new MyError(...))` — custom error classes
- `ErrFromText("msg")` — quick string errors
- `ErrFromObject({ code, info })` — structured metadata
- `ErrFromUnknown(catchValue)` — catch block normalization

But new users may be overwhelmed. The constructor naming breaks a JS convention where one function handles multiple overloads.

## 7.3 Cognitive Load Issues

### 7.3.1 Too Many Overlapping Abstractions

The user has multiple ways to achieve similar outcomes:

| Goal                 | Options                                                                       |
| -------------------- | ----------------------------------------------------------------------------- |
| Get value or default | `unwrapOr`, `unwrapOrElse`, `mapOr`, `mapOrElse`, `match`                     |
| Transform success    | `map`, `andThen`                                                              |
| Handle error         | `orElse`, `mapErr`, `unwrapOrElse`, `match`                                   |
| Exit Result world    | `unwrap`, `expect`, `unwrapOr`, `unwrapOrElse`, `match`, `mapOr`, `mapOrElse` |

This is a lot to learn. The library has 17 methods on Result, plus 7 constructor/wrapper functions.

### 7.3.2 `map` vs `andThen` Distinction

New users regularly confuse:

- `map(fn: T => U)` — transforms value, callback can throw
- `andThen(fn: T => Result<U, E>)` — chains Result-returning functions, callback can throw

The distinction is standard in Rust/FP libraries but confusing for newcomers. The FAQ addresses this, but the cognitive overhead remains.

### 7.3.3 Callback Throw Rules Are Subtle

- Most methods: callbacks that throw are caught and rethrown via `toError(e)`
- `inspect`/`inspectErr`: callbacks that throw are NOT caught
- `wrap*` functions: callbacks that throw ARE caught and converted to `Err`
- The difference between "catch and convert to Err" (wrap functions) vs "catch and rethrow" (methods) is subtle and easy to miss

---

# 8. Fix Plan

## 8.1 Low-Risk Improvements (Documentation + Minor)

### L1. Improve `Err()` Documentation

**What:** Add clear JSDoc on `Err()` that it throws TypeError for non-Error values, and cross-reference `ErrFromText()`, `ErrFromUnknown()` as alternatives.

**Where:** `src/mixins.ts` line 40 (the `Err` function JSDoc)

**Why:** Users repeatedly hit this trap. Better docs reduce friction.

**Breaks if not done:** Continued user confusion and runtime errors.

**Migration impact:** None.

### L2. Add "Callback Safety" Documentation

**What:** Create a dedicated documentation page (e.g., `Callback-Safety.md`) that clearly documents:

- Which methods catch callback exceptions and how they normalize them
- Which methods let callback exceptions propagate
- Safe patterns for error handling inside callbacks

**Where:** `docs/` directory

**Why:** The callback throw behavior is the most subtle and surprising part of the API.

**Breaks if not done:** Users write code that throws in callbacks, expecting the Result to catch it.

**Migration impact:** None.

### L3. Remove `src/deprecated.ts`

**What:** Delete the dead code file. The functions have not been exported since v3.0.0.

**Where:** `src/deprecated.ts`

**Why:** Dead code creates maintenance burden and confusion for readers.

**Breaks if not done:** Minimal — the code is already dead.

**Migration impact:** None — not exported.

### L4. Add `toError` Wrapping to `inspect` and `inspectErr` Callbacks

**What:** Wrap the `fn` calls in `inspect` and `inspectErr` with try/catch + `toError(e)` to match the behavior of all other callback-accepting methods.

**Where:** `src/result-methods.ts` lines 73-77 and 84-87

**Why:** Consistency. Currently these two methods silently differ from every other callback method. A throwing callback in inspect will propagate a raw value, while the same throw in map would propagate via `toError(e)`.

**Breaks if not done:** Inconsistent behavior persists.

**Migration impact:** None for correctly-behaving callbacks. Callbacks that throw will now get `toError` normalization. This is strictly better.

### L5. Standardize JSDoc Throw Annotations

**What:** Audit all method JSDocs to ensure they document throw behavior. Currently some methods document it, others don't. For example, `map` JSDoc does not mention callback throws.

**Where:** `src/result-methods.ts` (all methods)

**Why:** Accurate documentation is critical for an API where throw behavior is a key design consideration.

**Breaks if not done:** Users rely on incomplete documentation.

**Migration impact:** None.

## 8.2 Medium-Risk Improvements (Semantic Changes)

### M1. Make `Err()` Normalize Instead of Throw

**What:** Change `Err()` to normalize non-Error values (like `ErrFromUnknown` does) instead of throwing TypeError. Keep the `E extends Error` type constraint, but at runtime, convert non-Error inputs.

**Where:** `src/mixins.ts` lines 43-47

**Why:** This is the only constructor that throws at runtime. All other constructors normalize. This change makes `Err()` consistent with the rest of the API.

**What it changes:**

```typescript
// Current:
function Err<T, E>(error: E): ErrorState<E, T> {
  if (!(error instanceof Error)) {
    throw new TypeError("...");
  }
  // ...
}

// Proposed:
function Err<T, E extends Error>(error: E): ErrorState<E, T> {
  if (!(error instanceof Error)) {
    return ErrFromUnknown(error) as unknown as ErrorState<E, T>;
  }
  // ...
}
```

**Breaks if not done:** Users passing strings to `Err()` continue to get runtime TypeError.

**Migration impact:** Breaking change in behavior only for code that currently catches the TypeError from `Err()`. Such code is unlikely.

### M2. Remove `() => U` Variant from `match` errFn Type

**What:** Remove the union type `(() => U)` from `match`'s `errFn` parameter. Require `errFn` to always accept the error.

**Where:** `src/types.ts` line 180, `src/result-methods.ts` line 171

**Why:** The `() => U` variant is misleading. The implementation always calls errFn with the error. Allowing `() => U` in the type means users can write `errFn: () => U` and never handle the error, losing access to error information. If the intent is to ignore the error, users can write `errFn: (_error) => U`.

**Breaks if not done:** Misleading type that suggests the error is optional when it is not.

**Migration impact:** Users who wrote `errFn: () => "value"` need to change to `errFn: (_error) => "value"` or `errFn: (_error: E) => "value"`.

### M3. Add `Result.all` Static Aggregation Helper

**What:** Add a static `Result.all(...)` method that takes multiple Results and returns `Ok([values])` if all are Ok, or the first `Err`.

**Where:** New method on `Result` type, or a standalone exported function. Implementation in a new file or in `result-methods.ts`.

**Why:** Third most requested feature (after mapErr and unwrapOrElse). Present in neverthrow and vultix-ts-results. Common user need.

**Breaks if not done:** Users write manual aggregation code.

**Migration impact:** None — additive.

### M4. Remove `mapOr` / `mapOrElse` or Add Clear Deprecation Notice

**What:** Evaluate whether `mapOr` and `mapOrElse` justify their existence alongside `match`. If kept, clearly document when to use each. If removed, deprecate with a migration path to `match`.

**Where:** `src/result-methods.ts`

**Why:** These two methods add surface area but overlap significantly with `match`. The value proposition is "shorter than match" but the parameter order (`default` first) is non-idiomatic.

**Breaks if not done:** API surface remains larger than needed.

**Migration impact:** Removal would be a breaking change. Recommend keeping them but adding documentation clarifying when to use vs `match`.

## 8.3 High-Risk Changes (Runtime Semantic Changes)

### H1. Catch and Wrap Callback Throws in Methods

**What:** Change `map`, `andThen`, `mapErr`, `match`, `orElse`, `unwrapOrElse`, `mapOr`, `mapOrElse` to catch callback exceptions and return `Err(toError(e))` instead of rethrowing. This would make all Result methods truly exception-safe.

**Where:** `src/result-methods.ts` — all methods with `catch (e) { throw toError(e); }`

**Why:** This is the only way to make the Result contract fully safe. Currently, a `map` callback that throws breaks the chain entirely.

**What it changes:**

```typescript
// Current — catch and rethrow:
catch (e) {
  throw toError(e);
}

// Proposed — catch and return Err:
catch (e) {
  return Err(toError(e));
}
```

**Impact on types:** The return type stays the same (`Result<U, E>`). But the ERR type in the catch path is `CustomError` (from `toError(e)`), which might not match `E`. The return type must become `Result<U, E | CustomError>`, or the error must be cast with `as E` (which is what v4.0.0 did and was considered a bug).

This is the **critical challenge**: if `map` catches an exception from the callback, what error type does the returned `Err` have? The callback can throw anything, but the return type constrains `E`.

**Options:**

1. **Broaden return type:** `Result<U, E | Error>` — safe but widens the type, requiring users to handle a potentially wider error type.
2. **Cast with `as E`:** Unsafe — the caught error might not be `E`.
3. **Rethrow (current approach):** Unsafe in a different way — the chain breaks.
4. **Make callback always return `Result` (like `andThen` pattern):** This pushes the burden to users.

**Recommendation for now:** Keep the current approach (rethrow) but document it clearly. The `wrap*` functions exist for the "catch and convert" use case. Changing this would be a fundamental shift that makes the API less predictable (you'd never know if an Err came from your business logic or from a callback bug).

**Breaks if not done:** The current behavior is well-tested and matches rival libraries.

**Migration impact:** Would affect every chain in every codebase using the library.

### H2. Add `andThen` Error Type Widening

**What:** Change `andThen` signature to allow the callback to return `Result<U, F>` where `F` can differ from `E`. The return type becomes `Result<U, E | F>` (or the narrower of the two).

**Where:** `src/result-methods.ts` lines 35-36, `src/types.ts` line 50

**Why:** Matches Rust and neverthrow behavior. Allows heterogeneous error chains without needing `mapErr` first.

**Breaks if not done:** Users must still use `mapErr` to unify error types before chaining.

**Migration impact:** Breaking change to the type signature. Code that relied on `E` being fixed in `andThen` chains may break if error types become unions.

### H3. Add `AsyncResult` Type

**What:** Create a lightweight `AsyncResult<T, E>` wrapper around `Promise<Result<T, E>>` with the same method chain surface. This is a major feature addition.

**Where:** New file `src/async-result.ts`

**Why:** Biggest capability gap compared to neverthrow. Enables fluent async composition.

**Breaks if not done:** Users continue to use manual `await` patterns for async.

**Migration impact:** Additive — no breaking change. But it's a large surface area addition.

**Recommendation:** Defer to a future phase. The sync API should be stable first.

---

# 9. Optional API Redesign Proposal

## 9.1 Guiding Principles

1. **Safety first:** Methods that return `Result` should never throw (callback exceptions caught and converted)
2. **Error normalization:** All error constructors normalize, none throw
3. **Clear separation:** Safe operations (always return `Result`) vs. escape hatches (clearly marked)
4. **Minimal surprise:** Parameter order, naming, and behavior match both Rust and JS conventions where possible
5. **Single error philosophy:** One consistent rule for how errors flow through the system

## 9.2 Proposed Cleaned-Up API Surface

### Constructor Reorganization

```typescript
// Keep, simplify:
Ok<T>(value: T): Result<T, Error>

// Single Err constructor with overloads:
Err(error: Error): Result<never, Error>           // explicit Error instance
Err(message: string): Result<never, Error>         // string -> auto-convert
Err(props: ErrorProps): Result<never, CustomError> // object -> Error with props
Err(unknown: unknown): Result<never, Error>         // catch block value -> normalize

// OR keep current split, but make Err() not throw
```

The key change: `Err()` normalizes like the others. A single function with overloads is more JavaScript-idiomatic than four separate functions.

### Safe Method Surface (never throw)

```typescript
// State checking
isOk(): this is OkState<T, E>
isError(): this is ErrorState<E, T>

// Transformations (always return Result)
map<U>(fn: (value: T) => U): Result<U, E | ConvertedError>  // catches callback throws
andThen<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F>
mapErr<U>(fn: (error: E) => U): Result<T, U>
and(result: Result<U, E>): Result<U, E>
or(result: Result<T, E>): Result<T, E>
orElse<F>(fn: (error: E) => Result<T, F>): Result<T, E | F>

// Side-effect (never throw)
inspect(fn: (value: T) => void): Result<T, E>        // catches callback throws
inspectErr(fn: (error: E) => void): Result<T, E>     // catches callback throws

// Aggregation (static)
static all<...>(results: [...]): Result<[...], E>
static any<...>(results: [...]): Result<T, E[]>
```

### Escape Hatches (clearly marked, documented as throws)

```typescript
// Value extraction (can throw)
unwrap(): T                  // throws the contained error
expect(message: string): T   // throws CustomError with cause
unwrapOr(fallback: T): T     // never throws (safe)

// Error extraction (can throw)
unwrapErr(): E               // throws if Ok
expectErr(message: string): E // throws if Ok

// Pattern matching (callback throws propagate or are caught)
match<U>(matchers): U        // callback throws stay as-is (Rust-style)
mapOr<U>(default, fn): U     // callback throws propagate
mapOrElse<U>(defaultFn, fn): U // callback throws propagate
unwrapOrElse<U>(fn): T       // callback throws propagate
```

## 9.3 Category Table

| Category                | Methods                                           | Always Returns Result? | Can Throw?                       |
| ----------------------- | ------------------------------------------------- | ---------------------- | -------------------------------- |
| **Safe queries**        | `isOk`, `isError`                                 | No (returns bool)      | No                               |
| **Safe transforms**     | `map`, `andThen`, `mapErr`, `and`, `or`, `orElse` | Yes                    | No (if we catch callback throws) |
| **Side-effects**        | `inspect`, `inspectErr`                           | Yes                    | No (catch callback throws)       |
| **Unsafe extraction**   | `unwrap`, `expect`                                | No                     | Yes                              |
| **Safe extraction**     | `unwrapOr`                                        | No                     | No                               |
| **Fallible extraction** | `unwrapOrElse`, `mapOr`, `mapOrElse`, `match`     | No                     | Yes (callback throws propagate)  |

## 9.4 Key Changes from Current API

1. **`Err()` normalizes instead of throwing** — consistent with other constructors
2. **`map` / `andThen` / `mapErr` catch callback throws** and return `Err` — fully safe Result chain
3. **`andThen` error type widens** — matches Rust and neverthrow
4. **`inspect` / `inspectErr` catch callback throws** — consistent with other methods
5. **`Result.all` / `Result.any`** — static aggregation helpers
6. **Remove `mapOr` / `mapOrElse`** — or deprecate in favor of `match` (reduces surface area)
7. **Type-safe callback error handling** — `map` return type becomes `Result<U, E | Error>` instead of opaque rethrow

## 9.5 Migration Path

| Current Code                                         | New Code                                                    |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `Err("text")` -> throws TypeError                    | `Err("text")` -> returns `Err(Error("text"))` automatically |
| `Ok(x).map(fn)` — if `fn` throws, chain breaks       | `Ok(x).map(fn)` — if `fn` throws, returns `Err`             |
| `Ok(x).andThen(fn)` — `fn` must return same `E`      | `Ok(x).andThen(fn)` — `fn` can return different error type  |
| `Ok(x).mapOr(0, fn)`                                 | `Ok(x).match({ okFn: fn, errFn: () => 0 })`                 |
| `result.inspect(fn)` — if `fn` throws, raw propagate | `result.inspect(fn)` — if `fn` throws, normalized propagate |

## 9.6 What Stays the Same

- `Ok()` constructor (unchanged behavior)
- `ErrFromText`, `ErrFromObject`, `ErrFromUnknown` (unchanged)
- `wrap`, `wrapAsync`, `wrapThrowable`, `wrapAsyncThrowable` (unchanged)
- `isOk`, `isError` (unchanged)
- `unwrap`, `expect`, `unwrapOr`, `unwrapErr`, `expectErr` (unchanged)
- `and`, `or`, `orElse` (behavior unchanged)
- `inspect`, `inspectErr` (behavior unchanged, just safer)
- `E extends Error` constraint (KEPT — core identity)

## 9.7 Risk Assessment of Redesign

| Change                                 | Risk        | Impact                                     | Recommended Order  |
| -------------------------------------- | ----------- | ------------------------------------------ | ------------------ |
| `Err()` normalize instead of throw     | Low         | Fixes common user trap                     | 1                  |
| `inspect`/`inspectErr` callback safety | Low         | Consistency improvement                    | 2                  |
| Add `Result.all`                       | Low         | New capability, no breakage                | 3                  |
| `map`/`andThen` catch callback throws  | High        | Fundamental behavioral change              | 4 (defer)          |
| `andThen` error type widening          | Medium-High | Type-level change, may break existing code | 5 (defer)          |
| Remove `mapOr`/`mapOrElse`             | Medium      | Breaking change                            | 6 (defer, or skip) |

---

# Appendix A: Method Implementation Summary

| Method         | Returns        | Ok path                      | Err path                            | Callback throw?    | File:Line  |
| -------------- | -------------- | ---------------------------- | ----------------------------------- | ------------------ | ---------- |
| `and`          | `Result<U, E>` | `result`                     | `err(this.error)`                   | N/A                | rm:22-26   |
| `andThen`      | `Result<U, E>` | `fn(this.ok)`                | `err(this.error)`                   | `throw toError(e)` | rm:34-44   |
| `expect`       | `T`            | `this.ok`                    | `throw CustomError(message, cause)` | N/A                | rm:48-56   |
| `expectErr`    | `E`            | `throw CustomError(message)` | `this.error`                        | N/A                | rm:60-68   |
| `inspect`      | `Result<T, E>` | `fn(this.ok)`                | no-op                               | raw propagate      | rm:72-77   |
| `inspectErr`   | `Result<T, E>` | no-op                        | `fn(this.error)`                    | raw propagate      | rm:81-88   |
| `isError`      | boolean        | `false`                      | `true`                              | N/A                | rm:91-96   |
| `isOk`         | boolean        | `true`                       | `false`                             | N/A                | rm:99-104  |
| `map`          | `Result<U, E>` | `ok(fn(this.ok))`            | `err(this.error)`                   | `throw toError(e)` | rm:107-121 |
| `mapOr`        | `U`            | `fn(this.ok)`                | `defaultValue`                      | `throw toError(e)` | rm:125-134 |
| `mapOrElse`    | `U`            | `fn(this.ok)`                | `defaultFn(this.error)`             | `throw toError(e)` | rm:138-147 |
| `mapErr`       | `Result<T, U>` | `ok(this.ok)`                | `err(fn(this.error))`               | `throw toError(e)` | rm:150-164 |
| `match`        | `U`            | `okFn(this.ok)`              | `errFn(this.error)`                 | `throw toError(e)` | rm:167-181 |
| `or`           | `Result<T, F>` | `ok(this.ok)`                | `result`                            | N/A                | rm:185-194 |
| `orElse`       | `Result<T, F>` | `ok(this.ok)`                | `fn(this.error)`                    | `throw toError(e)` | rm:197-214 |
| `unwrap`       | `T`            | `this.ok`                    | `throw this.error`                  | N/A                | rm:217-223 |
| `unwrapErr`    | `E`            | `throw new Error(...)`       | `this.error`                        | N/A                | rm:226-232 |
| `unwrapOr`     | `T`            | `this.ok`                    | `fallback`                          | N/A                | rm:235-240 |
| `unwrapOrElse` | `T`            | `this.ok`                    | `fn(this.error)`                    | `throw toError(e)` | rm:243-255 |

_(rm = src/result-methods.ts)_

# Appendix B: File Map

| File                       | Purpose                | Key Exports                                                       |
| -------------------------- | ---------------------- | ----------------------------------------------------------------- |
| `src/index.ts`             | Public entry point     | Re-exports from main.ts, mixins.ts, types.ts                      |
| `src/types.ts`             | Type definitions       | `Result`, `OkState`, `ErrorState`, `CustomError`, `ResultMethods` |
| `src/main.ts`              | Wrap functions         | `wrap`, `wrapAsync`, `wrapThrowable`, `wrapAsyncThrowable`        |
| `src/mixins.ts`            | Constructors           | `Ok`, `Err`, `ErrFromText`, `ErrFromObject`, `ErrFromUnknown`     |
| `src/result-methods.ts`    | Method implementations | All `ResultMethods` methods, via `createResultMethods`            |
| `src/utils.ts`             | Utilities              | `toError`, `isKeyValue`, `createCustomError`                      |
| `src/deprecated.ts`        | Dead code              | Old standalone `isOk`, `isErr`, `unwrap` (not exported)           |
| `tests/result.test.ts`     | Core tests             | Constructor and wrap function tests                               |
| `tests/result-api.test.ts` | API tests              | Method-level tests for all Result methods                         |
| `tests/utils.test.ts`      | Utils tests            | `toError`, `createCustomError`, `isKeyValue`                      |
| `tests/testing-utils.ts`   | Test helpers           | `DivisionError`, `divide`, `withHttpServer`                       |

# Appendix C: Rival Library Comparison Snapshot

| Feature                      | lib-result v5             | neverthrow          | ts-result       | vultix-ts-results  |
| ---------------------------- | ------------------------- | ------------------- | --------------- | ------------------ |
| `E extends Error`            | **Yes**                   | No                  | No              | No                 |
| `map(fn)` throw behavior     | Propagate (via `toError`) | Propagate           | Propagate       | Propagate          |
| `andThen(fn)` throw behavior | Propagate (via `toError`) | Propagate           | Propagate       | Propagate          |
| `mapErr`                     | **Yes**                   | Yes                 | Yes             | Yes                |
| `unwrapOrElse`               | **Yes**                   | No                  | Yes             | No                 |
| `andThen` error widening     | No (fixed `E`)            | Yes (`E \| F`)      | No (fixed `E`)  | Yes (`E \| E2`)    |
| AsyncResult type             | No                        | Yes (`ResultAsync`) | No              | No                 |
| Aggregation helpers          | No                        | Yes (`combine*`)    | No              | Yes (`all`, `any`) |
| Error constructors count     | 5 (`Ok`+4 `Err*`)         | 2 (`ok`, `err`)     | 2 (`Ok`, `Err`) | 2 (`Ok`, `Err`)    |
| Wrap helpers                 | 4                         | 1 (`fromThrowable`) | 0               | 2 (static wrap)    |
| `Err()` non-Error handling   | **Throws TypeError**      | Accepts any         | Accepts any     | Accepts any        |
| Side-effect methods          | `inspect`, `inspectErr`   | `andTee`, `orTee`   | None            | None               |
