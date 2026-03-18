## 1. Plan Command

- [x] 1.1 Create `src/commands/plan.js` with `plan add`, `plan list`, `plan check` subcommands
  - `plan add --criterion <name> --spec "<text>" [--cases "..." --cases "..."] [--carried]`
  - Stores `plan.json` in the active session directory
  - Duplicate criterion name → error
  - `plan list` shows criteria with verification status (checked against evidence judgments), summary line
  - `plan check` compares plan vs evidence, lists unverified criteria and unplanned criteria
- [x] 1.2 Register plan command in `src/cli.js` and add to HELP_TEXT under a new PLAN COMMANDS section
- [x] 1.3 Write tests for plan command: add, list, check, duplicate, no session, carried flag

## 2. CLI Guardrails — Judge Screenshot Warning

- [x] 2.1 In `src/commands/evidence.js`, add screenshot check to the judge action: load evidence, check for screenshots with matching criterion, print warning to stderr if none found
- [x] 2.2 Write test for judge screenshot warning: judgment with screenshot (no warning), judgment without screenshot (warning printed)

## 3. CLI Guardrails — Session Stop Warnings

- [x] 3.1 In `src/commands/session.js` stop action, add knowledge placeholder scan: read `.md` files in `config._knowledgeDir`, check for `<!-- Agent:` regex, list files with unfilled placeholders as warning
- [x] 3.2 In `src/commands/session.js` stop action, add plan coverage check: load `plan.json` from session dir, compare against evidence judgments, warn about unverified criteria
- [x] 3.3 Write tests for session stop warnings: unfilled placeholders, all filled, no knowledge dir, plan with gaps, plan fully verified, no plan

## 4. SKILL.md Workflow Updates

- [x] 4.1 Insert new step 7 "Create Verification Plan" between prerequisites and verify: read all spec/AC, run `proofrun plan add` for each, add test cases for breadth (representative samples, all entry points, edge cases), run `proofrun plan list` to review
- [x] 4.2 Update step 8 (Verify Each Criterion): add screenshot enforcement instruction — "Every judgment MUST be preceded by at least one screenshot. Do not judge without visual evidence."
- [x] 4.3 Update step 9 (Check Progress): add `proofrun plan check` alongside `proofrun evidence`
- [x] 4.4 Update step 12 (Handle Feedback): add instruction to read `top_level_comment` and act on scope expansion requests; fix LGTM device cleanup to check `proofrun device status` first — only shut down free devices
- [x] 4.5 Strengthen device policy prompt in step 3: change to imperative STOP instruction that applies even in autopilot mode
- [x] 4.6 Add principle: "Verify completely — create a verification plan that covers all spec criteria. Don't cherry-pick."

## 5. Knowledge Template Updates

- [x] 5.1 Add "Device Cleanup" section to `templates/knowledge/devices.md`: check device status before cleanup, only shut down free devices, don't leave devices running after verification
