# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [4.1.0](https://github.com/AhmedOsman101/lib-result/compare/v4.0.0...v4.1.0) (2026-04-17)


### Features

* add `and` method to Result ([2a2602a](https://github.com/AhmedOsman101/lib-result/commit/2a2602a7330d068a36f376880d5edc1112809ecb))
* add expectErr method to Result ([7e12a5d](https://github.com/AhmedOsman101/lib-result/commit/7e12a5dea6b97275d473cf8c2c198afb51b12263))
* add inspect and inspectErr methods ([b6e26d1](https://github.com/AhmedOsman101/lib-result/commit/b6e26d128d354207883ebcd0bdd2c308c0a69377))
* add mapOr and mapOrElse methods ([d1675ee](https://github.com/AhmedOsman101/lib-result/commit/d1675ee8c60f0a5e07be65b497b60622c2366a9d))
* add unwrapErr method ([aa85bc4](https://github.com/AhmedOsman101/lib-result/commit/aa85bc46e5abf3af1f8d29c2664695aed7dd4b7d))
* **result:** add `or` and `orElse` methods ([39a3827](https://github.com/AhmedOsman101/lib-result/commit/39a38278e41d6b4bd812a50fc09f0da81513a2c5))


### Bug Fixes

* **deps:** rename mixins.ts to mixens.ts and update imports ([4ec96e7](https://github.com/AhmedOsman101/lib-result/commit/4ec96e7c96b7ee019ce369bc3b2bb08a74be290d))

## [4.0.0](https://github.com/AhmedOsman101/lib-result/compare/v3.2.2...v4.0.0) (2026-04-11)


### ⚠ BREAKING CHANGES

* map, pipe, match, and mapErr now throw toError(e) instead of returning Err(toError(e)) when their callbacks throw. This fixes the unsafe 'as U' / 'as E' casts that produced a Result with a mismatched runtime type.

### Features

* add mapErr method to Result ([69df83f](https://github.com/AhmedOsman101/lib-result/commit/69df83f7d7ca90581d8edcf5c4d52a493361d0ce))
* **release:** add force option to gh release ([4943273](https://github.com/AhmedOsman101/lib-result/commit/4943273b4f0537d48df01aaef3500e880b54d7e0))
* **types:** allow optional error in match errFn ([2fd204e](https://github.com/AhmedOsman101/lib-result/commit/2fd204e1ad78bb94e2c289aab8124a4395ee6e3f))


### Bug Fixes

* **mixins:** improve match error handling ([a365f9b](https://github.com/AhmedOsman101/lib-result/commit/a365f9b81c104fbc6bd3a4b26a34ee5e75595aae))
* propagate thrown errors instead of returning Err with fake type cast ([6b62ede](https://github.com/AhmedOsman101/lib-result/commit/6b62ede7531954c0d4161a29244588d01632ee35))

## [3.2.2](https://github.com/AhmedOsman101/lib-result/compare/v3.2.1...v3.2.2) (2026-04-11)


### Bug Fixes

* allow errFn in match to be called with no args ([ebd9dd4](https://github.com/AhmedOsman101/lib-result/commit/ebd9dd40efc5774a6d2a22acfa69007c14a50539))

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
