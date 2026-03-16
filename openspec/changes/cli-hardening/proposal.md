## Why

The proofrun CLI MVP is feature-complete but has four gaps identified by code review: no automated tests, no session crash recovery, loose config validation, and some pure logic trapped in unexported functions. Addressing these makes the CLI reliable enough for real-world use before publishing.

## What Changes

- **Automated test suite** using Node.js built-in test runner (`node:test`) with real temp directories — covers config loading, locking, session state, evidence append, and report data building
- **Session crash recovery** — `findActiveSession` detects stale sessions (dev server PID dead but state still "active"), auto-cleans them, and reports recovery to the agent
- **Config validation** — required field checks (`platform`, `app.bundle_id`, `dev_server.start`), type checks on numeric fields, unknown top-level key warnings
- **Testability refactor** — export `buildReportData` from report module, extract `validateConfig` as a standalone function

## Capabilities

### New Capabilities

- `test-suite`: Automated tests for core modules (config, locking, session, evidence, report data)
- `config-validation`: Schema validation for `.proofrun/config.yaml` — required fields, type checks, unknown key warnings
- `crash-recovery`: Stale session detection and auto-cleanup when dev server process has died

### Modified Capabilities

_(none — these are internal robustness improvements, no spec-level behavior changes to existing capabilities)_

## Impact

- **Files modified**: `src/config.js`, `src/session.js`, `src/commands/report.js`, `src/commands/doctor.js`
- **Files added**: `src/**/*.test.js` (test files alongside source)
- **Dependencies**: None new — uses `node:test` and `node:assert` (built-in)
- **Breaking changes**: None — all changes are additive or internal
