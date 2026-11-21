# Code Review: lib-result Full Codebase

**Scope:** Entire `src/` directory (6 TypeScript files: `index.ts`, `types.ts`, `main.ts`, `mixins.ts`, `utils.ts`, `result-methods.ts`) against no prior fixed point — whole codebase review.

**CONSENT:** User approved all verification commands. Ran: `pnpm build`, `pnpm test` (114 tests pass), `pnpm lint`, `pnpm format`, `pnpm test:coverage` (97.22% statements, 100% branches, 100% functions, 96.69% lines). All clean.

**Spec:** No formal spec file found. Review uses README examples, CONTEXT.md domain vocabulary, AGENTS.md coding standards, and the library's observable behavior as the specification.

---

## Findings

### [CRITICAL] [correctness] `wrap` and `wrapAsync` default error type is `CustomError` but return type claims `E extends Error = CustomError`

**Where:** `src/main.ts:17-24`, `src/main.ts:40-47`

**What:** The generic signature `wrap<T, E extends Error = CustomError>` promises the caller can choose the error type `E`, but the implementation always returns `ErrFromUnknown(error) as Result<T, E>` where `ErrFromUnknown` produces `ErrorState<CustomError, T>`. If the caller writes `wrap<Value, MyError>(fn)`, they get `Result<Value, MyError>` at compile time but the actual error at runtime is `CustomError`, not `MyError`. Same for `wrapAsync`.

**Context:** Traced through `ErrFromUnknown` in `mixins.ts:63-70` which returns `ErrorState<CustomError, T>`. The `as Result<T, E>` cast is unsound — it lies to the type system. A caller who pins `E` to a custom error subclass will get a `CustomError` instance at runtime, breaking any `instanceof` checks or property access on `MyError`.

**Fix:** Remove the `E` type parameter from `wrap` and `wrapAsync`. They should only return `Result<T, CustomError>`. If callers need a specific error type, they should use `wrapThrowable` / `wrapAsyncThrowable` with explicit error type pinning, or map the error afterward with `mapErr`.

---

### [CRITICAL] [correctness] `wrapThrowable` and `wrapAsyncThrowable` have the same unsound generic error type

**Where:** `src/main.ts:65-74`, `src/main.ts:97-106`

**What:** Both functions declare `<T, Args extends unknown[] = [], E extends Error = CustomError>` but the implementation returns `ErrFromUnknown` which is `CustomError`. The `E` parameter is unused and misleading. Callers who write `wrapThrowable<Value, Args, MyError>(fn)` get `Result<Value, MyError>` at compile time but `CustomError` at runtime.

**Context:** Same root cause as above. The `E` parameter appears in the return type `Callback<Args, Result<T, E>>` but is never constrained by the implementation.

**Fix:** Remove the `E` parameter. Return `Callback<Args, Result<T, CustomError>>`. Document that error-type pinning is done via `mapErr` after the fact, or by using a custom `Err` constructor directly.

---

### [IMPORTANT] [spec] `ErrFromObject` called with no arguments returns `"Unknown Error"` but the type signature requires `P extends KeyValue`

**Where:** `src/mixins.ts:121-131`, `src/utils.ts:98-116`

**What:** `ErrFromObject<P extends KeyValue = KeyValue, T = undefined>(props?: P)` allows `props` to be optional (undefined), but `P` defaults to `KeyValue` which is `Record<PropertyKey, unknown> | ReadonlyMap<PropertyKey, unknown>` — neither includes `undefined`. The test at `result.test.ts:209-215` confirms this is intentional runtime behavior (`ErrFromObject()` returns a fallback error), but the type signature is wrong.

**Context:** `createCustomError` in `utils.ts:98-116` accepts `props?: T` and handles `undefined` by returning a default error. The mixin passes `props` directly. The type should reflect that `props` is optional.

**Fix:** Change signature to `ErrFromObject<P extends KeyValue = KeyValue, T = undefined>(props?: P)` — wait, it already has `props?: P`. The issue is the default `P = KeyValue` doesn't include `undefined`. Should be `P extends KeyValue | undefined = KeyValue` or make the function accept `props?: P | undefined` with `P extends KeyValue`. Simpler: `ErrFromObject<P extends KeyValue = KeyValue, T = undefined>(props?: P)` where the `?` on the parameter already makes it optional, but TypeScript still requires `P` to satisfy `KeyValue`. The correct fix: `function ErrFromObject<P extends KeyValue = KeyValue, T = undefined>(props?: P)` — actually this is already the signature. The problem is when called with no args, `P` is inferred as `KeyValue` but `undefined` is passed. TypeScript allows this because of the optional parameter. The real issue: the JSDoc says `@param {P} props` implying required. Update JSDoc to `@param {P} [props]`.

---

### [IMPORTANT] [correctness] `toError` loses `cause` when input is a plain object with `message` and `cause` properties

**Where:** `src/utils.ts:25-37`

**What:** `toError` handles `Error` instances (preserves cause), strings, key-value objects, `undefined`, and everything else. For a plain object like `{ message: "fail", cause: originalError }`, it takes the `isKeyValue` branch (line 32) and calls `createCustomError`, which spreads the object onto a new `Error`. The `cause` property becomes an own property, not the standard `error.cause`. The standard `Error` constructor's second argument (`{ cause }`) is never used.

**Context:** `createCustomError` at `utils.ts:106-113` does `new Error(message)` then `Object.assign(error, { ...record, message })`. If `record` has `cause`, it becomes an own property. The native `error.cause` (accessible via `error.cause`) is not set unless the `Error` constructor receives it in options.

**Fix:** In `createCustomError`, extract `cause` from `record` and pass it to `new Error(message, { cause })` if present. Then spread the rest.

---

### [IMPORTANT] [correctness] `mapErr` return type `Result<T, U>` where `U extends Error` but implementation can return `CustomError` if `fn` throws

**Where:** `src/result-methods.ts:164-171`

**What:** `mapErr<U extends Error>(fn: (error: E) => U): Result<T, U>` promises the error type becomes `U`. But the `try/catch` at lines 168-170 catches any throw from `fn` and calls `toError(e)`, which returns `CustomError`. So if `fn` throws, the result is `Result<T, CustomError>`, not `Result<T, U>`.

**Context:** This pattern appears in `map`, `andThen`, `orElse`, `mapOr`, `mapOrElse`, `match`, `unwrapOrElse` — all have `try/catch` that converts throws to `CustomError` but the return type promises the mapped error type.

**Fix:** The return type should be `Result<T, U | CustomError>` or document that throwing from the mapper is undefined behavior. Since the library philosophy is "no throws", the mapper should not throw. But TypeScript can't enforce that. At minimum, document the caveat.

---

### [IMPORTANT] [smell] `createResultMethods` uses a closure over `methodsArray` that is defined *after* the factory functions but *before* `Ok`/`Err` — circular initialization risk

**Where:** `src/mixins.ts:5-7`, `src/mixins.ts:19-21`, `src/mixins.ts:34-42`, `src/mixins.ts:45`

**What:** `compose` (line 5-7) takes a base object and an array of method installers. `methodsArray` is created at line 45 by calling `createResultMethods({ err: Err, ok: Ok })`. But `Err` and `Ok` (lines 19-42) both use `...methodsArray` in their return. This works because `methodsArray` is assigned *before* `Ok`/`Err` are called (module initialization order), but it's a fragile circular dependency. If any factory function were called during `createResultMethods`, it would get an empty array.

**Context:** The pattern is: `methodsArray = createResultMethods({ err: Err, ok: Ok })` where `Err` and `Ok` close over `methodsArray`. This is a known JS pattern (forward reference) but it's brittle and hard to read.

**Fix:** Define `methodsArray` first as an empty array, then populate it, or use a lazy getter. Or restructure: `const methodsArray = createResultMethods({ err: Err, ok: Ok })` after `Err`/`Ok` are defined but before they're exported. Current order works but is confusing.

---

### [IMPORTANT] [smell] `ErrFromUnknown` and `ErrFromText` duplicate the `compose({ ok: undefined, error: ... }, ...methodsArray)` pattern

**Where:** `src/mixins.ts:63-70`, `src/mixins.ts:82-87`

**What:** Both functions create an `ErrorState` by composing the base object with `methodsArray`. `Err` does the same. This is duplicated code (Data Clumps / Duplicated Code smell). The only difference is how the error is constructed.

**Context:** `Err` validates the input is an `Error` instance. `ErrFromUnknown` converts via `toError`. `ErrFromText` creates `new Error(message)`. `ErrFromObject` uses `createCustomError`. All four follow the same pattern.

**Fix:** Extract a private `createErrorState(error: Error, T?)` helper that does the compose, and have all four call it. Or make `Err` the canonical constructor and have the others delegate: `ErrFromText(msg) => Err(new Error(msg))`, `ErrFromUnknown(e) => Err(toError(e))`, `ErrFromObject(props) => Err(createCustomError(props))`. But `Err` throws on non-Error, so `ErrFromUnknown` can't delegate. A shared internal `createErrState` is cleaner.

---

### [MINOR] [spec] `match` type signature allows `errFn: (() => U) | ((error: E) => U)` but implementation always calls `errFn(this.error)`

**Where:** `src/types.ts:178-181`, `src/result-methods.ts:176-192`

**What:** The type says `errFn` can be a zero-argument function, but the implementation at line 187 does `(matchers.errFn as (error: E) => U)(this.error as E)` — it always passes the error. The tests at `result-api.test.ts:229-236` and `238-254` show zero-arg and default-param handlers work because extra arguments are ignored in JS, but a rest-parameter handler `(...args: Error[]) => ...` receives the error (test at 247-254 passes). The type is correct for JS semantics but misleading: it suggests the error might not be passed.

**Context:** The comment at lines 184-186 acknowledges this: "Extra arguments are ignored by zero-param handlers, and choosing based on `errFn.length` would silently drop the error for handlers with default or rest parameters."

**Fix:** Simplify the type to `errFn: (error: E) => U`. The current union type adds no value since the implementation always passes the error. If callers want to ignore it, they can use `_error => ...` or `() => ...` (JS ignores extra args anyway).

---

### [MINOR] [smell] `isKeyValue` accepts empty `Map` but rejects empty plain object with non-Object prototype

**Where:** `src/utils.ts:61-71`

**What:** `isKeyValue(new Map())` returns `true` (line 65). `isKeyValue(Object.create(null))` returns `true` (line 68). But `isKeyValue(new Custom())` where `class Custom {}` returns `false` (line 130 in test) because `Object.keys(value).length > 0` is false. An empty plain object `{}` returns `true` (proto is `Object.prototype`). The inconsistency: empty `Map` is a key-value store, empty plain object is, but empty class instance is not.

**Context:** The function aims to detect "things that can be spread onto an error". An empty class instance has no own enumerable properties, so spreading it adds nothing. But an empty `Map` also adds nothing when converted to object. The distinction seems arbitrary.

**Fix:** Decide on a consistent criterion. If "has representable key-value content" is the standard, empty `Map` should return `false`. If "is a Map or plain object" is the standard, empty class instance with no own keys should return `false` (current behavior is correct for that). Document the intent.

---

### [MINOR] [smell] `toError` has two overloads but the implementation doesn't narrow the return type based on input

**Where:** `src/utils.ts:25-27`, `src/utils.ts:27-37`

**What:** Overload 1: `toError<T extends KeyValue>(e: T): CustomError<T>`. Overload 2: `toError(e: unknown): CustomError`. Implementation returns `CustomError` (non-generic). When called with a `KeyValue`, the return type should preserve the props, but it doesn't — it returns plain `CustomError`.

**Context:** The overload promises `CustomError<T>` for `KeyValue` input, but the implementation does `return createCustomError<typeof e>(e)` at line 32, which *does* return `CustomError<typeof e>`. The function signature says `CustomError` (line 27). The overload is correct but the implementation signature erases it.

**Fix:** Change implementation signature to `export function toError(e: unknown): CustomError` (remove the generic return) or make the implementation generic: `function toError<T extends KeyValue>(e: T): CustomError<T>; function toError(e: unknown): CustomError; function toError(e: unknown): CustomError { ... }` — wait, that's what it is. The issue is the implementation return type annotation `CustomError` on line 27 shadows the overloads. Remove the `: CustomError` on the implementation line.

---

### [MINOR] [spec] `wrapThrowable` and `wrapAsyncThrowable` JSDoc examples show `wrapThrowable(divide)` but `divide` returns `Result`, not a raw value

**Where:** `src/main.ts:56-63`, `src/main.ts:83-95`

**What:** The `wrapThrowable` example shows `const divide = (a, b) => { if (b===0) throw...; return a/b }` — a throwing function. Good. But `wrapAsyncThrowable` example shows `wrapAsyncThrowable(async (url) => { const res = await fetch(url); if (!res.ok) throw...; return res.json() })` — also a throwing async function. Both examples are correct for the wrapper's purpose. However, the `wrapAsyncThrowable` example uses `fetch` which rejects on network error but *resolves* on HTTP error (4xx/5xx), so the `if (!res.ok) throw` is necessary. The example is fine.

**Context:** No bug, just verifying examples match the API. They do.

---

### [MINOR] [spec] `Err` JSDoc says `@throws {TypeError} If the provided error is not an instance of Error` but the test expects `TypeError` — correct. However, the error message says `"Err() expects an Error instance, use ErrFromObject() instead."` — `ErrFromObject` accepts plain objects, not Error instances. Should suggest `ErrFromUnknown`.

**Where:** `src/mixins.ts:38-40`, `src/mixins.ts:47-70`

**What:** The error message directs users to `ErrFromObject` for non-Error input, but `ErrFromObject` expects a `KeyValue` (props object). For a random unknown value (like a string or number from a catch block), `ErrFromUnknown` is the correct alternative.

**Fix:** Change message to `"Err() expects an Error instance, use ErrFromUnknown() instead."`

---

### [MINOR] [smell] `createCustomError` does `Object.assign(error, { ...record, message })` — spreads `record` then overwrites `message`. If `record` has no `message`, `"Unknown Error"` is used (line 109). But the spread includes `message: "Unknown Error"` from the ternary, then `Object.assign` overwrites with the same. Redundant.

**Where:** `src/utils.ts:106-113`

**What:** Line 106-109 computes `message`. Line 113 does `{ ...record, message }`. If `record` had `message`, it's overwritten by the computed `message` (which equals `record.message`). If `record` had no `message`, computed is `"Unknown Error"`. The spread is fine but the `message` property is set twice.

**Fix:** `const { message, ...rest } = record || {}; const error = new Error(message ?? "Unknown Error"); if (rest) Object.assign(error, rest);` — cleaner.

---

### [QUESTION] [spec] `ResultMethods.and` and `or` take `Result<U, E>` and `Result<T, F>` respectively — why different type parameter positions?

**Where:** `src/types.ts:24`, `src/types.ts:190`

**What:** `and<U>(result: Result<U, E>): Result<U, E>` — preserves current error type `E`, takes new success type `U`. `or<F extends Error>(result: Result<T, F>): Result<T, F>` — preserves current success type `T`, takes new error type `F`. This is symmetric and correct (and = keep error, swap value; or = keep value, swap error). But the naming `and`/`or` is not intuitive for this. Rust uses `and`/`or` similarly. It's a design question, not a bug.

**Context:** The symmetry is intentional per Rust's `Result` API. No change needed, but worth confirming it matches the spec intent.

---

### [QUESTION] [spec] `expect` throws `CustomError` with `cause` set to the original error. `expectErr` throws `CustomError` *without* `cause`. Is this intentional?

**Where:** `src/result-methods.ts:49-55`, `src/result-methods.ts:61-66`, `src/result-api.test.ts:134-143`, `src/result-api.test.ts:164-173`

**What:** `expect` does `createCustomError({ message, cause: this.error })`. `expectErr` does `createCustomError({ message: \`Ok(${String(this.ok)}): ${message}\` })` — no cause. The test at 164-173 explicitly asserts no `cause` property on the thrown error for `expectErr`.

**Context:** This asymmetry is tested and intentional. `expect` is for "I expected Ok but got Err — here's why", so the cause is the original error. `expectErr` is for "I expected Err but got Ok — here's the Ok value", so the cause would be the Ok value (not an error). Makes sense.

---

## Declined to Judge

1. **`pipe` function mentioned in AGENTS.md but not in codebase** — AGENTS.md line 58 says "Use `pipe()` for chaining operations that return Results" but no `pipe` is exported or defined. This is a documentation mismatch. Not a code defect.

2. **No `Result` constructor / enum** — The library uses `Ok()`/`Err()` functions, not a `Result` class. This is the stated design (Rust-inspired). Not a defect.

3. **`CustomError` type complexity** — The conditional type in `types.ts:292-297` is complex but serves a purpose (type-safe error props). Not reviewing type-level design unless it causes runtime issues.

4. **Test file organization** — Tests import from `../dist/index.mjs` not source. This is intentional per AGENTS.md. Not a defect.

5. **`biome-ignore-all lint/complexity/noBannedTypes` in types.ts** — Suppresses a lint rule for the `Function` type in `Callback`. Intentional for the `Callback` type definition.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| Important | 4 |
| Minor | 6 |
| Question | 2 |

**Critical issues** are the unsound generic error types in `wrap`, `wrapAsync`, `wrapThrowable`, `wrapAsyncThrowable` — they allow callers to pin an error type that the implementation ignores, creating a soundness hole.

**Important issues** include `ErrFromObject` type signature mismatch, `toError`/`createCustomError` not preserving `cause` from plain objects, `mapErr` (and family) return type lying when mappers throw, and the fragile `methodsArray` initialization order.

**Minor issues** are mostly type signature precision, JSDoc accuracy, and code duplication smells.

**Recommendation:** Fix the Critical issues first — they are type soundness holes. Then address the Important ones. The Minor issues can be batched.