# lib-result

A Rust-inspired `Result` type for type-safe error handling in TypeScript and JavaScript.

## Installation

```bash
npm install lib-result
```

## Usage

### TypeScript

```typescript
import {
  Err,
  ErrFromObject,
  ErrFromText,
  ErrFromUnknown,
  Ok,
  type Result,
  wrap,
  wrapAsync,
} from "lib-result";

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

// Using expect for custom error messages
try {
  errorResult.expect("Failed to get user");
} catch (e: any) {
  console.error(e.message); // "Failed to get user"
  console.error(e.cause.message); // "Failed"
}

// Using unwrapOr for safe fallbacks
const safeValue = errorResult.unwrapOr(0); // 0

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

// Using match for pattern matching
const message = result.match({
  okFn: value => `Success: ${value}`,
  errFn: error => `Error: ${error.message}`,
});
console.log(message); // "Success: 3"

// Using ErrFromUnknown for catch blocks
function parseJson(json: string) {
  try {
    return Ok(JSON.parse(json));
  } catch (error) {
    return ErrFromUnknown(error);
  }
}

// Using ErrFromObject to create an error with custom properties
const customErr = ErrFromObject<number, { code: number; info: string }>({
  message: "Something went wrong",
  code: 123,
  info: "Custom",
});
if (customErr.isError()) {
  console.error(customErr.error.message); // "Something went wrong"
  console.error(customErr.error.code); // 123
  console.error(customErr.error.info); // "Custom"
}
```

### JavaScript

```javascript
import {
  Err,
  ErrFromObject,
  ErrFromText,
  ErrFromUnknown,
  Ok,
  wrap,
  wrapAsync,
} from "lib-result";

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

// Using expect for custom error messages
try {
  errorResult.expect("Failed to get user");
} catch (e) {
  console.error(e.message); // "Failed to get user"
  console.error(e.cause.message); // "Failed"
}

// Using unwrapOr for safe fallbacks
const safeValue = errorResult.unwrapOr(0); // 0

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

// Using match for pattern matching
const message = result.match({
  okFn: value => `Success: ${value}`,
  errFn: error => `Error: ${error.message}`,
});
console.log(message); // "Success: 3"

// Using ErrFromUnknown for catch blocks
function parseJson(json) {
  try {
    return Ok(JSON.parse(json));
  } catch (error) {
    return ErrFromUnknown(error);
  }
}

// Using ErrFromObject to create an error with custom properties
const customErr = ErrFromObject({
  message: "Something went wrong",
  code: 123,
  info: "Custom",
});
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

## Source Code

You can view the full codebase, contribute, or report issues at the following repository:
[AhmedOsman101/lib-result](https://github.com/AhmedOsman101/lib-result)
Feel free to open issues for bugs or feature requests, or submit pull requests to improve the package!
