## 1. Context Command

- [ ] 1.1 Update `src/commands/context.js` — separate `--list` from no-args behavior. When no change name and no `--list`: return project context (app_knowledge, interaction, simulator, boundaries, session) with `change_context: null`
- [ ] 1.2 Verify `proofrun context` (no args) returns valid JSON with all project context fields
- [ ] 1.3 Verify `proofrun context --list` still returns discovery instructions (unchanged)
- [ ] 1.4 Verify `proofrun context <change>` still returns full context (unchanged)

## 2. SKILL.md Rewrite

- [ ] 2.1 Rewrite "When to Trigger" section — broaden from "after implementation with ACs" to also include "when user requests verification of app behavior"
- [ ] 2.2 Rewrite "Gather Context" section — show both `proofrun context <change>` (structured) and `proofrun context` (free-form) paths
- [ ] 2.3 Replace "Classify Acceptance Criteria" with "Determine What to Verify" — cover both extracting ACs from artifacts and defining ACs from a query, with examples
- [ ] 2.4 Update "Start Session" section — document using descriptive slug for `--change` in free-form case
- [ ] 2.5 Review remaining sections (Verify, Report, Stop, Feedback) — ensure no language assumes structured-only flow
- [ ] 2.6 Update "Important Notes" — add guidance on keeping free-form ACs discrete and specific

## 3. Validation

- [ ] 3.1 Run `npx proofrun context` and verify JSON output matches expected schema
- [ ] 3.2 Run `npx proofrun --help` and verify help text doesn't assume structured-only usage
