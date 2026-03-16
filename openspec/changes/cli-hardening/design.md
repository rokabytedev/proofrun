## Context

The proofrun CLI MVP is implemented and manually tested. Two independent code reviews identified four gaps: no automated tests, stale session handling, loose config validation, and some pure logic locked inside command handler closures. All four are pre-publish hardening — they don't change user-facing behavior.

## Goals / Non-Goals

**Goals:**
- Automated test suite that runs via `npm test` with zero external dependencies
- Stale session auto-recovery so agents don't get stuck after dev server crashes
- Config validation that catches typos and missing required fields early
- Pure logic exported for testability without changing module boundaries

**Non-Goals:**
- 100% code coverage — focus on logic with actual failure modes
- Testing commands end-to-end (spawn CLI, parse stdout) — too brittle, test the units
- Schema versioning or migration — config format is v1, address later
- flock-based locking tests — PID-file is the active path on macOS

## Decisions

### D1: Node.js built-in test runner with real temp directories

**Choice:** Use `node:test` + `node:assert` with real filesystem operations in OS temp directories. No mocks, no test framework dependencies.

**Why:** CLAUDE.md policy requires real integration over mocks. Node 22's built-in test runner is mature enough. Temp dirs are cleaned up via `afterEach`. Test files live alongside source (`src/config.test.js` next to `src/config.js`).

**Alternatives considered:**
- Jest/Vitest: Extra dependency, ESM configuration hassle
- Mocking fs: Policy violation, hides real filesystem behavior

### D2: Stale session detection inside `findActiveSession`

**Choice:** When `findActiveSession` finds a session with `status: "active"` but the dev server PID is dead, it auto-marks the session as `"crashed"`, cleans up lock files, and continues searching.

**Why:** The caller (session start) shouldn't need to know about crash recovery. `findActiveSession` already owns the concept of "what's the current active session." Adding liveness checking here keeps the recovery transparent to all callers.

**Return shape change:** When a stale session is recovered, `findActiveSession` sets `recoveredStaleSession` on the result so `session start` can report it in the JSON output. Callers that don't check this field are unaffected.

### D3: Two-tier config validation — structural in loadConfig, comprehensive in doctor

**Choice:** `loadConfig` validates structural requirements (required fields exist, correct types). `doctor` does comprehensive checks (bundle_id format, port range sanity, unknown key warnings).

**Why:** Every command benefits from catching missing `dev_server.start` early. But warnings about unknown keys or bundle_id format are advisory — they belong in the health check, not blocking every command.

**Validation errors output:** Structural failures use the standard JSON error envelope and exit code 1. Doctor warnings use `status: "warn"` in the checks array (existing pattern).

### D4: Export pure functions, don't restructure modules

**Choice:** Export `buildReportData` from `commands/report.js` and `validateConfig` from `config.js`. Don't move them to separate files.

**Why:** Minimal change. The functions are already well-defined. Adding `export` is a one-word change. Creating new files would add module boundaries without value.

## Risks / Trade-offs

### [Test brittleness from real filesystem] → Mitigation: unique temp dirs per test

Each test creates a unique temp directory via `mkdtemp`. Tests never share state. `afterEach` cleans up. If cleanup fails, OS temp directory handles it eventually.

### [Crash recovery false positive] → Mitigation: conservative PID check

`isProcessAlive(pid)` uses `kill(pid, 0)` which is reliable on macOS/Linux. The only edge case is PID reuse (OS assigns the same PID to a new process). Extremely unlikely in practice since PIDs are recycled after 30K+ on macOS. The stale lock files also check PID liveness, so the worst case is a briefly "locked" slot that auto-releases on next check.

### [Config validation too strict for future fields] → Mitigation: warn, don't fail

Unknown top-level keys produce a warning in doctor, not an error in loadConfig. Forward-compatible by default. Users upgrading proofrun won't break existing configs.
