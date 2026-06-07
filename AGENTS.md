# AGENTS.md

## Project Overview

**promised.node.sqlite** is a TypeScript library that provides async/await support for Node.js's built-in `node:sqlite` module. It wraps the synchronous SQLite API with Promise-based methods.

## Tech Stack

- **Language:** TypeScript (targeting ES2022+)
- **Node Version:** >= 24.0.0
- **Dependencies:** None at runtime (uses built-in `node:sqlite`)
- **Testing:** Node.js built-in `node:test` framework
- **Build Tool:** TypeScript compiler (`tsc`)

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main source code - SQLite wrapper implementation |
| `dist/` | Compiled JavaScript output (build artifact) |
| `test/` | Test files (`.spec.ts`) |
| `package.json` | Build scripts and dependencies |
| `tsconfig.json` | TypeScript configuration |
| `assets/chinook-orig.db` | Pristine SQLite test fixture (never modified) |

## Build & Test Commands

```bash
npm run build.tsc   # Compile TypeScript to JavaScript
npm run test        # Run all tests
npm run clean       # Remove dist/ directory
```

## Code Patterns & Conventions

### API Style
The library wraps `node:sqlite` by converting synchronous methods to Promise-based:
- `db.get()` - Returns single row or undefined
- `db.all()` - Returns array of rows
- `db.each()` - Returns async iterator for `for await...of`
- `db.run()` - Returns result with `lastID` and `changes`
- `db.transaction()` - Returns async transaction function

### Key Implementation Details
1. **Error Handling:** All promises should throw on SQLite errors
2. **Parameter Binding:** Use positional `?` placeholders with array parameters
3. **Async Iteration:** `db.each()` must implement `Symbol.asyncIterator`
4. **Transactions:** Must be proper async functions that can be awaited

### Testing Patterns
- Tests are in `test/**/*.spec.ts`
- Use `node:test` framework with `test()`, `before()`, `after()` hooks
- Tests use a copy of `assets/chinook-orig.db` → `assets/chinook.db` (created before tests, deleted after)
- This allows tests to modify the database without polluting the fixture
- Always close database connections after tests

## Common Tasks

### Adding a new method to the DB API
1. Implement in `src/index.ts`
2. Add TypeScript interface to `Database` class
3. Write test in `test/` directory
4. Run `npm run build.test` then `npm test`

### Running tests
```bash
npm run build.test  # Compiles test files
npm test           # Builds and runs tests
npm run test.watch # Watch mode
```

### Building for release
```bash
npm run clean
npm run build.tsc
```

## Important Notes for LLMs

1. **No external SQLite dependency:** Uses only built-in `node:sqlite`
2. **Node 24+ required:** The `node:sqlite` API is new
3. **TypeScript:** Export proper `.d.ts` type definitions
4. **Async patterns:** All DB operations return Promises
5. **Keep it minimal:** This is a thin wrapper, not a full ORM

## Repository

- Author: David Herron
- License: MIT
- Source: https://github.com/robogeek/promised.node.sqlite
