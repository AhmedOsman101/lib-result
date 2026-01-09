# AGENTS.md

This file contains guidelines for agentic coding agents working on this repository.

## Commands

### Building and Testing
- `pnpm build` - Clean and build the project (cleans dist, runs tsup, attw)
- `pnpm format` - Format code with Biome
- `pnpm format:unsafe` - Format with unsafe Biome fixes
- `pnpm test` - Build and run all tests
- `pnpm test:run` - Run all tests without building
- `pnpm test:run <test-file>` - Run a specific test file (e.g., `pnpm test:run result.test.ts`)
- `pnpm test:run -- <pattern>` - Run tests matching a pattern
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

Always run `pnpm build` and `pnpm format` before committing changes.

## Code Style

### Formatting
- Use Biome for formatting and linting
- 2 spaces indentation
- 80 character line width
- Double quotes for strings
- Semicolons required
- LF line endings
- No trailing whitespace

### TypeScript
- Target: ES2022
- Strict mode enabled with all strict checks
- Use `import type` for type-only imports
- No implicit `any` types (use explicit types instead)
- Enable `noUncheckedIndexedAccess` for safer array/object access
- Enable `noImplicitOverride` for method overrides

### Imports
- Always use `.ts` extensions for relative imports within the project
- Group imports: external libraries first, then internal type imports, then internal imports
- Type imports: `import type { Result } from "./types.ts"`
- Value imports: `import { Ok, Err } from "./mixens.ts"`

### Naming Conventions
- Functions and variables: camelCase
- Interfaces and types: PascalCase
- Special constructors: PascalCase (e.g., `Ok()`, `Err()`)
- Helper constructors: PascalCase with descriptive names (e.g., `ErrFromText`, `ErrFromObject`)
- Test files: `*.test.ts`

### Code Patterns
- Use Result type for all operations that may fail
- Prefer `isOk()` and `isError()` for type narrowing
- Use `map()` for transformations that cannot fail
- Use `pipe()` for chaining operations that return Results
- Use `match()` for exhaustive pattern matching
- Use `wrap()` for synchronous functions that may throw
- Use `wrapAsync()` for async functions that may throw
- Use `wrapThrowable()` to convert throwing functions to Result-returning functions
- Use `wrapAsyncThrowable()` for async functions

### Error Handling
- Always use Result type instead of throwing errors
- Use `Err()` with Error instances
- Use `ErrFromText()` for simple string errors
- Use `ErrFromObject()` for custom errors with properties
- Use `ErrFromUnknown()` for unknown error values
- Provide descriptive error messages
- Use `unwrap()` only when you're certain the operation won't fail
- Use `expect(message)` to provide context for unwrapping errors

### Testing
- Write tests for both success and error paths
- Use descriptive test names
- Test edge cases and error conditions
- Use `vitest` for testing
- Import from `../dist/index.js` in test files (not from source)
- Use `describe`, `test`, `expect` from `vitest`
- Use `vi.fn()` for mocking
- Use `@ts-expect-error` comments when intentionally testing invalid inputs

### File Organization
- Source code in `/src`
- Tests in `/tests`
- `index.ts` - Main export file
- `types.ts` - Type definitions and interfaces
- `main.ts` - Core implementation (wrap functions)
- `mixens.ts` - Constructor helpers (Ok, Err variants)
- `utils.ts` - Utility functions
- Export all public APIs from `index.ts`

### General Guidelines
- Prefer `const` over `let`
- Use template literals instead of string concatenation
- Avoid unnecessary type annotations (let TypeScript infer)
- Use shorthand function types: `(x: number) => number`
- No unused imports or variables
- Use `as const` for literal types
- Use meaningful variable and function names
- Add JSDoc comments for exported functions and types
- Keep functions small and focused
- Type all function parameters and return types
- Use `extends Error` for custom error types
