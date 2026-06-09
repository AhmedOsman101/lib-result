# Second Pass: Deeper Audit Findings

**Date:** 2026-06-09
**Status:** Draft
**Predecessor:** `docs/audit/full-audit.md`

---

This document captures findings from a second critical re-read of the entire codebase. Each section covers something I missed, mischaracterized, or didn't analyze deeply enough in the first pass.

---

# A. Corrections to First Pass

## A.1 `mapOr` parameter ordering (corrected analysis)

**First pass claim:** "Default value comes first, mapping function second. Matches Rust but is non-idiomatic for JavaScript."

**Re-evaluation:** This claim is correct — Rust uses `map_or(default, f)`. However, I incorrectly categorized this as a "behavioral issue." It is a deliberate design choice to match Rust semantics. The library's target audience includes Rust users, so this alignment is intentional and correct. It should be categorized as a "tradeoff" not an "issue."

**Verdict:** Remove from Behavioral Issues. Document as design decision.

## A.2 `match` errFn `() => U` variant (corrected analysis)

**First pass claim:** "The `() => U` variant is misleading — it suggests the error can be omitted from the function signature, but the function IS called with the error."

**Re-evaluation:** This is actually standard TypeScript behavior. If a function type is `(x: number) => void`, and you pass `() => void`, the parameter `x` is simply ignored. TypeScript routinely allows functions with fewer parameters than declared. The union `((error: E) => U) | (() => U)` actually provides type-safe NO-IGNORE semantics: users who write `errFn: (error) => U` get the error passed correctly; users who write `errFn: () => U` intentionally ignore it. The union makes the intent explicit.

**Verdict:** Not a bug. Remove from Behavioral Issues. It's a deliberate ergonomic choice.

## A.3 `inspect`/`inspectErr` callback safety (corrected analysis)

**First pass claim:** "Unlike all other callback-accepting methods, `inspect` and `inspectErr` do NOT wrap their callbacks in try/catch — inconsistent."

**Re-evaluation:** This is true but the comparison with other methods is wrong. The "other" methods wrap in try/catch for a specific reason: they need to ensure the `toError` conversion to maintain Error consistency. The `inspect`/`inspectErr` methods do NOT need `toError` because their return type is `Result<T, E>` regardless of what the callback does — they return `this` unchanged.

However, the inconsistency still matters because:

1. A throwing `inspect` callback breaks the chain unexpectedly
2. The throw propagates RAW (no `toError` normalization), unlike all other callback methods
3. Users coming from other methods expect callback throws to at least be normalized via `toError`

The fix should wrap callback in try/catch and rethrow via `toError(e)` for consistency with the other 8 callback methods. The return value stays `Result<T, E>` (returning `this` in the catch block too).

**Verdict:** Keep as issue. Fix is wrapping callback in try/catch + `throw toError(e)`.

## A.4 `Err()` throws TypeError (corrected analysis)

**First pass claim:** "The ONLY constructor that validates its argument at runtime by throwing. All other `Err*` constructors normalize."

**Re-evaluation:** This is correct, but I didn't analyze the tradeoff properly. The `Err()` function's type signature is `Err<T, E extends Error>(error: E)`. TypeScript should prevent passing non-Error values at compile time if the user has proper type annotations. However:

- Users coming from JavaScript or loosely-typed code pass strings
- The TypeScript type check can be bypassed with `as any` or `@ts-expect-error`
- The runtime TypeError happens in production, not at compile time

So this is a RUNTIME safety net for a compile-time type failure. The fix (normalize instead of throw) would make the library more forgiving at the cost of making `Err()` behave differently from its type signature.

**Verdict:** Keep as issue. Recommend normalize instead of throw.

---

# B. New Findings

## B.1 `or()` and `orElse()` Create Unnecessary Ok Allocations

**Location:** `src/result-methods.ts` lines 190, 208

**Problem:** Both `or()` and `orElse()` create a brand new `Ok` result via `ok(this.ok as T)` instead of returning `this` when the result is already `Ok`. This allocates 19 new method function objects, runs `Object.assign` 19 times, and calls `Object.freeze` on every call — even when no transformation is needed.

```typescript
// In or():
if (this.isOk()) return ok(this.ok as T); // OK path: allocates new Result

// In orElse():
return ok(this.ok as T); // OK path: allocates new Result
```

Compare with `and()`:

```typescript
// In and():
if (this.isOk()) return result; // returns the argument, no allocation
```

The `and()` method correctly avoids allocation in the hot path.

**Why it's not trivially fixable:** The return types are `Result<T, F>` where `F` may differ from `E`. Returning `this` (typed as `R extends Result<T, E>`) may not be assignable to `Result<T, F>` when `E !== F` due to method signatures in `ResultMethods<T, E>` vs `ResultMethods<T, F>`.

**Impact:** LOW. For typical usage (few Result objects), the allocation is negligible. For hot loops or high-throughput scenarios, this creates unnecessary GC pressure.

**Fix:** Either:

1. Accept the allocation — current behavior
2. Add a fast-path `return this` when `E === F` — but TypeScript can't verify this at compile time
3. Restructure the method to avoid the allocation — would need type system changes

## B.2 No Runtime Brand Checking (`isResult`)

**Location:** Entire codebase

**Problem:** There is no way to check if an arbitrary value is a `Result` at runtime. `Result` is a type alias (`OkState | ErrorState`), not a class. There is no `Symbol.hasInstance`, no brand field, no `isResult()` helper.

```typescript
import { Ok, type Result } from "lib-result";

const value: unknown = Ok(42);

// None of these work:
value instanceof Result; // Error: 'Result' only refers to a type
typeof value === "Result"; // "object" — useless
value.__proto__; // plain object, no brand
```

**Why it matters:**

1. **Library interoperability:** Other libraries consuming arbitrary values can't detect Results
2. **Defensive programming:** Users can't verify return values in generic code
3. **TypeScript `unknown` handling:** Casting from `unknown` to `Result` is unsafe without a runtime check
4. **Serialization round-trip:** JSON.parse of serialized Results can't be verified
5. **Rival comparison:** `neverthrow` has no brand check either, but `vultix-ts-results` has `Result.isResult()`

**Impact:** MEDIUM for library consumers who need runtime type discrimination. LOW for typical usage within a single codebase.

**Potential approaches:**

1. Add a non-enumerable `Symbol.for("lib-result/Result")` brand to the frozen object in `compose()`
2. Export an `isResult(value: unknown): value is Result<unknown, Error>` type guard
3. Add a `_brand?: never` field to the public type (nominal typing trick — only helps TypeScript)

**Note:** `neverthrow` and most other TS Result libraries have the same limitation. This is not unique to lib-result.

## B.3 `Object.freeze` is Shallow — Values Can Mutate Internally

**Location:** `src/mixins.ts` line 12

```typescript
function compose<T>(base: T, ...fns: ((obj: T) => T)[]) {
  return Object.freeze(fns.reduce((obj, fn) => fn(obj), base));
}
```

**Problem:** `Object.freeze` is shallow. It prevents reassignment of `result.ok` and `result.error`, but if the contained value is a mutable object, its internals can still be mutated:

```typescript
const result = Ok({ name: "Alice", data: [1, 2, 3] });
result.ok.name = "Bob"; // WORKS — object is not frozen
result.ok.data.push(4); // WORKS — array is not frozen
result.ok = { name: "Eve" }; // TypeError (in strict mode) — frozen property
```

**Why this matters:**

1. **False sense of immutability:** Users may assume `Ok(x)` makes everything immutable
2. **Debugging surprises:** "I thought `result.ok` couldn't change"
3. **Caching issues:** If Results are used as Map keys or compared, mutations to values cause subtle bugs

**Impact:** MEDIUM. This is a common JavaScript pitfall. Most JS developers understand shallow freezing, but the library's Rust-inspired design might lead users to expect deeper immutability (Rust enforces deep immutability by default).

**Mitigations:**

1. Document that freezing is shallow
2. Do NOT deep-freeze (performance cost, edge cases with non-extensible objects, frozen ancestors, etc.)
3. Accept the status quo (the library cannot enforce deep immutability without prohibitive cost)

## B.4 `createCustomError` Overwrites `message` via `Object.assign`

**Location:** `src/utils.ts` lines 85-88

```typescript
export function createCustomError<T extends KeyValue>(
  props?: CustomErrorProps<T>
): CustomError<T> {
  const error = new Error(props?.message || "Unknown Error");
  if (isKeyValue(props)) {
    return Object.assign(error, props) as CustomError<T>;
  }
  return error as CustomError<T>;
}
```

**Problem:** The `message` is set first via the `Error` constructor (`new Error(props?.message || "Unknown Error")`), then `Object.assign(error, props)` copies ALL properties from `props` to the error — including the `message` property itself. The `message` gets set TWICE: once in the constructor, once in the assign.

This is harmless because the second write overwrites with the same value. But:

1. If `props` contains a `name` property, it overrides `error.name` from `"Error"` to whatever `props.name` is
2. If `props` contains a `stack` property, it overrides the actual stack trace
3. If `props` contains a `message` that differs from `props?.message` (impossible but hypothetically if someone modifies `props` between the constructor call and the assign — also impossible since it's synchronous)

**Note:** The `Error` constructor accepts `message` as the first arg. But `props?.message` is read twice — once for the constructor argument, once in the assign. This is redundant but not a bug.

**Impact:** LOW. Only matters if users pass `name` or `stack` as custom properties, which would be unusual and arguably intentional.

## B.5 `withExpectErr` on Ok Sets `cause: undefined`

**Location:** `src/result-methods.ts` lines 59-68

```typescript
function withExpectErr<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    expectErr(this: R, message: string): E {
      if (this.isError()) return this.error as E;
      throw createCustomError({
        message,
        cause: this.error as E, // this.error is undefined on OkState!
      });
    },
  });
}
```

**Problem:** When `expectErr` is called on an Ok result, `this.error` is `undefined`. The code casts `this.error as E` (which is a lie — E extends Error, but the value is `undefined`), and passes it as `cause` to `createCustomError`. The resulting Error has `cause: undefined`.

```typescript
Ok(42).expectErr("Expected error");
// Throws: Error("Expected error") with cause: undefined
```

Compare with `expect()` on Err, which correctly passes the error as cause:

```typescript
Err(new Error("original")).expect("Failed");
// Throws: CustomError("Failed") with cause: Error("original") <- CORRECT
```

This is inconsistent. When `expectErr` is called on Ok:

- The thrown error should either NOT include a `cause` or include a meaningful cause
- Currently it adds `cause: undefined` which is useless and potentially confusing

**Impact:** LOW. The `cause: undefined` is harmless (accessing `cause` gives `undefined`), but it's inconsistent with `expect()` behavior and adds noise to serialized errors.

**Fix:** Either:

1. Omit `cause` when it would be `undefined`: `const cause = this.error; if (cause !== undefined) { ... cause ... }`
2. Always omit `cause` in `expectErr` (semantics are different: expectErr says "I expected an error, got success")

## B.6 JSDoc Bug in `deprecated.ts` — Wrong Method Name

**Location:** `src/deprecated.ts` line 43

```typescript
// Preferred usage
if (result.isErr()) {
  // <--- BUG: should be result.isError()
  console.error(result.error.message);
}
```

**Problem:** The JSDoc for the deprecated `isErr` function tells users to use `result.isErr()` — but the actual method is `result.isError()`.

**Impact:** TRIVIAL. The file is not exported or used. But it's misleading for anyone reading the source code.

**Fix:** Change `result.isErr()` to `result.isError()` in the JSDoc.

## B.7 `toError` Silently Drops Information for Non-Error, Non-String, Non-Object Values

**Location:** `src/utils.ts` lines 27-35

```typescript
export function toError(e: unknown): CustomError {
  if (e instanceof Error) return e;
  if (typeof e === "string") return new Error(e);
  if (isKeyValue(e)) return createCustomError<typeof e>(e);
  return new Error("Unknown error");
}
```

**Problem:** When `e` is a number, boolean, null, undefined, symbol, or bigint, `toError` returns `new Error("Unknown error")` with no trace of the original value. The information is lost.

```typescript
toError(42); // Error("Unknown error") — 42 is lost
toError(null); // Error("Unknown error") — null is lost
toError(Symbol("x")); // Error("Unknown error") — Symbol is lost
```

**Why it matters:** When `toError` is used in method catch blocks (via `throw toError(e)`), the original thrown value's information is lost if it's not an Error, string, or object. This can make debugging harder.

**Impact:** LOW. In practice, most thrown values in JavaScript are Error instances. Non-Error throws are rare. But when they happen, the error context is lost.

**Fix:** Use `String(e)` in the error message for non-normalized values: `new Error("Unknown error: " + String(e))`. This preserves a representation of the original value.

## B.8 No Tests for `inspect`/`inspectErr` Callback Throws

**Location:** `tests/result-api.test.ts`

**Test coverage gap:** There are tests for `inspect`/`inspectErr` happy paths (callback is called, returns same result). But there are NO tests for:

1. `inspect` callback throwing
2. `inspectErr` callback throwing
3. `inspect` callback throwing on Ok (chain continues or breaks?)
4. `inspectErr` callback throwing on Err

This is significant because the current implementation lets callback throws propagate RAW (no `toError` wrapping). This differs from every other callback method and is untested.

**Tests that exist:**

- `inspect` — callback runs for Ok, returns same result (tested) ✓
- `inspect` — callback does NOT run for Err (tested) ✓
- `inspectErr` — callback runs for Err, returns same result (tested) ✓
- `inspectErr` — callback does NOT run for Ok (tested) ✓

**Tests that are missing:**

- `inspect` — callback throws for Ok (NOT tested)
- `inspectErr` — callback throws for Err (NOT tested)
- `inspect` / `inspectErr` — exception propagates raw vs via toError (NOT tested)

## B.9 No Tests for `mapOr` / `mapOrElse` Callback Throws

**Location:** `tests/result-api.test.ts`

**Test coverage gap:** `mapOr` and `mapOrElse` both wrap their callbacks in try/catch (`throw toError(e)`), but there are no tests verifying this behavior.

**Tests that exist:**

- `mapOr` — Ok path returns mapped value ✓
- `mapOr` — Err path returns default ✓
- `mapOrElse` — Ok path returns mapped value ✓
- `mapOrElse` — Err path returns mapped error ✓

**Tests that are missing:**

- `mapOr` — callback throws on Ok (NOT tested)
- `mapOrElse` — callback throws on Ok (NOT tested)
- `mapOrElse` — callback throws on Err (NOT tested)

## B.10 No Integration Tests for Complex Mixed Chains

**Test coverage gap:** There are tests for simple chains (`map` then `map`, `andThen` then `andThen`), but no tests for complex mixed chains:

```typescript
// Missing test patterns:
Ok(5)
  .map(x => x * 2)
  .andThen(x => divide(x, 0))
  .orElse(err => Ok(0))
  .mapErr(e => new AppError(e.message))
  .inspect(x => console.log(x));
```

The tests exist for individual methods and simple 2-step chains, but multi-method integration is not tested end-to-end. This could miss interaction bugs between methods (e.g., `mapErr` changing error type then `andThen` failing due to type constraint).

## B.11 `mapErr` Return Type on Ok Path Returns `Result<T, U>` But Contains `Result<T, E>`

**Location:** `src/result-methods.ts` lines 154-164

```typescript
mapErr<U extends Error>(this: R, fn: (error: E) => U): Result<T, U> {
  try {
    if (this.isOk()) return ok(this.ok as T);
    //                    ^ This is Result<T, E>, but return type is Result<T, U>
    return err(fn(this.error as E));
  } catch (e) {
    throw toError(e);
  }
}
```

**Problem:** On the Ok path, `ok(this.ok as T)` returns `OkState<T, E>` (the original error type E). But the declared return type is `Result<T, U>` (the NEW error type U). If `E != U`, the returned type at runtime is `Result<T, E>` while the compile-time type says `Result<T, U>`.

This works because:

- `OkState<T, E>` is structurally `{ ok: T, error: undefined }` regardless of `E`
- `OkState<T, U>` is structurally `{ ok: T, error: undefined }` regardless of `U`
- TypeScript structural typing accepts `OkState<T, E>` as `OkState<T, U>` since `undefined` is compatible with any `U extends Error`

Wait — is `OkState<T, E>` assignable to `OkState<T, U>` when `E !== U`? Let me think...

`OkState<T, E>` has `error: undefined` (literal type). `OkState<T, U>` has `error: undefined` (literal type). The generic parameters E and U don't affect the property types of OkState — `error` is always literal `undefined`, not `E` or `U`.

For the inherited methods, `ResultMethods<T, E>` vs `ResultMethods<T, U>` — when checking assignability of `OkState<T, E>` to `OkState<T, U>`, TypeScript checks method compatibility. A method `andThen(fn: (value: T) => Result<U, E>): Result<U, E>` would need to be assignable to `andThen(fn: (value: T) => Result<U, U>): Result<U, U>`.

In TypeScript, with `strictFunctionTypes: true` (which the tsconfig has), function parameter types are checked contravariantly. But `andThen`'s `fn` parameter type `(value: T) => Result<U, E>` vs `(value: T) => Result<U, U>` — the parameter types (`value: T`) are the same, so this direction is fine. The return type is covariant. So `andThen` returning `Result<U, E>` must be assignable to `andThen` returning `Result<U, U>`. For this, `Result<U, E>` must be assignable to `Result<U, U>`.

`Result<U, E> = OkState<U, E> | ErrorState<E, U>`. `Result<U, U> = OkState<U, U> | ErrorState<U, U>`.

For `ErrorState<E, U>` to be assignable to `ErrorState<U, U>`: `error` property must be `E` (or a subtype of `U`) and `ok` must be `undefined` in both. So `E` must be assignable to `U`. This is NOT guaranteed.

So technically, `OkState<T, E>` is NOT always assignable to `OkState<T, U>` when `E !== U`, because the method signatures on `ResultMethods` may differ.

BUT — at RUNTIME, the `ok(this.ok as T)` returns a value whose methods are the SAME regardless of what TypeScript says about type parameters. The `E` and `U` type parameters only exist at compile time. So the code works correctly at runtime despite the type-level mismatch.

Actually, the `as` cast in `ok(this.ok as T)` — the return type of `ok` is `OkState<T, E>` (inferred from the `Ok` function signature). The return type of `mapErr` is `Result<T, U>`. So there's a type mismatch if `E !== U`.

In practice, TypeScript seems to accept this because:

1. `ok(this.ok as T)` returns `OkState<T, E>` (captured from the closure)
2. The `return` statement is implicitly cast to `Result<T, U>` by TypeScript
3. TypeScript sees that `OkState<T, E>` is structurally similar to `OkState<T, U>` and allows the implicit cast
4. OR — TypeScript doesn't check this deeply because `E` and `U` are both `extends Error` and the literal `undefined` property makes them compatible

Actually, let me re-verify by looking at how TypeScript handles this. The `ok` function in the closure is typed as:

```typescript
ok: <T, E extends Error = Error>(ok: T) => OkState<T, E>;
```

When called as `ok(this.ok as T)`, `T` is inferred from `this.ok as T`, and `E` is inferred from... hmm, what is E here? In the `mapErr` method, `this` is `R extends Result<T, E>` where `E` is the ORIGINAL error type (before mapping). The `ok` function is called with no explicit type parameters, so `E` defaults to `Error` from the function signature `ok: <T, E extends Error = Error>(ok: T) => OkState<T, E>`.

Wait, that's wrong. `E` would be inferred, not defaulted. The `Ok` function has signature `<T, E extends Error = Error>(ok: T) => OkState<T, E>`. When called as `ok(this.ok as T)`, TypeScript needs to infer both `T` and `E`. `T` is inferred from the argument as `T` (the method's type parameter). `E` cannot be inferred from the argument (since `ok` takes only `ok: T`), so it defaults to `Error`.

So `ok(this.ok as T)` returns `OkState<T, Error>`, NOT `OkState<T, E>`. This means the return type of `mapErr`'s Ok path is `OkState<T, Error>`, which TypeScript then checks assignability to `Result<T, U>`.

`OkState<T, Error>` has `error: undefined`. `Result<T, U>` is `OkState<T, U> | ErrorState<U, T>`. `OkState<T, Error>` is assignable to `OkState<T, U>` because:

- `error: undefined` matches `error: undefined`
- Method compatibility: `ResultMethods<T, Error>` vs `ResultMethods<T, U>` — this could potentially fail but TypeScript typically doesn't check method body compatibility in detail for implicit casts.

Actually, I realize this analysis is going too deep into type theory. The practical point is: **the runtime behavior is correct** but the type safety depends on TypeScript's structural type system and implicit coercion. The `ok(this.ok as T)` call creates a new `OkState` with the original error type `E`, but the return type is `Result<T, U>` with the mapped error type. This type mismatch is hidden by TypeScript's structural typing.

**Impact:** LOW. Works correctly at runtime. TypeScript allows it.

## B.12 The `mapErr` Ok path uses `ok(this.ok as T)` with defaulted Error type

As noted above, `ok(this.ok as T)` in mapErr returns `OkState<T, Error>` (because E defaults to Error), not `OkState<T, E>`. This means even if the original error type E is a specific subclass like `DivisionError`, the Ok result from mapErr's Ok path has the generic `Error` type, not `E`. This is an information loss at the type level.

However, at runtime, the value inside `ok` is `this.ok` which IS of type `T`. The error type parameter `E` in `OkState<T, E>` is just a phantom type — it doesn't exist at runtime. So there's no data loss.

## B.13 `methodsArray` Capture of `Err` and `Ok` Prevents Monkey-Patching

**Location:** `src/mixins.ts` line 51

```typescript
const methodsArray = createResultMethods({ err: Err, ok: Ok });
```

The `methodsArray` is created at module evaluation time. The closures inside each method installer capture the `Err` and `Ok` function references. If someone later reassigns the exported `Err` or `Ok` functions (via `import * as result from "lib-result"; result.Err = ...`), the captured references in methods remain unchanged.

This is generally desirable (predictable behavior) but could surprise users who attempt to intercept Result construction by monkey-patching.

**Impact:** LOW. Monkey-patching ES modules is hard to do correctly anyway.

## B.14 `compose` Type Inference Through `reduce` May Lose Type Information

**Location:** `src/mixins.ts` lines 11-13

```typescript
function compose<T>(base: T, ...fns: ((obj: T) => T)[]) {
  return Object.freeze(fns.reduce((obj, fn) => fn(obj), base));
}
```

**Problem:** The `reduce` callback has type `(obj: T, fn: (obj: T) => T) => T`. Each `MethodInstaller` is `<T, E, R extends Result<T, E>>(base: R): R`, which is more specific than `(obj: T) => T`. TypeScript's inference must align the generic function's type parameters with the specific `T` from `compose`.

The first call to `reduce` with `base = { ok: value, error: undefined }` infers `T` as that specific object type. Then each subsequent installer function must accept `T` (which is growing via `Object.assign` in each prior installer).

In practice, TypeScript handles this through:

1. The intersection types from `Object.assign` (each method installer adds to `R`)
2. The generic function type alignment

The resulting type of `compose(...)` is `T`, which is the original base object type PLUS all the method types added via `Object.assign`. TypeScript should correctly infer the final type as an intersection of the base type and all method signatures.

Wait — `reduce` returns `T`, not an intersection. Because `T` is the accumulator type and each fn returns `T`, TypeScript doesn't accumulate the types through the reduce. The result type is `T`, where `T` was inferred from the initial `base` value.

This means the compose function's return type is just the type of the initial `base` object — `{ ok: T, error: undefined }` or `{ ok: undefined, error: E }`. The methods added via `Object.assign` are present at runtime but NOT represented in the TypeScript type from `compose`.

But the callers of `compose` cast the result:

```typescript
function Ok<T, E extends Error = Error>(ok: T): OkState<T, E> {
  return compose({ ok, error: undefined } as OkState<T, E>, ...methodsArray);
}
```

The `as OkState<T, E>` cast tells TypeScript the result is an `OkState<T, E>`, which extends `ResultMethods<T, E>`. The cast is the authoritative type information — TypeScript trusts it. So the return type is correct for callers, but the `compose` function's own type doesn't track the method additions.

**Impact:** LOW. The `as` casts in each constructor provide correct type information to callers. The `compose` helper's internal type inference doesn't need to be precise because the callers override it with casts.

## B.15 `Object.assign` in Method Installers Creates New Method Functions Each Time

**Location:** `src/result-methods.ts` — every `return Object.assign(base, { methodName: ... })` pattern

**Finding:** Each time a MethodInstaller function is called (which happens for EVERY Result object), it creates a NEW function for the method. For a single `Ok(42)` call, 19 new function objects are created.

```typescript
// Each call to withUnwrap creates a new unwrap function:
function withUnwrap<T, E extends Error, R extends Result<T, E>>(base: R): R {
  return Object.assign(base, {
    unwrap(this: R): T | never {
      // NEW function object every time
      if (this.isOk()) return this.ok as T;
      throw this.error as E;
    },
  });
}
```

**Impact:** MEDIUM for high-throughput scenarios. Each Result construction requires:

- 1 object for the base data
- 19 function objects for methods
- 19 `Object.assign` calls
- 1 `Object.freeze` call
- 1 `Array.reduce` pass over 19 functions

For typical usage (tens or hundreds of Results), this is negligible. For hot loops with thousands of Results per frame, this creates measurable GC pressure.

**Comparison with class-based approach:**

- Classes: Methods live on prototype (ONE copy). Instance creation is just property assignment.
- Current approach: Methods are assigned to each instance individually (19 copies per instance).

The current approach was a deliberate design choice to avoid class coupling and enable the `Object.freeze` immutability pattern. It trades memory/performance for immutability.

**Potential optimization:** Since all methods are pure (they only depend on `this.ok` and `this.error`), they could be shared via a prototype or a shared methods object. But `Object.freeze` prevents this because the object is frozen before user code sees it.

## B.16 `ResultMethods` Interface Has `unwrap(): T` But Didn't Use `never` Return for ErrorState

**Location:** `src/types.ts` line 206

```typescript
unwrap(): T;
```

In the `ResultMethods` interface, `unwrap` returns `T` for both `OkState` and `ErrorState`. But for `ErrorState`, `T` is `undefined` (since `ErrorState<E, T>` subtypes with `ok: undefined`). The implementation:

```typescript
unwrap(this: R): T | never {
  if (this.isOk()) return this.ok as T;
  throw this.error as E;
}
```

The return type `T | never` simplifies to `T` (since `never` is the bottom type and `T | never` ≡ `T`). The `never` indicates that this path always throws.

The interface declares `unwrap(): T` without `never`. This is fine for callers — TypeScript knows that `unwrap` can throw (the JSDoc documents it). But it's a minor documentation gap in the interface.

## B.17 `draft.md` Shows an Unimplemented Feature

**Location:** `draft.md` (root of project)

**Content:** Proposes generic-preserving wrappers:

```typescript
const api = wrap(axios.get);
const y = api<Todo>("https://...");
```

**Status:** This is NOT implemented. The current `wrap` function doesn't preserve type parameters from the wrapped function. The draft shows the user is considering adding this feature.

**Relevance:** If implemented, this would add:

- `wrapWithGeneric<T, A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => Result<R, CustomError>`
- `wrapAsyncWithGeneric<T, A extends unknown[], R>(fn: (...args: A) => Promise<R>): (...args: A) => Promise<Result<R, CustomError>>`

This would be a significant new feature that enables type-safe wrapping of generic functions like `axios.get<T>()`.

## B.18 `Number of Error Constructors` Is a Design Tradeoff, Not a Defect

**First pass claim:** "Four ways to create errors — cognitive overload."

**Re-evaluation:** This is a design tradeoff, not a defect. Each constructor serves a distinct JS use case:

| Constructor                   | Use Case                  | Input          | Normalization                 |
| ----------------------------- | ------------------------- | -------------- | ----------------------------- |
| `Err(new MyError(...))`       | Custom error classes      | Error instance | None (validates)              |
| `ErrFromText("msg")`          | Quick string errors       | string         | `new Error(msg)`              |
| `ErrFromObject({code, info})` | Structured metadata       | object         | `Object.assign(Error, props)` |
| `ErrFromUnknown(catchValue)`  | Catch block normalization | unknown        | Intelligent dispatch          |

The alternative (one function with overloads, as in neverthrow) would reduce surface area but lose the explicit naming that guides users to the right constructor. The four-name approach is more JavaScript-idiomatic for a library that prioritizes explicitness.

**Verdict:** Not a defect. Document the tradeoff but do not change.

## B.19 `as const` on `createResultMethods` Return Array

**Location:** `src/result-methods.ts` line 282

```typescript
return [
  createWithAnd({ err }),
  // ... 18 more entries
] as const;
```

The `as const` makes the array a readonly tuple. This means the array's length and element types are preserved at the type level. The `readonly MethodInstaller[]` return type (from the function signature) already implies readonly. The `as const` adds tuple-level type preservation (TypeScript knows exactly which installer is at which index) but this information is unused because the callers (`compose` and `mixins`) iterate over the array without indexing.

**Impact:** TRIVIAL. The `as const` provides marginally better type inference but doesn't affect the API.

## B.20 `withIsError` and `withIsOk` Are Simple Property Checks

```typescript
isError(this: R): this is ErrorState<E, T> {
  return this.error !== undefined;
}
isOk(this: R): this is OkState<T, E> {
  return this.error === undefined;
}
```

These use `undefined` comparison as the discriminant. This is correct because:

- `OkState.error` is always `undefined` (literal type)
- `ErrorState.error` is always an `Error` instance (never `undefined` by construction)

**Edge case:** What if someone constructs an object that looks like a Result but has a different structure? Since the library controls all construction, this is not a concern. Users who construct `{ ok, error }` objects manually are not using the library's Result type.

---

# C. Architecture Observations

## C.1 Method Attachment Pattern

The library uses a "mixins via Object.assign" pattern rather than classes. Here's the full chain:

```
Caller -> Ok(value) or Err(error)
  -> compose(base, ...methodsArray)
    -> reduce starting with base = { ok, error }
      -> 19 × Object.assign(base, { methodName: fn })
    -> Object.freeze(final result)
```

This is a **composable mixin** pattern. Each `MethodInstaller` function adds one method. The advantages:

- No class hierarchy
- Each method is independently removable (if needed in the future)
- The object is frozen, preventing mutation
- Every Result has its own method instances (no shared mutable state)

The disadvantages:

- 19 function allocations per Result
- No inheritance/extensibility
- Cannot use `instanceof` checks

## C.2 Import Chain is Clean

```
index.ts
  -> main.ts       (wrap functions, depends on mixins.ts + types.ts)
  -> mixins.ts     (constructors, depends on result-methods.ts + types.ts + utils.ts)
    -> result-methods.ts  (method implementations, depends on types.ts + utils.ts)
      -> types.ts  (no deps)
      -> utils.ts  (depends on types.ts)
```

No circular dependencies. Clean separation:

- `types.ts` — pure type definitions (no runtime code)
- `utils.ts` — utility functions (Error normalization)
- `result-methods.ts` — method Factory functions
- `mixins.ts` — Result constructors, ties methods + data together
- `main.ts` — wrap functions, depends on constructors
- `index.ts` — public API barrel

## C.3 Memory and Performance Profile

Per `Ok(value)` or `Err(error)` call:

| Operation                      | Count                                             | Notes                                                                                                          |
| ------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Plain objects created          | 20 (1 data + 19 method objects via Object.assign) | Object.assign upgrades the same base object, but each call creates a new property descriptor object internally |
| Function objects created       | 19 (one per method)                               | Each method installer creates a new function                                                                   |
| Object.assign calls            | 19                                                | Sequential on the same target                                                                                  |
| Object.freeze calls            | 1                                                 | At the end                                                                                                     |
| Array.reduce iterations        | 19                                                | Over methodsArray                                                                                              |
| Property read/write operations | ~38                                               | Each Object.assign writes 1 property, reads the target                                                         |

For 1000 Result objects: ~19,000 function objects, ~19,000 Object.assign calls.

This is acceptable for most applications but worth noting for performance-sensitive contexts.

---

# D. Fresh Insights

## D.1 `match` Exhaustiveness Is Not Enforced

```typescript
match<U>(matchers: {
  okFn: (value: T) => U;
  errFn: ((error: E) => U) | (() => U);
}): U
```

Both `okFn` and `errFn` must be provided. TypeScript enforces that both branches exist — you can't forget one. The return type `U` is unified from both branches.

However, exhaustiveness enforcement depends on TypeScript's structural type checking. The `matchers` object must have exactly `okFn` and `errFn` — but since it's an object with structural typing, a user could pass extra properties:

```typescript
result.match({
  okFn: value => value.toString(),
  errFn: error => "error",
  extraProp: "unused", // TypeScript doesn't error on this
});
```

This is standard TS behavior (excess property checking only happens for fresh object literals in specific positions). Not a lib-result issue.

## D.2 No `Thenable` / `Promise`-like Behavior

The Result objects do not implement `.then()`, meaning they are not "thenable." This is deliberate — it prevents accidental `await` on a synchronous Result:

```typescript
const result = Ok(42);
await result; // awaits... Ok(42) is not thenable, so returns Ok(42) wrapped in Promise
```

Since `await` on a non-thenable value just wraps it in a resolved Promise, `await result` is harmless but semantically wrong. The lack of `then()` makes this an obvious mistake rather than a silent bug.

Compare with neverthrow's `Result` which is also not thenable. This is the correct design.

## D.3 `unwrapErr` Error Message for Complex Values

```typescript
throw new Error(`Received an Ok value '${this.ok}' instead of an Error`);
```

If `this.ok` is an object: `Received an Ok value '[object Object]' instead of an Error`
If `this.ok` is a function: `Received an Ok value 'function foo() { ... }' instead of an Error`

For complex values, the string representation via template literal may be unhelpful. Using `JSON.stringify(this.ok)` or `util.inspect(this.ok)` would be more informative but adds complexity and dependencies.

**Impact:** TRIVIAL. Error messages in misuse cases (unwrapping Ok as error) don't need to be perfect.

## D.4 `wrapAsync` signature accepts `() => Promise<T>` not `() => T | Promise<T>`

```typescript
export async function wrapAsync<T>(
  callback: () => Promise<T>
): Promise<Result<T, CustomError>> {
```

The callback must return a `Promise<T>` directly. If the user passes `() => T` (synchronous), TypeScript would error because `T` is not assignable to `Promise<T>` (unless `T` includes `Promise`). But at runtime, `await` on a non-Promise value just wraps it. So the runtime would work, but TypeScript prevents it.

This is good — it forces users to be explicit about sync vs async.

## D.5 `wrapAsyncThrowable` Type Inference for Args

```typescript
export function wrapAsyncThrowable<T, Args extends unknown[] = []>(
  callback: Callback<Args, Promise<T>>
): Callback<Args, Promise<Result<T, CustomError>>> {
```

The `Args` generic type should be inferred from the callback argument types. This works for simple cases:

```typescript
const fn = wrapAsyncThrowable(async (x: number, y: string) => {
  return x + parseInt(y);
});
// fn: (x: number, y: string) => Promise<Result<number, CustomError>>
```

But type inference for `Args` can be fragile with complex callbacks (overloads, generics, rest params). This is a common TypeScript challenge, not unique to lib-result.

## D.6 `ErrFromObject` Missing `message` Falls Back to "Unknown Error"

```typescript
export function createCustomError<T extends KeyValue>(
  props?: CustomErrorProps<T>
): CustomError<T> {
  const error = new Error(props?.message || "Unknown Error");
```

If `ErrFromObject({ code: 500 })` is called without a `message`, the error message becomes "Unknown Error." This is consistent with `createCustomError()` called without props.

```typescript
const err = ErrFromObject({ code: 500 });
err.error.message; // "Unknown Error"
err.error.code; // 500
```

This is documented behavior but could surprise users who expect the message to be optional and default to something more descriptive.

---

# E. Summary of Corrections and Additions

## E.1 Corrections from First Pass

| First Pass Claim                              | Second Pass Correction                                  |
| --------------------------------------------- | ------------------------------------------------------- |
| `mapOr` parameter order is a behavioral issue | It's a deliberate Rust alignment, document as tradeoff  |
| `match` errFn `() => U` is misleading         | It's standard TS — functions with fewer params are fine |
| Four error constructors = cognitive overload  | It's a valid design tradeoff for explicitness           |

## E.2 New Findings

| #    | Finding                                                  | Severity | File:Line        |
| ---- | -------------------------------------------------------- | -------- | ---------------- |
| B.1  | `or`/`orElse` allocates new Ok unnecessarily             | LOW      | rm:190,208       |
| B.2  | No `isResult` runtime brand check                        | MEDIUM   | (missing)        |
| B.3  | `Object.freeze` is shallow                               | MEDIUM   | mixins:12        |
| B.4  | `createCustomError` overwrites message via assign        | TRIVIAL  | utils:85-88      |
| B.5  | `expectErr` on Ok sets `cause: undefined`                | LOW      | rm:63-64         |
| B.6  | JSDoc bug: `result.isErr()` should be `result.isError()` | TRIVIAL  | deprecated:43    |
| B.7  | `toError` drops info for primitives                      | LOW      | utils:34         |
| B.8  | Missing tests: `inspect`/`inspectErr` callback throws    | MEDIUM   | tests            |
| B.9  | Missing tests: `mapOr`/`mapOrElse` callback throws       | LOW      | tests            |
| B.10 | Missing: complex mixed-chain integration tests           | MEDIUM   | tests            |
| B.11 | `mapErr` Ok path has type mismatch E vs U                | LOW      | rm:157           |
| B.13 | Method closures prevent monkey-patching                  | TRIVIAL  | mixins:51        |
| B.14 | `compose` reduce loses intermediate types                | TRIVIAL  | mixins:11-13     |
| B.15 | 19 function allocations per Result                       | MEDIUM   | rm (all methods) |
| B.17 | `draft.md` shows unimplemented generic wrappers          | NOTE     | draft.md         |
| B.20 | `isError`/`isOk` use simple `undefined` check            | OK       | rm:93-104        |

## E.3 Verification of First Pass Claims

| First Pass Claim                      | Second Pass Verification    |
| ------------------------------------- | --------------------------- |
| 17 Result methods                     | ✓ Confirmed: 19 (corrected) |
| 3 error systems                       | ✓ Confirmed                 |
| 8 callback throw escape points        | ✓ Confirmed                 |
| `inspect`/`inspectErr` lack try/catch | ✓ Confirmed                 |
| `Err()` throws TypeError              | ✓ Confirmed                 |
| `andThen` error type is fixed         | ✓ Confirmed                 |
| `src/deprecated.ts` is dead code      | ✓ Confirmed                 |
| No aggregation helpers                | ✓ Confirmed                 |
| No `AsyncResult` type                 | ✓ Confirmed                 |

_(rm = src/result-methods.ts, mixins = src/mixins.ts, utils = src/utils.ts)_
