# lib-result

A Rust-inspired `Result` type for type-safe error handling in TypeScript and JavaScript.

## Installation

```bash
npm install lib-result
```

## Usage

### TypeScript

```typescript
import { Err, ErrFromText, Ok, type Result, unwrap } from "lib-result";

class DivisionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function divide(a: number, b: number): Result<number, DivisionError> {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}

const { ok: result, error } = divide(1, 0);
if (error !== undefined) console.error(error.message);
else console.log(result);

const errorResult: Result<string> = ErrFromText("Failed");
try {
  const value = unwrap(errorResult);
  console.log(value);
} catch (e) {
  console.error(e.message); // 'Failed'
}
```

### JavaScript

```javascript
const { Ok, Err, ErrFromText, isErr, isOk, unwrap } = require("lib-result");

class DivisionError extends Error {
  constructor(message) {
    super(message);
  }
}

function divide(a, b) {
  if (b === 0) {
    return Err(new DivisionError("Cannot Divide By Zero"));
  }
  return Ok(a / b);
}

const divison = divide(6, 2);
if (isOk(divison)) console.log(divison.ok); // 3
else console.error(divison.error.message);

const mayDivide = divide(1, 0);
if (isErr(mayDivide)) {
  console.error(mayDivide.error.message); // Cannot Divide By Zero
} else console.log(mayDivide.ok);

const errorResult = ErrFromText("Failed");
try {
  const value = unwrap(errorResult);
  console.log(value);
} catch (e) {
  console.error(e.message); // 'Failed'
}
```

## API

- `Ok<T>(value: T)`: Creates an `Ok` result with a value.
- `Err<E extends Error>(error: E)`: Creates an `Err` result with an error.
- `ErrFromText(message: string)`: Creates an `Err` result from a string message.
- `isOk(result)`: Checks if the result is `Ok`.
- `isErr(result)`: Checks if the result is `Err`.
- `unwrap(result)`: Extracts the `Ok` value or throws the `Err` error.

## Source Code

You can view the full codebase, contribute, or report issues at the following repository:
[AhmedOsman101/lib-result](https://github.com/AhmedOsman101/lib-result)
Feel free to open issues for bugs or feature requests, or submit pull requests to improve the package!
