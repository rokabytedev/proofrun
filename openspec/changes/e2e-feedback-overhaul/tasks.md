## 1. Fix Critical Bugs

- [x] 1.1 Fix report template bug: in `templates/report.html`, change `/*__REPORT_DATA__*/{}` to `/*__REPORT_DATA__*/null` to prevent JS syntax error
- [x] 1.2 Fix session crash: in `src/session.js` `findActiveSession()`, remove `dev_server.pid` liveness check — session is active if `state.status === 'active'`

## 2. Plain Text Output

- [x] 2.1 Update `src/output.js`: add `setJsonMode()` function, modify `success()` and `error()` to output plain text by default, JSON when `--json` is set
- [x] 2.2 Add global `--json` flag in `src/cli.js` on root program with `preAction` hook to call `setJsonMode()`
- [x] 2.3 Add plain text formatters for each command: `init`, `doctor`, `session` (start/stop/status), `step`, `screenshot`, `judge`, `note`, `fix`, `evidence`, `report`, `knowledge`
- [x] 2.4 Update all tests to account for plain text default (pass `--json` in tests that parse JSON output)

## 3. Slim Config

- [x] 3.1 Update `src/config.js`: remove `simulator.pool_size`, `port_range`, `session.lock_dir` from DEFAULTS. Hardcode `LOCK_DIR = '.proofrun/locks'` as constant. Keep `session.evidence_dir`, `reports.*`
- [x] 3.2 Update `src/config.js` `validateConfig()`: remove pool_size and port_range validation
- [x] 3.3 Update preset config.toml files (`presets/expo/config.toml`, `presets/react-native-cli/config.toml`) to only include kept fields
- [x] 3.4 Update `src/config.test.js` for new config shape

## 4. Session Locking Redesign

- [x] 4.1 Rewrite `src/locking.js`: replace pool-based allocation with named resource locking — `acquireLock(lockDir, resourceName)`, `releaseLock(lock)`, `listLocks(lockDir)`. Remove `ensureSimLockFiles`, `ensurePortLockFiles`, `acquireSimulatorSlot`, `acquirePort`
- [x] 4.2 Update `src/commands/session.js` `start`: accept `--simulator <UDID>` (required), lock by UDID, no port allocation. Session state stores simulator as UDID string only
- [x] 4.3 Update `src/commands/session.js` `stop`: release simulator lock by UDID
- [x] 4.4 Update `src/commands/session.js` `status`: show active session with simulator UDID, list locked resources
- [x] 4.5 Update `src/session.js` `findActiveSession()`: remove dev_server.pid check, active = status is 'active'
- [x] 4.6 Update `src/locking.test.js` and `src/session.test.js` for new locking model

## 5. Named Criteria

- [x] 5.1 Update `src/commands/step.js`, `screenshot.js`, `judge.js`, `fix.js`: replace `--ac <n>` option with `--criterion <name>` option (string). Make `--criterion` required on `judge`
- [x] 5.2 Update evidence entry format in `src/session.js`: store `criterion` (string) instead of `ac` (integer)
- [x] 5.3 Update `src/commands/evidence.js`: group by criterion name instead of AC number
- [x] 5.4 Update `src/commands/report.js` `buildReportData()`: group by criterion, use criterion name as section header
- [x] 5.5 Update `templates/report.html`: render criterion names instead of "AC N" in the report UI

## 6. Info Command

- [x] 6.1 Create `src/commands/info.js`: returns config, knowledge topics (name + description from frontmatter), lock state, active session, diagnostic checks. Plain text default, `--json` for structured
- [x] 6.2 Register `info` command in `src/cli.js`, add to help text
- [x] 6.3 Remove `src/commands/context.js` and unregister from `src/cli.js`

## 7. Knowledge & SKILL.md

- [x] 7.1 Rename `presets/expo/knowledge/dev-server.md` to `environment.md` — update content with generic build/run structure and placeholder comments for agent discovery
- [x] 7.2 Rename `presets/react-native-cli/knowledge/dev-server.md` to `environment.md` — same treatment
- [x] 7.3 Update `src/commands/init.js` if it references `dev-server.md` by name
- [x] 7.4 Rewrite `skills/proofrun/SKILL.md`: correct step ordering (orient → plan → env setup → env checkpoint → session → verify → report → cleanup), first-time explore requirement, continuous knowledge updates principle, named criteria examples, `proofrun info` instead of `context`, human-in-the-loop guidance

## 8. Help Text & CLI Cleanup

- [x] 8.1 Update help text in `src/cli.js`: add `info` command, remove `context`, update `session start` signature, update evidence command descriptions for `--criterion`
- [x] 8.2 Run all tests and fix any failures
