# Spec: Pinned-error mode for `wrapThrowable` / `wrapAsyncThrowable`

Status: ready-for-agent
Spec source: session synthesis (grilling complete, ADR 0001 accepted)

## Problem Statement

A TypeScript developer using lib-result wraps functions that may throw with
`wrapThrowable` / `wrapAsyncThrowable`. Today those wrappers always report the
error side as `CustomError`, which resolves to plain `Error`. The developer
cannot tell the wrapper "this function throws my domain error type" without
either losing argument inference or spelling out every generic parameter —
including the argument tuple — by hand. The zero-argument wrappers (`wrap`,
`wrapAsync`) already accept a custom error type; the Throwable variants lag
behind, so downstream narrowing via `match()` / `isError()` against precise
domain errors is impossible on wrapped throwing functions.

## Solution

Both Throwable wrappers gain a **pinned-error mode**: passing exactly one
explicit type argument pins the error type while everything else stays
inferred — `wrapThrowable<MyError>(fn)` yields a wrapper returning
`Result<T, MyError>`. Calling with no type arguments keeps today's behavior
exactly (**inferred mode**, error side defaults to `CustomError`). The change
is purely type-level: runtime wrapping behavior is untouched. Shape and
rationale are recorded in ADR 0001.

## User Stories

1. As a TypeScript consumer, I want to pin the error type of a synchronously
   wrapped throwing function with a single explicit type argument, so that
   downstream `match()` / error narrowing works against my domain errors.
2. As a TypeScript consumer, I want the same pinned-error mode on asynchronously
   wrapped throwing functions, so that async pipelines get identical precision.
3. As a TypeScript consumer, I want pinned-error mode to keep inferring the
   success type from the callback's return, so that I never restate what the
   compiler already knows.
4. As a TypeScript consumer, I want pinned-error mode to keep inferring the
   argument tuple from the callback's parameters, so that calls through the
   returned wrapper stay fully type-checked.
5. As a TypeScript consumer, I want inferred mode (no explicit type arguments)
   to compile exactly as it does today, so that upgrading is a no-op for
   existing call sites.
6. As a TypeScript consumer with a zero-argument callback, I want a pinned
   error type to bind as the *error* type — never silently as the success
   type — so that the nullary edge case cannot mislead me.
7. As a TypeScript consumer, I want the success-type override pattern on the
   *returned* wrapper (overriding at the call site of the wrapped result) to
   keep working unchanged, so that existing axios-style wrappers survive.
8. As a TypeScript consumer, I want runtime behavior unchanged — thrown values
   still funneled through the existing unknown-error constructor — so that
   pinned-error mode is purely a typing affordance with no behavioral risk.
9. As a TypeScript consumer reading editor hints, I want JSDoc on both
   wrappers showing both modes, so that I discover pinned-error mode without
   leaving my editor.
10. As a library maintainer, I want the change to be additive overloads only,
    so that nothing that compiles today stops compiling.
11. As a library maintainer, I want tests covering both modes on both
    wrappers, so that overload-ordering regressions get caught immediately.
12. As a library maintainer, I want the work shipped as a conventional `feat`
    commit, so that release-please proposes a minor bump and I control the
    release manually after verification.
13. As a maintainer reading history, I want the design rationale in ADR 0001
    and the vocabulary in the project glossary, so that future contributors
    don't relitigate the overload decision.
14. As a consumer across module systems, I want the overloads present in the
    built type declarations for all resolutions, so that ESM/CJS/Bun consumers
    see identical ergonomics.

## Implementation Decisions

- Both Throwable wrappers become two-overload functions per ADR 0001: the
  pinned-error overload is declared first, the inferred-mode overload second.
  Fall-through mechanics give correct binding in both modes and prevent the
  nullary misbind (story 6).
- Pinned-error mode contract: exactly one explicit type argument; it must
  extend `Error` and pins the error side. Success type and argument tuple are
  always inferred from the callback signature.
- Inferred-mode contract: zero explicit type arguments; error side defaults to
  `CustomError`, matching the precedent set for the zero-argument wrappers.
- Returned shapes stay callback-shaped with the same success/error structure
  as today, which is what keeps the returned-wrapper override pattern (story 7)
  working without changes.
- One implementation signature sits behind the two public overloads; runtime
  bodies are untouched. This is a types-only change.
- Scope is limited to the two Throwable wrappers. The zero-argument wrappers
  intentionally keep their current single-signature shape; retrofitting them
  is a separate future decision.
- Release mechanics: implementing agent ships a conventional `feat(core):`
  commit; release-please handles versioning. The agent does NOT bump versions
  — the maintainer releases manually after verification.
- Vocabulary: this spec uses glossary terms (wrapper family, inferred mode,
  pinned-error mode) as defined in the project glossary; ADR 0001 is
  authoritative for the overload-shape rationale.

## Testing Decisions

- Good tests here assert only externally observable facts: which call shapes
  compile (and which are rejected), and what the wrapper returns at runtime.
  No introspection of internals.
- Single seam: the package's public exports — the same seam the existing suite
  uses (tests import from built output). No new seams.
- Prior art: the custom-error tests added for the zero-argument wrappers live
  in the main result test suite and set the style; negative type cases in the
  suite use `@ts-expect-error` sentinels.
- Coverage matrix: both wrappers × {inferred mode, pinned-error mode};
  nullary-callback pinning binds the error type (not success); regression test
  that the returned-wrapper success-type override still compiles; runtime
  parity checks (success path, thrown-Error path) confirming behavior is
  unchanged.
- Verification commands: format check + full test run (which builds first) +
  coverage run. Additionally, per the task's definition of done, a compile
  check against an external dummy project executed with Bun.

## Out of Scope

- Retrofitting the zero-argument wrappers with pinned-error mode.
- Any runtime behavior change, new error constructors, or changes to
  `CustomError` semantics.
- Version bumping or cutting a release (maintainer does this manually).
- README / docs-site overhaul beyond JSDoc updates.

## Further Notes

- Escape hatch from the original task constraints: if the overload strategy
  fails to satisfy full inference during implementation, revert entirely
  rather than ship forced generics.
- Definition of done: an inferred-mode call compiles with zero explicit
  generics; a one-type-argument call pins the error without spelling the
  argument tuple; the entire existing suite passes including the
  returned-wrapper override case; verified against the external dummy project.
- Companion artifacts already on disk: ADR 0001 and the project glossary.
