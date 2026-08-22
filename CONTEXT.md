# lib-result

A TypeScript library providing a Rust-inspired `Result` type for error handling without exceptions.

## Language

### Core model

**Result**:
The union of an Ok state and an Error state; exactly one side is populated.
_Avoid_: Either, outcome

**Ok state**:
A `Result` holding a success value (`ok`) and no error.
_Avoid_: Success, right

**Error state**:
A `Result` holding an error value (`error`) and no success value.
_Avoid_: Failure, left, Err state

**CustomError**:
The library's default error type; resolves to plain `Error` unless props are supplied.

### Wrappers

**Wrapper**:
A function that converts throwing code into `Result`-returning code. The family: `wrap`, `wrapAsync`, `wrapThrowable`, `wrapAsyncThrowable`.
_Avoid_: Safe function, catcher

**Inferred mode**:
Calling a wrapper with no explicit type arguments; all generics come from the callback, with the error type defaulting to `CustomError`.

**Pinned-error mode**:
Calling a `wrap*Throwable` wrapper with exactly one explicit type argument to pin the error type `E`, while the success type and arguments stay inferred.
_Avoid_: Explicit generics mode, manual typing
