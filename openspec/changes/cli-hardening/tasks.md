## 1. Config Validation

- [x] 1.1 Add `validateConfig(config)` to `src/config.js` — check required fields (`platform`, `app.bundle_id`, `dev_server.start`), type-check numeric fields (`simulator.pool_size`, `port_range.start`, `port_range.end`, `dev_server.startup_timeout`). Return array of error strings. Call from `loadConfig` after parsing, exit with JSON error if any errors.
- [x] 1.2 Add unknown top-level key detection to `proofrun doctor` — compare config keys against known set, emit `status: "warn"` check for each unknown key.

## 2. Session Crash Recovery

- [x] 2.1 Update `findActiveSession` in `src/session.js` to check `isProcessAlive(state.dev_server.pid)` for active sessions. If PID is dead (or missing), mark session as `status: "crashed"`, clean up associated lock files, and continue searching. Track recovered session IDs.
- [x] 2.2 Update `session start` in `src/commands/session.js` to include `recovered_stale_session` field in the response when a stale session was auto-recovered during the `findActiveSession` call.

## 3. Testability Refactors

- [x] 3.1 Export `buildReportData` from `src/commands/report.js` (add `export` keyword to existing function).
- [x] 3.2 Export `validateConfig` from `src/config.js` (already created in 1.1, just ensure it's exported).

## 4. Automated Tests

- [x] 4.1 Configure `npm test` script in `package.json` to run `node --test 'src/**/*.test.js'`.
- [x] 4.2 Write `src/config.test.js` — test `withDefaults` deep merge, `findConfigPath` parent walking, `validateConfig` required fields and type checks, malformed YAML error handling.
- [x] 4.3 Write `src/locking.test.js` — test sequential slot acquisition returns different slots, port validation rejects bad values, `transferLockPid` writes correct PID.
- [x] 4.4 Write `src/session.test.js` — test `generateSessionId` format, `appendEvidence` ID sequencing, `loadEvidence` handles corrupt JSON, `findActiveSession` picks newest active, stale session detection marks crashed.
- [x] 4.5 Write `src/commands/report.test.js` — test `buildReportData` groups entries by AC, computes correct summary counts, handles empty evidence.
- [x] 4.6 Run `npm test` and verify all tests pass.
