# lib-result

A Rust-inspired `Result` type for type-safe error handling in TypeScript and JavaScript.

## Installation

```bash
npm install lib-result
```

## Usage

### TypeScript

```typescript
import { Err, ErrFromText, Ok, type Result, wrap, wrapAsync } from "lib-result";

class DivisionError extends Error {}

function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}

// Method-based API
const result = divide(6, 2);
if (result.isOk()) {
  console.log(result.ok); // 3
} else {
  console.error(result.error.message);
}

const mayDivide = divide(1, 0);
if (mayDivide.isError()) {
  console.error(mayDivide.error.message); // "Cannot Divide By Zero"
}

// Using unwrap
const errorResult = ErrFromText("Failed");
try {
  const value = errorResult.unwrap();
  console.log(value);
} catch (e) {
  console.error(e.message); // "Failed"
}

// Using wrap for synchronous operations
const wrappedResult = wrap(() => divide(10, 2));
if (wrappedResult.isOk()) {
  console.log(wrappedResult.ok); // 5
}

// Using wrapAsync for asynchronous operations
const asyncResult = await wrapAsync(() =>
  fetch("https://jsonplaceholder.typicode.com/users/1")
);
if (asyncResult.isOk()) {
  console.log(asyncResult.ok.status); // 200
}

// Using map and pipe for chaining transformations
const chained = divide(10, 2)
  .map(x => x + 1) // Ok(6)
  .pipe(x => divide(x, 2)); // Ok(3)
if (chained.isOk()) {
  console.log(chained.ok); // 3
}

// Using ErrFromObject to create an error with custom properties
import { ErrFromObject } from "lib-result";
const customErr = ErrFromObject<number>(
  { code: 123, info: "Custom" },
  "Something went wrong"
);
if (customErr.isError()) {
  console.error(customErr.error.message); // "Something went wrong"
  console.error(customErr.error.code); // 123
  console.error(customErr.error.info); // "Custom"
}
```

### JavaScript

```javascript
import { Err, ErrFromText, Ok, wrap, wrapAsync } from "lib-result";

class DivisionError extends Error {}

function divide(a, b) {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}

// Method-based API
const result = divide(6, 2);
if (result.isOk()) {
  console.log(result.ok); // 3
} else {
  console.error(result.error.message);
}

const mayDivide = divide(1, 0);
if (mayDivide.isError()) {
  console.error(mayDivide.error.message); // "Cannot Divide By Zero"
}

// Using unwrap
const errorResult = ErrFromText("Failed");
try {
  const value = errorResult.unwrap();
  console.log(value);
} catch (e) {
  console.error(e.message); // "Failed"
}

// Using wrap for synchronous operations
const wrappedResult = wrap(() => divide(10, 2));
if (wrappedResult.isOk()) {
  console.log(wrappedResult.ok); // 5
}

// Using wrapAsync for asynchronous operations
const asyncResult = await wrapAsync(() =>
  fetch("https://jsonplaceholder.typicode.com/users/1")
);
if (asyncResult.isOk()) {
  console.log(asyncResult.ok.status); // 200
}

// Using map and pipe for chaining transformations
const chained = divide(10, 2)
  .map(x => x + 1) // Ok(6)
  .pipe(x => divide(x, 2)); // Ok(3)
if (chained.isOk()) {
  console.log(chained.ok); // 3
}

// Using ErrFromObject to create an error with custom properties
import { ErrFromObject } from "lib-result";
const customErr = ErrFromObject(
  { code: 123, info: "Custom" },
  "Something went wrong"
);
if (customErr.isError()) {
  console.error(customErr.error.message); // "Something went wrong"
  console.error(customErr.error.code); // 123
  console.error(customErr.error.info); // "Custom"
}
```

> [!NOTE]
>
> To check out the full documentation, API details, and advanced usage
> See the [lib-result Wiki](https://github.com/AhmedOsman101/lib-result/wiki) for comprehensive guides, API docs, and examples. The wiki is the main source for up-to-date documentation.

## API

### Functions

- `Ok<T, E extends Error = Error>(ok: T)`: Creates an `Ok` result with a success value.
- `Err<E extends Error, T>(error: E)`: Creates an `ErrorState` result with an error instance.
- `ErrFromText<T>(message: string)`: Creates an `ErrorState` result from a string message.
- `ErrFromObject<T>(props: CustomErrorProps, message?: string)`: Creates an `ErrorState` result with a custom error object and message.
- `wrap<T, E extends Error = Error>(callback: () => T)`: Wraps a synchronous function, returning an `Ok` result for the return value or an `ErrorState` result for thrown errors.
- `wrapAsync<T, E extends Error = Error>(callback: () => Promise<T>)`: Wraps an asynchronous function, returning a `Promise` resolving to an `Ok` result for resolved values or an `ErrorState` result for rejected errors.
- `unwrap<T, E extends Error>(result: Result<T, E>)` _(Deprecated)_: Extracts the `Ok` value or throws the `ErrorState` error. Use `result.unwrap()` instead.
- `isOk<T, E extends Error>(result: Result<T, E>)` _(Deprecated)_: Checks if the result is `Ok`. Use `result.isOk()` instead.
- `isErr<T, E extends Error>(result: Result<T, E>)` _(Deprecated)_: Checks if the result is `Err`. Use `result.isError()` instead.

### Result Methods

- `result.isOk(): this is OkState<T, E>`: Returns `true` if the result is `Ok`, narrowing the type to `OkState`.
- `result.isError(): this is ErrorState<E, T>`: Returns `true` if the result is `ErrorState`, narrowing the type to `ErrorState`.
- `result.unwrap(): T`: Returns the `Ok` value or throws the `ErrorState` error.
- `result.map<U>(fn: (value: T) => U): Result<U, E>`: Transforms the `Ok` value if present, preserving errors.
- `result.pipe<U>(fn: (value: T) => Result<U, E>): Result<U, E>`: Chains a transformation that returns a new `Result`, short-circuiting on errors.

## Source Code

You can view the full codebase, contribute, or report issues at the following repository:
[AhmedOsman101/lib-result](https://github.com/AhmedOsman101/lib-result)
Feel free to open issues for bugs or feature requests, or submit pull requests to improve the package!
