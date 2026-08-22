---
status: accepted
---

# 0001 — Overloads give wrapThrowable/wrapAsyncThrowable an error-type generic

TypeScript fills generic type lists positionally, so inserting `E` into the existing single
signature `<T, Args extends unknown[]>` would force any caller who wants a custom error type
to also spell out the success type and the argument tuple
(`wrapThrowable<number, MyErr, [number, number]>`), breaking inference-first ergonomics.
We decided to give each of `wrapThrowable` and `wrapAsyncThrowable` two overloads: a
pinned-error overload `<E extends Error, T, Args extends unknown[]>` declared first, followed
by an inferred-mode overload `<T, Args extends unknown[]>`. Calls with no explicit type
arguments fall through the first overload (its `E` is uninferable) into full inference; a
single explicit type argument pins `E` while everything else stays inferred. Declaring the
pinned overload first also prevents a nullary callback from silently misbinding a pinned `E`
as `T`.

## Considered Options

- **Single signature `<T, E extends Error = CustomError, Args extends unknown[] = []>`** —
  rejected: reaching `E` positionally requires spelling `T` and `Args`, the exact failure
  mode the requirement forbids.
- **Single signature `<E extends Error = CustomError, T = unknown, Args ...>`** — rejected:
  only legal by defaulting `T` to `unknown`, which weakens inference for every caller.

## Consequences

- Additive change; ships as a minor release.
- `wrap`/`wrapAsync` intentionally keep their single signatures — their zero-argument
  callbacks never competed for inference, so overloads would add nothing there. Retrofitting
  them for symmetric ergonomics is a separate decision.
