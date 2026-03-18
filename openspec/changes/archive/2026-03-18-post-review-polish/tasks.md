## 1. Global Device Locking

- [x] 1.1 In `src/locking.js`: add `getGlobalLockDir()` function that returns `path.join(os.homedir(), '.proofrun', 'locks')`. Creates the directory on first call. Export it.
- [x] 1.2 In `src/locking.js`: update `acquireLock()` to write JSON format to `.lock.held`: `{ session_id, project, device, locked_at, pid }`. The `session_id` is initially a placeholder (overwritten by session.js later), `project` is `process.cwd()`, `pid` is `process.pid`.
- [x] 1.3 In `src/locking.js`: add `readLockData(heldPath)` function that parses the JSON `.lock.held` file. Returns the parsed object or null if corrupt/missing.
- [x] 1.4 In `src/locking.js`: add `isLockStale(lockData)` function. Checks: (1) `process.kill(lockData.pid, 0)` — if throws, PID is dead → stale. (2) If PID alive, check if session state file at `lockData.project/.proofrun/sessions/<lockData.session_id>/state.json` has `status: "stopped"` → stale. Otherwise → active. Returns `{ stale: boolean, reason: string }`.
- [x] 1.5 In `src/locking.js`: update `listLocks()` to parse JSON format from `.lock.held` files and include stale status in returned data.
- [x] 1.6 In `src/config.js`: remove the `export const LOCK_DIR = '.proofrun/locks'` line.
- [x] 1.7 In `src/commands/session.js`: replace all `resolve(projectRoot, LOCK_DIR)` with `getGlobalLockDir()`. Update imports: remove `LOCK_DIR` from config.js import, add `getGlobalLockDir` from locking.js. Update `acquireLock` call to pass `project: projectRoot` context. After session ID is generated, update the lock held file with the real session ID using a new `updateLockSessionId(heldPath, sessionId)` helper.
- [x] 1.8 In `src/commands/session.js`: add `--force-unlock` option to `session start`. When device is locked: read lock data, check if stale, format error message with diagnostics (session ID, project path, PID, stale/active status). If `--force-unlock` is passed, call `releaseLock` on existing lock before acquiring new one. Error message should suggest `--force-unlock` if stale, or tell agent to ask human approval if active.
- [x] 1.9 In `src/commands/info.js`: update lock dir reference from `resolve(projectRoot, LOCK_DIR)` to `getGlobalLockDir()`. Update imports.
- [x] 1.10 In `src/commands/doctor.js`: update lock dir reference from `resolve(config._dir, LOCK_DIR)` to `getGlobalLockDir()`. Update imports.
- [x] 1.11 In `src/config.test.js`: remove the `LOCK_DIR` test.
- [x] 1.12 Update `src/locking.test.js` (or create if not exists): test `getGlobalLockDir()` returns `~/.proofrun/locks`, test JSON lock format, test `isLockStale()` with dead PID, test `readLockData()`.
- [x] 1.13 Run tests to verify locking changes work.

## 2. Device Status Command

- [x] 2.1 Create `src/commands/device.js`: register `proofrun device` command with `status` subcommand. Options: `--device <id>` (optional). Does NOT require project config — uses `getGlobalLockDir()` directly. Without `--device`: list all locks with status. With `--device`: show detailed status for that device. Include stale detection and actionable suggestions in output.
- [x] 2.2 Register device command in `src/cli.js`. Add to HELP_TEXT under a new DEVICE COMMANDS section.
- [x] 2.3 Run tests.

## 3. Remove Legacy Single-Session Report Code

- [x] 3.1 In `src/commands/report.js`: remove `--session <id>` and `--open` options. Remove the single-session code path (the `else` branch). When `--change` is not provided, auto-detect: check active session's `change_name`, then most recent session's `change_name`. If nothing found, error with "Specify --change <name>".
- [x] 3.2 In `src/commands/report.js`: remove legacy convenience fields (`session_id`, `summary`, `criteria`) from the top-level return of `buildMultiRunReportData()`.
- [x] 3.3 In `src/commands/serve.js`: update any code that reads legacy top-level fields from `reportData` — ensure it reads from `reportData.runs[...]` instead.
- [x] 3.4 In `templates/report.html`: update JS that reads report data to not rely on legacy top-level fields. Ensure it reads from `REPORT_DATA.runs[...]`.
- [x] 3.5 In `src/cli.js` HELP_TEXT: remove `--session <id>` and `--open` from report options. Update EXAMPLES to use `--change`.
- [x] 3.6 Update `src/commands/report.test.js`: update `buildMultiRunReportData` tests to not assert legacy top-level fields.
- [x] 3.7 Run tests.

## 4. Template Refinements — boundaries.md

- [x] 4.1 In `templates/knowledge/boundaries.md`: move internationalization (translations, locale formatting, RTL layout positioning) from human-required to agent-verifiable with "How to Verify" description.
- [x] 4.2 In `templates/knowledge/boundaries.md`: split "Visual polish" — add objective visual properties (alignment, text overflow, element overlap) to agent-verifiable. Keep animations (smoothness, timing feel) and subjective aesthetic judgment in human-required.
- [x] 4.3 In `templates/knowledge/boundaries.md`: update classification guidelines — replace "human perception (hearing, visual judgment)" with "human sensory perception that tools cannot capture (hearing, animation feel) or subjective aesthetic judgment".

## 5. Template Refinements — simulators.md → devices.md

- [x] 5.1 Delete `templates/knowledge/simulators.md`.
- [x] 5.2 Create `templates/knowledge/devices.md` with sections: Device Management Policy (agent prompts human for preference: dedicated-pool vs use-available), Device Pool (list of proofrun-dedicated devices after creation), Device Lifecycle (boot, use, cleanup — shut down after verification to free RAM). No interaction tool references. No Stable/Observed split.
- [x] 5.3 In `templates/knowledge/interaction.md`: remove any device provisioning/management content. Keep iosef install/verify instructions and interaction patterns. Ensure iosef is only referenced here.
- [x] 5.4 In `src/commands/init.js`: update the template copy logic to use `devices.md` instead of `simulators.md` (if files are copied by name).
- [x] 5.5 Run tests.

## 6. SKILL.md Rewrite

- [x] 6.1 Replace bad example: `recording-flow-e2e → Record → playback → delete flow...` with `onboarding-flow-e2e → Onboarding screens display correctly and can be navigated to completion`. Same for the trigger mapping line.
- [x] 6.2 Add device conflict awareness to "Set Up Environment" section: instruct agent to run `proofrun device status` before using a device, be a good citizen (never use without locking), ask human approval if device is actively locked.
- [x] 6.3 Add port conflict awareness to "Set Up Environment": warn about port conflicts, instruct to check if port is in use before starting dev server.
- [x] 6.4 Add device pool management guidance: read `devices.md` for policy, if no policy ask human (dedicated-pool recommended vs use-available), if dedicated pool create devices following principles (research latest OS, start with 3, naming format "(Proofrun-only) <Name>", form factor variety), record in `devices.md`.
- [x] 6.5 Replace vague "Update knowledge files as you discover things" with explicit DOs/DONTs table mapping discoveries to target files. Include the "Never put in knowledge files" list.
- [x] 6.6 Fix workflow ordering: move "Stop Session" before "Serve Report". Renumber steps. Add rationale (release device lock after evidence collection, don't hold during human review). Move device cleanup (shut down simulator) to after feedback handling.
- [x] 6.7 Rewrite "Serve Report for Live Feedback" section: instruct agent to run serve as a background task (Claude Code background task capability, not shell `&`). Add human communication template: report URL, review instructions, "I'll be notified automatically" message.
- [x] 6.8 Remove legacy reference: delete `For a single-session report (legacy): npx proofrun report --open` line.
- [x] 6.9 Update "Handle Human Feedback" and "Follow-Up Runs" to reflect new ordering (session already stopped, re-acquire device if needed for follow-up).
- [x] 6.10 Run full test suite as final check.

## 7. Report HTML — Export Feedback Button

- [x] 7.1 In `templates/report.html`: add an "Export Feedback JSON" button. Style as small/muted/secondary. In serve mode: position below the Submit Feedback and LGTM buttons. In static mode: show as the only feedback-related action.
- [x] 7.2 Implement click handler: collect current feedback state (same JSON structure as the POST body), trigger browser download of the JSON file as `feedback-<change_name>.json`.
- [x] 7.3 Run tests.
