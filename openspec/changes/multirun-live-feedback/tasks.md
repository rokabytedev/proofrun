## 1. Session Start — Reason Flag

- [x] 1.1 Add optional `--reason <text>` option to `session start` in `src/commands/session.js`. Store in session state as `reason: opts.reason || null`. Display in start output if provided.
- [x] 1.2 Update `src/cli.js` help text — add `--reason` to session start documentation
- [x] 1.3 Run tests to verify session start still works

## 2. Carry Command

- [x] 2.1 Create `src/commands/carry.js` — register `proofrun carry --criterion <name> --reason <text>`. Requires active session. Finds prior stopped session with same change name. Looks up criterion in prior evidence (any judgment entry). Records `type: "carry"` evidence entry with `criterion`, `reason`, `carried_from_session`, `carried_from_run` (chronological position).
- [x] 2.2 Add `findSessionsByChangeName(evidenceDir, changeName)` helper to `src/session.js` — returns all sessions with matching change_name, sorted chronologically. Returns `[{ sessionId, sessionDir, state }]`.
- [x] 2.3 Register carry command in `src/cli.js`, add to help text under EVIDENCE COMMANDS
- [x] 2.4 Run tests

## 3. Multi-Run Report Data

- [x] 3.1 Rewrite `buildReportData()` in `src/commands/report.js` to support multi-run mode. When `--change` flag is used, find all sessions for that change name, build a `runs` array. Each run has its own criteria, prerequisites, general_entries. Include `latest_run` number. Keep backward compat: `--session` flag still generates single-run report.
- [x] 3.2 Add `--change <name>` option to `report` command in `src/commands/report.js`. When used, aggregates all sessions for that change.
- [x] 3.3 Load prior run feedback files (`feedback.json` in each session dir) to determine carried approval status for criteria.
- [x] 3.4 Classify each criterion in the latest run as: `re-verified` (has new evidence), `carried` (has carry entry), or `new` (first appearance). Store classification in report data.
- [x] 3.5 Update `src/commands/report.test.js` — add test for multi-run report data: two sessions same change, verify runs array, criteria classification, and carried approval status.
- [x] 3.6 Run tests

## 4. Report HTML — Multi-Run UI

- [x] 4.1 Update `templates/report.html` — add run tab bar. If multiple runs exist, show tabs: "Run #1 (Initial)", "Run #2: <reason>". Clicking a tab switches the displayed criteria/evidence. Latest run selected by default.
- [x] 4.2 Add carried/re-verified/new badges to criteria in the report. Carried criteria show gray badge with carry reason. Re-verified show blue badge. New show purple badge.
- [x] 4.3 Add top-level comment textarea above the criteria list. Value is included in feedback JSON as `top_level_comment`.
- [x] 4.4 Add `SERVE_MODE` detection: if `typeof SERVE_MODE !== 'undefined' && SERVE_MODE === true`, show feedback buttons. Otherwise hide them entirely (static file mode has no feedback UI).

## 5. Report HTML — Feedback Buttons

- [x] 5.1 Replace the "Export Feedback" button with "Submit Feedback" and "LGTM" buttons (only visible in serve mode).
- [x] 5.2 Implement button state machine: LGTM disabled when any criterion rejected or has non-approval comment. Re-evaluate on every setFeedback/setComment call.
- [x] 5.3 "Submit Feedback" handler: POST feedback JSON to `/feedback`. On success, disable both buttons, show "Feedback Submitted" / "LGTM-ed" text and confirmation message "Agent has been notified."
- [x] 5.4 "LGTM" handler: POST to `/lgtm`. On success, disable both buttons, show "LGTM-ed" and confirmation.

## 6. Serve Command

- [x] 6.1 Create `src/commands/serve.js` — register `proofrun serve --change <name> [--port <port>] [--timeout <minutes>]`. Uses `node:http` to create server. Writes `.proofrun/serve.pid`.
- [x] 6.2 Implement GET `/` route: generate report HTML dynamically (same as `proofrun report --change`), inject `const SERVE_MODE = true;` before `REPORT_DATA`.
- [x] 6.3 Implement POST `/feedback` route: parse JSON body, write to latest session's `feedback.json`, respond 200, schedule server shutdown.
- [x] 6.4 Implement POST `/lgtm` route: write LGTM feedback (all criteria accepted, `lgtm: true`), respond 200, schedule shutdown.
- [x] 6.5 Implement timeout: `setTimeout` that exits with code 1 and message after `--timeout` minutes (default 30).
- [x] 6.6 On shutdown: remove `.proofrun/serve.pid`, print feedback summary to stdout, exit.
- [x] 6.7 Implement `serve --stop`: read `.proofrun/serve.pid`, send SIGTERM, remove PID file. Handle "no process running" gracefully.
- [x] 6.8 Register serve command in `src/cli.js`, add to help text under REPORT COMMANDS
- [x] 6.9 Run tests

## 7. SKILL.md Updates

- [x] 7.1 Update SKILL.md "Generate Report" section — use `--change` flag: `npx proofrun report --change <name>`
- [x] 7.2 Update SKILL.md — add serve workflow after report generation: run `npx proofrun serve --change <name>` in background, tell user the URL
- [x] 7.3 Update SKILL.md "Follow-Up Runs" section — add carry command usage, explain re-verify vs carry decision

## 8. Final Verification

- [x] 8.1 Run full test suite
- [x] 8.2 Manual smoke test: create two sessions for same change, generate multi-run report, verify tabs and carry badges render correctly
