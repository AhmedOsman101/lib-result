# Changelog

## [6.1.0](https://github.com/AhmedOsman101/lib-result/compare/v6.0.0...v6.1.0) (2026-10-26)

### Features

* **types:** export `OkState`, `ErrorState`, `ResultMethods`, and `Callback` types for consumers who need to name state/method/callback shapes directly ([e5870a2](https://github.com/AhmedOsman101/lib-result/commit/e5870a2))
* **utils:** accept `Map` and class instances with own enumerable fields as key-value props in `ErrFromObject`/`ErrFromUnknown`, normalizing `Map` via `Object.fromEntries` ([5d64fec](https://github.com/AhmedOsman101/lib-result/commit/5d64fec))
* **tests:** add CommonJS smoke suite (`tests/cjs-smoke.test.ts`) and `pnpm test:cjs` script to verify `dist/index.cjs` behavior against the ESM build ([f0b4d38](https://github.com/AhmedOsman101/lib-result/commit/f0b4d38))
* **tests:** measure source modules instead of the dist bundle via dedicated coverage config; retain reports on disk ([a5c4491](https://github.com/AhmedOsman101/lib-result/commit/a5c4491))

### Bug Fixes

* **utils:** keep fallback `"Unknown Error"` when `props.message` is not a string in `createCustomError` ([5d64fec](https://github.com/AhmedOsman101/lib-result/commit/5d64fec))
* **utils:** preserve original thrown values via `Error` `cause` for non-Error/non-string/non-key-value inputs ([5d64fec](https://github.com/AhmedOsman101/lib-result/commit/5d64fec))
* **methods:** always pass the error to `errFn` in `match` instead of dropping it for zero-argument callbacks ([e385af3](https://github.com/AhmedOsman101/lib-result/commit/e385af3))
* **methods:** stringify `Symbol` `Ok` values correctly in `unwrapErr` error messages ([e385af3](https://github.com/AhmedOsman101/lib-result/commit/e385af3))
* **methods:** include the `Ok` value in `expectErr` message and stop attaching a bogus `cause: undefined` key ([e385af3](https://github.com/AhmedOsman101/lib-result/commit/e385af3))
* **tests:** rename duplicate test name "catches promise rejections" and replace a temporary `@ts-expect-error` with a typed cast ([afa75a2](https://github.com/AhmedOsman101/lib-result/commit/afa75a2))

### Documentation

* **readme:** correct the `ErrFromObject` generic example shape ([effc774](https://github.com/AhmedOsman101/lib-result/commit/effc774))
* **docs:** update build command and import paths to reflect `tsdown` and `dist/index.mjs` ([86977b5](https://github.com/AhmedOsman101/lib-result/commit/86977b5))
* **review:** add full codebase review report with post-review addendum documenting all findings and resolutions ([638c84f](https://github.com/AhmedOsman101/lib-result/commit/638c84f))

### Build & Tooling

* **build:** migrate from `tsup` to `tsdown` (Rolldown) with dual ESM/CJS outputs, declaration maps, shims, source maps, and `exports` generation ([fe32854](https://github.com/AhmedOsman101/lib-result/commit/fe32854))
* **build:** declare `engines.node >= 16.9.0` to reflect the `Error` `cause` option floor ([9acdcd7](https://github.com/AhmedOsman101/lib-result/commit/9acdcd7))
* **tsconfig:** drop `DOM` lib and stale `vitest/globals` types from test config ([51d62d0](https://github.com/AhmedOsman101/lib-result/commit/51d62d0))
* **lint:** upgrade Biome to `2.6.3` and scope its formatting to exclude Markdown/YAML ([6e859c4](https://github.com/AhmedOsman101/lib-result/commit/6e859c4))
* **license:** add MIT `LICENSE` file ([ff37d28](https://github.com/AhmedOsman101/lib-result/commit/ff37d28))

### CI/CD

* **ci:** enforce lint in the testing workflow ([a150876](https://github.com/AhmedOsman101/lib-result/commit/a150876))
* **ci:** add `release.yml` workflow to publish to npm on release with provenance, version verification, lint/test gates, and tarball upload ([94820bd](https://github.com/AhmedOsman101/lib-result/commit/94820bd))
* **ci:** add `dependabot.yml` for npm and GitHub Actions weekly updates; narrow auto-merge trigger to `pull_request` ([f723055](https://github.com/AhmedOsman101/lib-result/commit/f723055))
* **ci:** simplify husky pre-commit hook ([c2a0228](https://github.com/AhmedOsman101/lib-result/commit/c2a0228))
* **ci:** bump GitHub Actions versions in workflows ([73b8682](https://github.com/AhmedOsman101/lib-result/commit/73b8682))
* **deps:** bump follow-redirects from 1.16.0 to 1.16.1 ([83ceff8](https://github.com/AhmedOsman101/lib-result/commit/83ceff8))

### Dependencies

* **deps:** bump dependencies for security reasons ([97e3ba2](https://github.com/AhmedOsman101/lib-result/commit/97e3ba2))
* **deps:** update dependencies and add security overrides ([83e1e35](https://github.com/AhmedOsman101/lib-result/commit/83e1e35))
* **deps:** specify package manager version ([1817c46](https://github.com/AhmedOsman101/lib-result/commit/1817c46))
* **ci:** modify CI workflow to use pnpm and Node.js 24 ([b540318](https://github.com/AhmedOsman101/lib-result/commit/b540318))
* **ci:** add Dependabot auto-merge workflow ([eb7b7e4](https://github.com/AhmedOsman101/lib-result/commit/eb7b7e4))

### Documentation (pre-existing)

* **docs:** add design documentation for pinned-error mode ([7104249](https://github.com/AhmedOsman101/lib-result/commit/7104249))
* **docs:** add agent operational documentation ([665cc46](https://github.com/AhmedOsman101/lib-result/commit/665cc46))

### Other

* **chore:** rename `Readme.md` to `README.md` ([16ec51e](https://github.com/AhmedOsman101/lib-result/commit/16ec51e))

## [6.0.0](https://github.com/AhmedOsman101/lib-result/compare/v5.1.0...v6.0.0) (2026-08-12)

### ⚠ BREAKING CHANGES

- **core:** CustomError<T> no longer injects synthetic message? or cause?: unknown fields. The hover in editors is now 'Error & { ... }' with only the props the caller actually passed. External code that typed values as CustomError<{ ... }> will see a narrower type; add message/cause explicitly to your props type if needed.

### Code Refactoring

- **core:** simplify CustomError and ErrFromObject types ([9caf3a4](https://github.com/AhmedOsman101/lib-result/commit/9caf3a431bf87689809ef4a7cb20b5e3b4081fa8))

## [5.1.0](https://github.com/AhmedOsman101/lib-result/compare/v5.0.0...v5.1.0) (2026-08-05)

### Features

- **core:** allow custom error types in wrap functions ([a101d50](https://github.com/AhmedOsman101/lib-result/commit/a101d50484f46a8d5a23212e57d30aee0352d2b3))

### Bug Fixes

- **result:** wrap inspect callbacks and improve match logic ([ac8135b](https://github.com/AhmedOsman101/lib-result/commit/ac8135bcd76bfbe0377bcc3ba3880865124763f7))

## [5.0.0](https://github.com/AhmedOsman101/lib-result/compare/v4.0.0...v5.0.0) (2026-04-17)

### ⚠ BREAKING CHANGES

- **result:** `pipe(...)` has been removed in favor of `andThen(...)`. `orElse(...)` no longer returns a plain fallback value and now expects a callback that returns `Result<T, F>`. code using the old lazy fallback behavior must switch from `orElse(...)` to `unwrapOrElse(...)`.

### Features

- add `and` method to Result ([2a2602a](https://github.com/AhmedOsman101/lib-result/commit/2a2602a7330d068a36f376880d5edc1112809ecb))
- add expectErr method to Result ([7e12a5d](https://github.com/AhmedOsman101/lib-result/commit/7e12a5dea6b97275d473cf8c2c198afb51b12263))
- add inspect and inspectErr methods ([b6e26d1](https://github.com/AhmedOsman101/lib-result/commit/b6e26d128d354207883ebcd0bdd2c308c0a69377))
- add mapOr and mapOrElse methods ([d1675ee](https://github.com/AhmedOsman101/lib-result/commit/d1675ee8c60f0a5e07be65b497b60622c2366a9d))
- add unwrapErr method ([aa85bc4](https://github.com/AhmedOsman101/lib-result/commit/aa85bc46e5abf3af1f8d29c2664695aed7dd4b7d))
- **result:** add `or` and `orElse` methods ([39a3827](https://github.com/AhmedOsman101/lib-result/commit/39a38278e41d6b4bd812a50fc09f0da81513a2c5))
- **result:** align method names with Rust Result semantics ([a25285d](https://github.com/AhmedOsman101/lib-result/commit/a25285d7a489b880dc29166fd785f3b6b233ec17))

### Bug Fixes

- **deps:** rename mixins.ts to mixens.ts and update imports ([4ec96e7](https://github.com/AhmedOsman101/lib-result/commit/4ec96e7c96b7ee019ce369bc3b2bb08a74be290d))

## [4.0.0](https://github.com/AhmedOsman101/lib-result/compare/v3.2.2...v4.0.0) (2026-04-11)

### ⚠ BREAKING CHANGES

- map, pipe, match, and mapErr now throw toError(e) instead of returning Err(toError(e)) when their callbacks throw. This fixes the unsafe 'as U' / 'as E' casts that produced a Result with a mismatched runtime type.

### Features

- add mapErr method to Result ([69df83f](https://github.com/AhmedOsman101/lib-result/commit/69df83f7d7ca90581d8edcf5c4d52a493361d0ce))
- **release:** add force option to gh release ([4943273](https://github.com/AhmedOsman101/lib-result/commit/4943273b4f0537d48df01aaef3500e880b54d7e0))
- **types:** allow optional error in match errFn ([2fd204e](https://github.com/AhmedOsman101/lib-result/commit/2fd204e1ad78bb94e2c289aab8124a4395ee6e3f))

### Bug Fixes

- **mixins:** improve match error handling ([a365f9b](https://github.com/AhmedOsman101/lib-result/commit/a365f9b81c104fbc6bd3a4b26a34ee5e75595aae))
- propagate thrown errors instead of returning Err with fake type cast ([6b62ede](https://github.com/AhmedOsman101/lib-result/commit/6b62ede7531954c0d4161a29244588d01632ee35))

## [3.2.2](https://github.com/AhmedOsman101/lib-result/compare/v3.2.1...v3.2.2) (2026-04-11)

### Bug Fixes

- allow errFn in match to be called with no args ([ebd9dd4](https://github.com/AhmedOsman101/lib-result/commit/ebd9dd40efc5774a6d2a22acfa69007c14a50539))

## [3.2.0](https://github.com/AhmedOsman101/lib-result/compare/v3.1.1...v3.2.0) (2025-06-28)

### Features

- add errFromUnknown to create error result ([e80e524](https://github.com/AhmedOsman101/lib-result/commit/e80e524cb5cba745da5eda4d4a40296c69ae09b3))

## [3.2.0](https://github.com/AhmedOsman101/lib-result/compare/v3.1.1...v3.2.0) (2025-06-28)

### Features

- add errFromUnknown to create error result ([e80e524](https://github.com/AhmedOsman101/lib-result/commit/e80e524cb5cba745da5eda4d4a40296c69ae09b3))

## [3.1.0](https://github.com/AhmedOsman101/lib-result/compare/v3.0.0...v3.1.0) (2025-06-22)

### Features

- add `expect` method to Result API ([58570af](https://github.com/AhmedOsman101/lib-result/commit/58570af878f489300c0010e6e8aa48cf9016d7ed))
- add `match` method to Result API ([f296fdb](https://github.com/AhmedOsman101/lib-result/commit/f296fdb5233ee419c4e341c0362e5543e307b1cc))
- add `orElse` method to Result API ([9001261](https://github.com/AhmedOsman101/lib-result/commit/9001261fd67a48449a06a6311a92c2952c2e674e))
- add `unwrapOr` method to Result API ([411556f](https://github.com/AhmedOsman101/lib-result/commit/411556fa19274767a368788f9c95739f1a017ea3))
- add result mixins for Ok and Err functions ([6555147](https://github.com/AhmedOsman101/lib-result/commit/65551475a0930d68c400f592fdb6bd40cc680b28))

## [3.0.0](https://github.com/AhmedOsman101/lib-result/compare/v2.3.0...v3.0.0) (2025-06-20)

### ⚠ BREAKING CHANGES

- `isErr()`, `isOk()`, and `unwrap()` were removed from the top-level API. Any code using these must migrate to the instance-based alternatives:
  - `result.isError()` instead of `isErr(result)`
  - `result.isOk()` instead of `isOk(result)`
  - `result.unwrap()` instead of `unwrap(result)`

### Features

- add result-api and utils tests ([6f84528](https://github.com/AhmedOsman101/lib-result/commit/6f845286c0cbda247401f6eda659d571cb1a636e))
- enhance `ErrFromObject` for custom error props ([51b7d98](https://github.com/AhmedOsman101/lib-result/commit/51b7d9854dc46e1c89336043fd50e241e6312fd2))
- remove deprecated functions from main ([9b98aca](https://github.com/AhmedOsman101/lib-result/commit/9b98aca5da6d382576b396d6f455d30ac37a28dc))
- **utils:** enhance error handling with custom errors ([ff5e10e](https://github.com/AhmedOsman101/lib-result/commit/ff5e10ee35c6255bf04872e233d698f1ca324b61))

### Bug Fixes

- allow `ErrorState` with default `Error` type ([3180c94](https://github.com/AhmedOsman101/lib-result/commit/3180c94b0b645c3f3028860bda3788bfa1642a16))

## [2.3.0](https://github.com/AhmedOsman101/lib-result/compare/v2.2.0...v2.3.0) (2025-06-18)

### Features

- add error handling to `map` and `pipe` ([adc6719](https://github.com/AhmedOsman101/lib-result/commit/adc6719533fcb7bec14ed8a5029fcca1a6309120))
- add `wrapThrowable` and `wrapAsyncThrowable` result methods ([eac71e9](https://github.com/AhmedOsman101/lib-result/commit/eac71e97df02ca4c4c8b6e6deb5b6ba89fddb8fd))

### Bug Fixes

- improve error conversion in `toError` util ([38c9759](https://github.com/AhmedOsman101/lib-result/commit/38c97594cbb4e921824a62c87807dbbd10e8ca83))

## [2.3.0](https://github.com/AhmedOsman101/lib-result/compare/v2.2.1...v2.3.0) (2025-06-18)

### Features

- add error handling to `map` and `pipe` ([adc6719](https://github.com/AhmedOsman101/lib-result/commit/adc6719533fcb7bec14ed8a5029fcca1a6309120))
- add `wrapThrowable` and `wrapAsyncThrowable` result methods ([eac71e9](https://github.com/AhmedOsman101/lib-result/commit/eac71e97df02ca4c4c8b6e6deb5b6ba89fddb8fd))

### Bug Fixes

- improve error conversion in `toError` util ([38c9759](https://github.com/AhmedOsman101/lib-result/commit/38c97594cbb4e921824a62c87807dbbd10e8ca83))

## [2.2.0](https://github.com/AhmedOsman101/lib-result/compare/v2.1.4...v2.2.0) (2025-06-17)

### Features

- add `ErrFromObject` function for custom errors ([b037e7c](https://github.com/AhmedOsman101/lib-result/commit/b037e7c51b59941dfdab2f4c035cbe257084f39e))
- add `map` method to Result type ([3ef5907](https://github.com/AhmedOsman101/lib-result/commit/3ef59070dc6a3e30b53fce81ebac7b7a519ae567))
- add `pipe` method to Result type ([2abad0d](https://github.com/AhmedOsman101/lib-result/commit/2abad0da24897d5d31974f5e60e038d899c89943))
- deprecate `unwrap` function in favor of `result.unwrap()` ([b633183](https://github.com/AhmedOsman101/lib-result/commit/b6331839ed0c95051a4e557c0e1a1da99c8ce154))

## [2.1.0](https://github.com/AhmedOsman101/lib-result/compare/v2.0.2...v2.1.0) (2025-06-15)

### Features

- add typescript LSP and vscode config ([adce348](https://github.com/AhmedOsman101/lib-result/commit/adce348d1030adbbbaa6ad1787ad18a5d6b7f718))

### Bug Fixes

- Fixed checking ok value in `isOk` function ([4f9c34b](https://github.com/AhmedOsman101/lib-result/commit/4f9c34b5668ac584835bb3f15c57be027814306e))

## [2.0.2](https://github.com/AhmedOsman101/lib-result/compare/v2.0.0...v2.0.2) (2025-06-15)

### Features

- setup release-please for automation ([0f10377](https://github.com/AhmedOsman101/lib-result/commit/0f1037790412d50b064ca119274625a70da33d29))

## [2.0.0](https://github.com/AhmedOsman101/lib-result/compare/v1.0.9...v2.0.0) (2025-06-14)

### Features

- add ResultMethods interface ([8d20b0a](https://github.com/AhmedOsman101/lib-result/commit/8d20b0a0793c161b4f05d2c3fcb6037514ccffa7))
- add unwrap, wrap, wrapAsync functions ([65437c5](https://github.com/AhmedOsman101/lib-result/commit/65437c5890b7648cef2c52933437020f1d2d3fa1))
- create src/index.d.ts ([6fa2f96](https://github.com/AhmedOsman101/lib-result/commit/6fa2f960b585c1b137006f8017334949d4510af5))
- Deprecate v1 compatibility functions ([74c36fb](https://github.com/AhmedOsman101/lib-result/commit/74c36fbb578742233a118039ba5c96f35b2a7cd9))
- enhance Result type with helper methods ([e322c89](https://github.com/AhmedOsman101/lib-result/commit/e322c89fbe21bb9f4b5714109ffc996de57c456e))
- moved Result type and OkState/ErrorState types to index.d.ts ([241514d](https://github.com/AhmedOsman101/lib-result/commit/241514d1773ae5febc1c1d517cef3cc0202d4262))
- setup release-please for automation ([0f10377](https://github.com/AhmedOsman101/lib-result/commit/0f1037790412d50b064ca119274625a70da33d29))
