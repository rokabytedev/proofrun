## 1. Prerequisite Command

- [x] 1.1 Create `src/commands/prerequisite.js` — register `proofrun prerequisite <description>` with optional `--check <command>`. Requires active session. Records evidence entry with `type: "prerequisite"`, `description`, and optionally `check_command`, `check_output`, `check_passed` (execSync the check command, capture stdout, pass if exit code 0). Use same patterns as `step.js`.
- [x] 1.2 Register the prerequisite command in `src/cli.js`
- [x] 1.3 Add prerequisite to the extended help text in `src/cli.js` under EVIDENCE COMMANDS section
- [x] 1.4 Run tests to verify nothing broken

## 2. Prerequisite Warning on Evidence Commands

- [x] 2.1 Add `hasPrerequisites(evidence)` helper to `src/session.js` — returns true if any entry has `type: "prerequisite"`
- [x] 2.2 In `src/commands/evidence.js` `requireActiveSession()` — after finding the active session, check if evidence has prerequisites. If not, print warning to stderr: `Warning: No prerequisites recorded. Run \`proofrun prerequisite\` to record environment state first.`
- [x] 2.3 Run tests to verify warning logic doesn't break existing functionality

## 3. Report Prerequisites Section

- [x] 3.1 Update `buildReportData()` in `src/commands/report.js` — extract prerequisite entries into a separate `prerequisites` array in the report data (alongside `criteria` and `general_entries`)
- [x] 3.2 Update `templates/report.html` — add a "Prerequisites" section above the criteria list. Show each prerequisite with description and timestamp. If check was run, show command, output (truncated if long), and pass/fail badge. If no prerequisites exist, show warning text.
- [x] 3.3 Run tests to verify report generation still works

## 4. SKILL.md Updates

- [x] 4.1 Update `skills/proofrun/SKILL.md` — add "Record Prerequisites" as new workflow step after "Start Session" (before "Verify Each Criterion"). Instruct agent to record prerequisites with examples. State these are mandatory.
- [x] 4.2 Update SKILL.md "Set Up Environment" section — strengthen language: MUST build with latest changes, MUST verify dev server, MUST confirm device state
- [x] 4.3 Update SKILL.md "Principles" section — add "Re-verify by default" principle
- [x] 4.4 Add "Follow-Up Runs" section to SKILL.md after "Handle Human Feedback" — instruct agent to use same `--change` name with `--reason` flag, re-verify all criteria by default
- [x] 4.5 Add warning to SKILL.md "Knowledge Management" section — do NOT put change-specific data in knowledge files

## 5. Knowledge Template Updates

- [x] 5.1 Update `templates/knowledge/environment.md` — add "Build Verification" section with agent discovery instructions for confirming the running app includes latest changes
- [x] 5.2 Update `templates/knowledge/simulators.md` — restructure device info into "Stable (persists across sessions)" and "Observed (re-verify each session)" subsections within each platform section. Add warning about transient state.
- [x] 5.3 Update `templates/knowledge/context.md` — add bold warning at top: do NOT put change-specific criteria in this file, knowledge files persist across verifications

## 6. Final Verification

- [x] 6.1 Run full test suite, verify all tests pass
