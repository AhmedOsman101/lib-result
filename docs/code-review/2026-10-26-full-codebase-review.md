# Code Review: lib-result — whole codebase

- **Date:** 2026-10-26
- **Reviewer:** SeniorReviewer
- **Scope:** Whole tracked codebase at HEAD `c2a0228` (`main`). Fixed point at review start was `97e3ba2`; the author committed `c2a0228` ("simplify pre-commit hook") mid-review, touching only `.husky/pre-commit` — that diff is reviewed and reflected below. Covered: all of `src/` (6 files), all of `tests/` (4 files), `package.json`, all 5 tsconfigs, `tsup.config.ts`, `vitest.config.ts`, `biome.json`, `.husky/pre-commit`, both GitHub workflows, `release-gh.sh`, release-please config/manifest, README, CONTEXT.md, ADR 0001, targeted greps of the wiki. Untracked local files (`src/drafts/*`, `draft.md`, `.scratch/`, `.fallow`) are out of scope.
- **Commits:** whole-tree review (no range)
- **Spec:** `docs/plans/result-rust-alignment-plan.md`, `docs/plans/result-roadmap.md`, `docs/adr/0001`, wiki `API-Details.md` (README:L252 declares the wiki "the main source for up-to-date documentation"), `CONTEXT.md`
- **Standards:** `AGENTS.md`, `biome.json`, `tsconfig.json`

## Consent

| Command                                               | Status                                                                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm exec vitest run`                                | approved, run — 98/98 passed, "Type Errors no errors"                                                                          |
| `pnpm typecheck` (tsc + tsup + attw)                  | approved, run — attw: "No problems found", 🟢 on node10 / node16 CJS / node16 ESM / bundler                                    |
| `pnpm lint`                                           | approved, run — "Checked 21 files. No fixes applied."                                                                          |
| `pnpm exec tsc` on a /tmp snippet                     | approved under "pnpm exec for things installed in package.json", run                                                           |
| throwaway repros importing `dist/` and `src/utils.ts` | approved under "pnpm dlx / pnpm exec for anything else", run with **Bun** per user directive                                   |
| `pnpm format`                                         | approved but **not run** — it executes `biome check --fix` and would mutate the tree under review; report-only discipline wins |
| adding tests to the suite                             | pre-authorized by the user; not needed — all findings provable via /tmp repros                                                 |

Mid-review the author fixed two pre-commit hook defects (`pnpm audit --fix` + `pnpm install` + auto-`git add` of the lockfile on every commit; and `pnpm --filter=client typecheck`, which matched no package — `pnpm --filter=client typecheck` printed "No projects matched the filters" and exited 0, so the hook's type gate never typechecked anything). Both are fixed in `c2a0228`; they are recorded here as resolved, not as active findings.

## Summary

Small, well-documented Rust-`Result` port; 98 tests green, lint clean, `attw` packaging check green on all four resolution modes. Three Important findings: `createCustomError` ships errors whose `message` is not a string (its own guard anticipates this and then clobbers its own fallback), the shipped CJS bundle is never executed by any test, and the README's TypeScript example does not compile against the library's own types. The most load-bearing fact for the author: two of the Minor correctness findings were already flagged in this repo's own `docs/audit/second-pass.md` (§B.4, §B.5, §B.7) and remain unfixed in v6.

## Findings

### Important

#### F1 · [correctness] · Confirmed

**Where:** `src/utils.ts:L85-93` in `createCustomError`

**What:** The `typeof props.message === "string"` guard computes a `"Unknown Error"` fallback, then `Object.assign(error, props)` immediately clobbers it with the non-string value.

**Context:** Reachable from three public surfaces: `ErrFromObject(props)` (mixins.ts:L121-131), `ErrFromUnknown(value)` → `toError` (utils.ts:L32), and the `wrap*` family when a callback throws an object with a non-string `message`. The guard's own existence (L85-88) shows the non-string case was anticipated — the fallback is dead code for exactly the inputs it exists for. Previously flagged in `docs/audit/second-pass.md` §B.4 and still present in v6.

**Impact:** `Error.message` is a number or `null` — `err.message.toUpperCase()`, `expect(...).toThrow("...")` matching, and log interpolation all misbehave for callers who trusted the `message: string` convention of the library's own default error type.

**Evidence:**

```bash
$ bun /tmp/opencode/review-lib-result/repro3.ts
1 createCustomError({message: 404}) .message => 404 (type: number)
$ bun /tmp/opencode/review-lib-result/repro.mjs
1a ErrFromObject({message: 404, code: 404}).error.message
  => {"message":404,"type":"number","code":404}
1b ErrFromObject({message: null}).error.message
  => {"message":null,"type":"object"}
1c ErrFromUnknown({message: 404}).error.message
  => {"message":404,"type":"number"}
```

**Fix:** Force the computed message into the assigned props: `Object.assign(error, { ...props, message })` — other props survive, `message` is always the string the guard computed.

#### F2 · [correctness] · Confirmed

**Where:** `tests/` (all files) + `vitest.config.ts:L28` + `package.json:L23-28`

**What:** The shipped CJS artifact `dist/index.cjs` (the `require` condition of the `exports` map) is never imported by any test — zero runtime coverage for half the published package.

**Context:** Every test imports `../dist/index.js` (ESM); `grep -rn "\.cjs" tests/` is empty. `vitest` coverage `include: ["dist/index.js", "src/utils.ts"]` names only the ESM bundle. `attw --pack` validates **types** in all resolution modes (green) but never executes CJS code. A runtime smoke via `createRequire` confirms the CJS bundle _works today_ — so this is a regression-prone gap, not active breakage: any future change that breaks under CJS (e.g. a new `import.meta` use, a top-level await, a formatting shim regression) ships undetected. CI (`testing.yml:L19-23`) runs the same ESM-only suite.

**Impact:** CJS-only consumers (`require("lib-result")`, Jest's default transform, Electron main processes) hit breakage in production that the entire test suite cannot see.

**Evidence:**

```bash
$ grep -rn "\.cjs" tests/          # → no matches
$ bun /tmp/opencode/review-lib-result/repro2.mjs   # createRequire(dist/index.cjs)
3 CJS smoke => Ok chain: 2, isError: true, hasOk: function, hasWrap: function
```

**Fix:** Add one CJS smoke test — in a vitest file, `createRequire(import.meta.url)("../dist/index.cjs")`, assert `Ok(1).andThen(...)` chains, `ErrFromText("x").isError()`, and that all 9 exported values are functions — and let CI pick it up.

#### F3 · [correctness] · Confirmed

**Where:** `README.md:L122` (TypeScript example block)

**What:** `ErrFromObject<number, { code: number; info: string }>({...})` passes `number` as `P`, violating the `P extends KeyValue` constraint — the library's own README example does not compile against the library's own types.

**Context:** The real signature (mixins.ts:L121) is `ErrFromObject<P extends KeyValue = KeyValue, T = undefined>(props: P)` — the first type parameter is the **props type**, not a success type as the README implies. Verified with `pnpm exec tsc --ignoreConfig ...` on a snippet reproducing the README call verbatim. Secondary wrinkle surfaced by the same check: annotating `P` without a `message` key (e.g. `ErrFromObject<{ code: number; info: string }>`) makes the props argument reject `message` (`TS2353`) even though the docs say "A `message` property is used as the Error message" — so the corrected README form must include `message` in `P`. The wiki contains no `ErrFromObject<...>` generic examples (grep empty) — the defect is README-only; the README's JavaScript block (L237, inferred generics) is correct.

**Impact:** Any user who copies the TypeScript example hits a type error in their first five minutes and learns the generic order is the opposite of what the README shows.

**Evidence:**

```bash
$ pnpm exec tsc --ignoreConfig --noEmit --strict --target es2022 --module nodenext \
    --moduleResolution nodenext --skipLibCheck --esModuleInterop \
    /tmp/opencode/review-lib-result/readme-check.ts
readme-check.ts(11,33): error TS2344: Type 'number' does not satisfy the constraint 'KeyValue'.
readme-check.ts(19,33): error TS2339: Property 'code' does not exist on type 'Error & number'.
readme-check.ts(20,33): error TS2339: Property 'info' does not exist on type 'Error & number'.
readme-check.ts(25,3): error TS2353: Object literal may only specify known properties, and 'message' does not exist in type '{ code: number; info: string; }'.
```

**Fix:** Rewrite the README call as `ErrFromObject<{ message: string; code: number; info: string }>({ message: "Something went wrong", code: 123, info: "Custom" })`, or simply the inferred form the JS block already uses. Optionally tighten the signature to `P extends { message: string } & KeyValue` so the compiler enforces the documented `message` contract.

### Minor

#### F4 · [correctness] · Confirmed

**Where:** `src/result-methods.ts:L185-188` in `withMatch`

**What:** The `matchers.errFn.length === 0` arity heuristic silently calls zero-length error handlers with **no** argument, discarding the real error.

**Context:** Any errFn with a default parameter or rest params has `fn.length === 0`: `errFn: (e = fallback) => ...` receives `e = fallback` (the actual error is lost) and `errFn: (...args) => ...` receives zero args. Passing the error unconditionally is strictly better — 0-arg functions ignore extra arguments in JS, so the branch only creates the failure mode. The wiki documents "errFn can also handle no error parameter" (API-Details.md:L703-707) but not the loss case; the session skill doc's GOTCHA 9 documents the `fn.length` mechanism.

**Impact:** A user writing `match({ okFn, errFn: (e = "unknown") => e })` gets `"unknown"` while holding a real `Error` — silently, on the error path of a library whose pitch is safe error handling.

**Evidence:**

```bash
$ bun /tmp/opencode/review-lib-result/repro.mjs
3 match errFn default param
  => "saw: DEFAULT-NO-ERROR"        # real error was Err(new Error("REAL ERROR"))
3b match errFn rest params
  => "args.length: 0"
```

**Fix:** Delete the length check and always `return matchers.errFn(this.error as E)`.

#### F5 · [correctness] · Confirmed

**Where:** `src/result-methods.ts:L243` in `withUnwrapErr`

**What:** The diagnostic `` `Received an Ok value '${this.ok}' instead of an Error` `` throws `TypeError: Cannot convert a symbol to a string` when the Ok value is a Symbol — the intended message never surfaces.

**Context:** Template-literal interpolation throws on Symbols (`String()` does not). Confirmed alongside a BigInt control case that interpolates fine (`'42'`). Edge input, but `unwrapErr` is a panic-path diagnostic and this replaces it with an unrelated TypeError.

**Evidence:**

```bash
$ bun /tmp/opencode/review-lib-result/repro2.mjs
1 unwrapErr(Symbol) => TypeError: Cannot convert a symbol to a string
2 unwrapErr(BigInt) => Error: Received an Ok value '42' instead of an Error
```

**Fix:** Interpolate with `String(this.ok)`.

#### F6 · [correctness] · Confirmed

**Where:** `src/result-methods.ts:L59-69` in `withExpectErr`

**What:** On an Ok result, `expectErr` throws a `CustomError` carrying its own `cause: undefined` key, and the Ok value itself is dropped entirely.

**Context:** `throw createCustomError({ message, cause: this.error as E })` — on Ok, `this.error` is `undefined`, and `Object.assign` writes the key anyway (own property, value `undefined` — repro `hasCauseKey: true`). Rust's `expect_err` panics with `Ok(<value>): <msg>`, preserving the value in the diagnostic. Previously flagged in `docs/audit/second-pass.md` §B.5 and still present.

**Impact:** Debugging an unexpected `expectErr` throw yields `cause: undefined` and no trace of what the Ok value was.

**Evidence:**

```bash
$ bun /tmp/opencode/review-lib-result/repro.mjs
2 Ok(42).expectErr cause
  => {"message":"Expected error","hasCauseKey":true,"isOkValuePreserved":"not carried"}
```

**Fix:** Match Rust: `throw createCustomError({ message: `${message} (Ok value: ${String(this.ok)})` })`, or omit the `cause` key when the error is absent.

#### F7 · [correctness] · Confirmed

**Where:** `src/utils.ts:L27-35` in `toError`

**What:** Thrown values that are neither `Error`, `string`, nor key-value objects — numbers, Symbols, Dates, arbitrary class instances — collapse to `"Unknown error"` with no trace of the original value.

**Context:** `ErrFromUnknown(42)` / `(Symbol)` / `(new Date())` all produce errors whose `cause` is `undefined`; the original thrown value is unrecoverable (repro `originalLost: true` for Date). The JSDoc documents the fallback message, but the _data loss_ is silent. Previously flagged in `docs/audit/second-pass.md` §B.7. Note `isKeyValue` passes bare class instances (repro 3: `isKeyValue(new Foo()) === true`), so a `class Foo {}` throw is converted with zero properties copied — also total loss.

**Impact:** `wrap(() => { throw 42 })` yields `Error("Unknown error")` — the caller's thrown value cannot be logged, compared, or inspected; error triage is blind exactly when the code threw something unusual.

**Evidence:**

```bash
$ bun /tmp/opencode/review-lib-result/repro.mjs
4a ErrFromUnknown(42)      => {"message":"Unknown error"}
4b ErrFromUnknown(Symbol)  => {"message":"Unknown error"}
4c ErrFromUnknown(new Date()) => {"message":"Unknown Error","originalLost":true}
```

**Fix:** `new Error("Unknown error", { cause: e })` for the final fallback (and consider it for the object branch's non-string-message case) — `ErrorOptions` is available under `lib: es2022`.

#### F8 · [spec] · Confirmed

**Where:** `src/index.ts:L1-14` + `dist/index.d.ts:L430`

**What:** The wiki documents `OkState` and `ErrorState` as API types, but the package exports neither — consumers cannot import the shapes the documentation presents.

**Context:** Spec line, quoted: wiki `API-Details.md:L61-76` defines "#### OkState — `interface OkState<T, E extends Error = Error> extends ResultMethods<T, E>`" (and `ErrorState` likewise) as part of the documented API; README:L252: "See the lib-result Wiki … The wiki is the main source for up-to-date documentation." The built declaration exports only `CustomError`, `Err`, `ErrFromObject`, `ErrFromText`, `ErrFromUnknown`, `Ok`, `Result`, and the four `wrap*` functions — `tsup` emits `OkState`/`ErrorState` bodies (they appear in `dist/index.d.ts`) but without the `export` keyword.

**Impact:** A consumer typing a helper as `function expectsOk(r: OkState<number>)` — or narrowing via the documented interfaces — must resort to `Extract`/structural hacks.

**Evidence:** `grep -n "export" dist/index.d.ts` → single line L430, no `OkState`/`ErrorState`/`ResultMethods` in the export list.

**Fix:** Add `export type { OkState, ErrorState, ResultMethods, KeyValue, Callback }` to `src/index.ts` (tsup rolls the declarations already).

#### F9 · [smell] · Confirmed

**Where:** `vitest.config.ts:L28` + `package.json:L41`

**What:** Coverage is measured against the generated bundle `dist/index.js` (plus `src/utils.ts`), and the coverage script deletes the report it just generated (`rm -rf coverage`).

**Context:** Coverage on a build artifact means reported lines/branches shift with every tsup change and do not map to reviewable source; `mixins.ts`/`result-methods.ts`/`main.ts` are only measured through the bundle. The `test:coverage` script generates `text`/`html`/`lcov` reporters and then removes the directory — only the threshold pass/fail remains, and any human or agent inspecting coverage finds nothing. The threshold enforcement (80% across all four metrics) is the only part that works.

**Evidence:** `vitest.config.ts:L13-35` (`include: ["dist/index.js", "src/utils.ts"]`); `package.json:L41` `test:coverage": "pnpm build && vitest run --coverage; rm -rf coverage"`.

**Fix:** Set `coverage.include: ["src/**/*.ts"]` (the tests already transitively exercise those modules; add a couple of direct imports if `utils.ts` needs company) and either keep the report or drop the html/lcov reporters.

#### F10 · [smell] · Confirmed

**Where:** `.github/workflows/testing.yml:L19-23`

**What:** CI runs tests and coverage but never `pnpm lint` — the biome error-level rules are enforced only by the local husky hook on staged files.

**Context:** `biome.json` declares several `error`-level rules (`noImportCycles`, `useConst`, `noShadow`, …); `testing.yml` has exactly two run steps (`pnpm test`, `pnpm test:coverage`). A push that bypasses hooks (`--no-verify`, a WIP squash, a fork PR from a non-husky environment) lands lint regressions unchecked.

**Evidence:** workflow file contents (L1-23); no lint step present.

**Fix:** Add `pnpm lint` as a step before `pnpm test` in `testing.yml`.

#### F11 · [smell] · Confirmed

**Where:** `package.json:L37-40`

**What:** The `typecheck` script performs a full build (`tsc --noEmit && tsup && attw --pack .`) and `test`/`test:coverage` depend on it — the name promises a read-only check while it writes `dist/`.

**Context:** `pnpm typecheck` → "CLI Cleaning output folder" ×2, writes all four dist files, packs a tarball. Anyone running "typecheck" expecting no side effects gets a rewritten `dist/`; the husky hook's "Doing type checks..." step likewise runs the whole build on every commit. The build dependency itself is _required_ (tests import `dist/`), just mislabeled.

**Evidence:** `package.json:L38` `typecheck: tsc --noUnusedLocals false --noUnusedParameters false --noEmit && tsup && attw --pack .`; observed tsup/attw output under `pnpm typecheck`.

**Fix:** Rename the script to `build` and let `test`/`test:coverage` call `pnpm build` explicitly; keep a true `typecheck` (`tsc --noEmit` only) alongside.

#### F12 · [correctness] · Confirmed

**Where:** repository root (absent file) + `package.json:L4`

**What:** `package.json` declares `"license": "MIT"` but no LICENSE file exists — npm consumers and GitHub get no license text.

**Context:** `ls LICENSE*` finds nothing at the root; `files: ["dist"]` also means no license text ships in the tarball unless npm auto-includes it (it auto-includes only if present). MIT's redistribution terms require the license notice to accompany the software.

**Evidence:** `ls /home/othman/work/TS/lib-result/LICENSE*` → "no matches found".

**Fix:** Add the standard MIT license text as `LICENSE` at the root (npm includes it automatically).

#### F13 · [smell] · Confirmed

**Where:** `tests/result.test.ts:L341,L365` (duplicate names) and `L337` (temporary suppress)

**What:** Two tests share the name "catches promise rejections" inside the same describe block, and the axios `code` assertion relies on a `// @ts-expect-error temporary`.

**Context:** The two "catches promise rejections" tests assert different things (mock rejection vs. `Promise.reject` inside the callback) — the duplicate name makes test selection (`-t`) ambiguous and failure reports misleading. L337-338 suppresses the type error for `result.error?.code` where a `CustomError<{ code: string }>` narrowing would type it honestly; "temporary" has been in place since at least the Aug 22 revision.

**Evidence:** file read (L336-339, L341, L365).

**Fix:** Rename the second test ("catches a rejected promise inside the callback"); replace the suppress with a typed narrowing: `expect((result.error as CustomError<{ code?: string }>).code).toBe("ERR_BAD_REQUEST")`.

#### F14 · [smell] · Confirmed

**Where:** `release-gh.sh:L49-55`

**What:** The force-release path comments claim `gh release create` "triggers the workflow via 'release: published'" and "Binaries will be built and uploaded automatically" — no such workflow exists in this repository, and none ever has.

**Context:** `.github/workflows/` contains only `testing.yml` and `dependabot-auto-merge.yml`; `git log --all -- .github/` shows no release workflow at any commit and no deletions. So the force-release path creates a GitHub release and then nothing builds, uploads assets, or publishes to npm — the maintainer expecting automation gets silence.

**Evidence:** directory listing of `.github/workflows/`; `git log --diff-filter=D --name-only --oneline -- .github/` → empty.

**Fix:** Add a `release: published` workflow (build + `pnpm publish`), or correct the comments to state the publish step is manual.

#### F15 · [smell] · Confirmed

**Where:** `tsconfig.json:L30` + `tsconfig.tests.json:L6`

**What:** `"lib": ["es2022", "DOM"]` loads the full DOM global scope into a Node-targeted library, and test tsconfig sets `types: ["vitest/globals", "node"]` while vitest runs with `globals: false` and tests import explicitly.

**Context:** DOM lib leaks `document`/`window`/`fetch` typings into a library whose runtime is Node and browsers-by-bundle; nothing in `src/` uses DOM types. The `vitest/globals` types are dead given `globals: false` (vitest.config.ts:L6) and explicit imports in every test file (`tests/result.test.ts:L2`).

**Evidence:** config file contents; `grep -n "import.*vitest" tests/*.test.ts` shows explicit imports.

**Fix:** `"lib": ["es2022"]` (add DOM only when a consumer-facing type genuinely needs it); drop `vitest/globals` from `tsconfig.tests.json`.

### Question

#### F16 · [correctness] · shape Confirmed, impact needs author input

**Where:** `.github/workflows/dependabot-auto-merge.yml:L3,L11-13,L18,L23-30`

**What:** The auto-merge workflow's Dependabot path is likely dead (no `dependabot.yml` exists in the repo), and its only live path — `workflow_dispatch` — merges any PR by number with `contents: write`, while `pull_request_target` needlessly exposes secrets to fork-PR executions (the job-level `if` gates steps, and no untrusted code is checked out, so it is contained — but `pull_request` would be strictly safer).

**Context:** What I checked: `.github/` contains only `workflows/` with the two files above; `git log --all -- .github/` confirms no dependabot.yml was ever committed. Dependabot _version updates_ require `dependabot.yml`; without it the `github.actor == 'dependabot[bot]'` branch of the `if` can only fire for security-update PRs (if enabled repo-side). The `workflow_dispatch` branch accepts `inputs.pr_number` and runs `gh pr merge --auto --squash` unconditionally.

**Question:** Is branch protection configured on `main` with required status checks? If yes, the dispatch path only bypasses human review on an already-green PR; if no, any maintainer running this workflow merges untested code, and the dependabot path (should Dependabot be re-enabled) merges every dependency bump automatically.

**Fix:** Add `dependabot.yml` if Dependabot is intended (and restrict auto-merge to `version-update:semver-patch|minor` labels); drop `workflow_dispatch` or gate it; switch to `pull_request`.

## Declined to judge

- `wrap<T, E extends Error = CustomError>` — pinned `E` is a typing affordance; runtime error is whatever was thrown (a plain `Error` stays `Error` even when `E` is pinned narrower). Deliberate per ADR 0001 and spec user story 8 ("runtime behavior unchanged — thrown values still funneled through the existing unknown-error constructor — so that pinned-error mode is purely a typing affordance"). Verified consistent (repro 5: `instanceofDivisionError: false` with runtime name `Error`).
- Pinned-error overloads for `wrapThrowable`/`wrapAsyncThrowable` — spec'd and accepted (`docs/adr/0001`, `.scratch/wrap-throwable-error-generic/spec.md`, status `ready-for-agent`) but not yet implemented; pending work, not a defect.
- `Result.all` / `Result.any` — listed un-done in `docs/plans/result-rust-alignment-plan.md` ("10. `Result.all`", "11. `Result.any`", no Done marker); roadmap item, not a defect.
- `andThen` pins the error type to `E` (no mid-chain widening) — deliberate tradeoff, analyzed in `docs/audit/full-audit.md` §4.1.
- 19 own-property method closures per instance (spread/`console.log` leak functions; allocation cost) — deliberate architecture per AGENTS.md ("Composition over inheritance… mixed in via `Object.assign` on frozen plain objects"); second-pass §B.15 documents the cost.
- `Err()` throwing `TypeError` on non-Error — documented contract (mixins.ts JSDoc:L29, tests L86-89, full-audit §4.2).
- Eager `mapOr` default and eager `or()` argument — documented (`types.ts:L121-122` "The default is evaluated eagerly").
- `isError` vs Rust's `is_err` naming — documented convention (AGENTS.md naming table, full-audit §4.3).
- Aliasing asymmetry: `and` returns the passed-in instance, `or` on Ok re-wraps a fresh one — no observable impact on frozen, stateless results (repro 7a/7b).
- `src/drafts/*`, `draft.md`, `.scratch/`, `.fallow` — untracked local files (`git ls-files` empty); out of scope, but `src/drafts/` living under the source root is a future-confusion trap worth relocating when it is next touched.
- `docs/Comparison-*.md`, `docs/agents/*.md`, wiki FAQ/Home/Examples/Installation, CHANGELOG beyond the head, `dist/` bundle bodies, `pnpm-lock.yaml` — docs/process/lockfile, not reviewed line-by-line.
- Out-of-repo note: the session's `lib-result` skill doc (GOTCHA 11) claims frozen-field assignment "fails silently in strict mode" — Bun/ESM repro shows it **throws** `TypeError: Cannot assign to read only property 'ok'`. The skill doc should be corrected; not a repo defect.

## Unverified

| Id  | Claim                                       | Why unconfirmed                                                     | What would confirm it                                                                                              |
| --- | ------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| F16 | Whether merges are gated by required checks | Branch protection is a repo-admin setting, not visible from a clone | Repo settings → Branches, or `gh api repos/AhmedOsman101/lib-result/branches/main/protection` with maintainer auth |

Everything else was confirmed by execution (vitest, tsc, attw, biome, six Bun repros) or by direct static observation quoted above.

## Roll-up

| Axis        | Critical | Important      | Minor                   | Question |
| ----------- | -------- | -------------- | ----------------------- | -------- |
| correctness | 0        | 3 (F1, F2, F3) | 5 (F4, F5, F6, F7, F12) | 1 (F16)  |
| spec        | 0        | 0              | 1 (F8)                  | 0        |
| smell       | 0        | 0              | 6 (F9–F11, F13–F15)     | 0        |

**Coverage:** Full one-pass review — every tracked source, test, and config file read; verification executed within the approved budget; two prior-audit cross-references used to confirm still-open items (§B.4, §B.5, §B.7 of `docs/audit/second-pass.md`). No diff sampling; nothing was too large for one pass.

## Post-review addendum (2026-10-26, same day)

All 16 findings dispositioned after author triage; fixes verified at 114/114 tests on both ESM and CJS suites, source coverage 96.58% lines / 100% branches and functions, attw + biome clean.

| Id | Disposition |
| --- | --- |
| F1 | Fixed — `Object.assign(error, { ...props, message })` + regression test |
| F2 | Fixed — `tests/cjs-smoke.test.ts` (createRequire CJS surface + behavior parity) and `test:cjs` script |
| F3 | Fixed — README example now `ErrFromObject<{ message: string; code: number; info: string }>` |
| F4 | Fixed — `withMatch` always invokes `errFn(this.error)` + 2 tests (default/rest params) |
| F5 | Fixed — `String(this.ok)` in `unwrapErr` message + symbol test |
| F6 | Fixed — Ok value embedded in message (`Ok(<v>): msg`), no `cause` key + 2 tests |
| F7 | Fixed — `new Error("Unknown error", { cause: e })`; extended by author rulings: `undefined` input gets no `cause` key; `KeyValue` relaxed to `Record<PropertyKey, unknown> \| ReadonlyMap<PropertyKey, unknown>` — Maps accepted and normalized to fields, class instances with own enumerable fields merged, Date/Set route to the `cause` path; `isKeyValue` rewritten to match |
| F8 | Fixed — `OkState`, `ErrorState`, `ResultMethods`, `Callback` exported; `KeyValue` deliberately withheld |
| F9 | Fixed — dedicated `vitest.coverage.config.ts` runs the same suites against `src/` via alias; `rm -rf coverage` removed; reports kept |
| F10 | Fixed — `pnpm lint` step in `testing.yml` (and `release.yml`) |
| F11 | Resolved — tooling migrated tsup → tsdown 0.23.2; `typecheck` is now tsc-only |
| F12 | Fixed — MIT `LICENSE` added |
| F13 | Fixed — duplicate test renamed; `@ts-expect-error` replaced with typed cast |
| F14 | Fixed — real `.github/workflows/release.yml` (release: published → lint, test, npm publish with provenance, tarball upload; `workflow_dispatch` acts as dry-run); prerequisite `NPM_TOKEN` secret set 2026-10-26 |
| F15 | Fixed — `lib: ["es2022"]`; `vitest/globals` dropped |
| F16 | Resolved (author Option B) — **correction to this finding:** the Dependabot path was not dead. `dependabot_security_updates` is enabled repo-side (requires no `dependabot.yml`); the workflow ran 2026-10-21 (`pull_request_target`, branch `dependabot/npm_and_yarn/follow-redirects-1.16.1`, success in 11s) and PR #20 was merged by `app/github-actions` at 2026-10-21T18:51:24Z. Only the version-updates path was dead (`dependabot.yml` never existed). Resolution: `.github/dependabot.yml` created (npm weekly, minor+patch grouped; github-actions weekly); trigger narrowed `pull_request_target` → `pull_request`; `workflow_dispatch` merge path retained. The open branch-protection question is mooted by the author's acceptance of this design. |

Out-of-repo item resolved: the session `lib-result` skill doc's GOTCHA 11 corrected — frozen-field assignment **throws** `TypeError: Cannot assign to read only property 'ok'`, it does not fail silently.
