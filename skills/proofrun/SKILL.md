---
name: proofrun
description: AI agent verification workflow — verify implementation or app behavior using simulator interaction, capture screenshot evidence, generate interactive HTML reports for human review. Use after implementing a change with UI acceptance criteria, OR when asked to verify app behavior (e.g., "check Chinese locale translations", "verify the recording flow works"). Triggers on verification requests, "/proofrun", "verify my changes", "test the implementation", "check if it works", or free-form app verification queries.
---

# Proofrun — Verification Workflow

You are an AI agent verifying app behavior by interacting with a running app in a simulator and producing an auditable evidence report.

## When to Trigger

Use proofrun when:
- You have completed implementing a change with verifiable acceptance criteria, OR
- The user asks you to verify something about the app (e.g., "check all screens for missing translations", "verify the onboarding flow works end-to-end")
- AND the app runs in a simulator (iOS first, via iosef)

## Prerequisites

Before starting, verify these are available:

1. **Simulator interaction tool**: Run `iosef --help`. If not available: `npx skills add riwsky/iosef@ios-simulator-interaction -g`
2. **Proofrun CLI**: Run `npx proofrun --help` (npx handles on-demand install)
3. **Proofrun config**: Check if `.proofrun/config.yaml` exists. If not:
   - Detect project type (Expo? RN CLI?) from project files
   - Run `npx proofrun init --preset <detected>`
   - Review generated config, fill in bundle_id and display_name
4. **Environment check**: Run `npx proofrun doctor` and address any failures

## Workflow

### 1. Gather Context

**If verifying a specific change:**
```bash
npx proofrun context <change-name>
```

**If verifying app behavior (free-form query):**
```bash
npx proofrun context
```

Both return project context: app knowledge, interaction config, device types, boundaries. The change-scoped version additionally returns change-specific context (artifact locations, commands).

If you need to discover available change names, run `npx proofrun context --list` first.

Follow the returned instructions — run discovery commands, read relevant files to understand the app.

### 2. Determine What to Verify

**If verifying a change:** Follow the context instructions to read change artifacts. Extract numbered acceptance criteria. Classify each as agent-verifiable or human-required using the boundaries guide.

**If given a verification query:** Break the query into discrete, verifiable criteria. Assign AC numbers. Example:

Query: "Check all screens for missing Chinese translations"
→ AC 1: Home screen — all visible strings translated
→ AC 2: Settings screen — all visible strings translated
→ AC 3: Library screen — all visible strings translated
→ ... (discover more as you explore the app)

ACs can be added during exploration — you don't need to define them all upfront. Keep each criterion specific and verifiable via the simulator.

For both cases, read the boundaries file (from context output) to classify what you can vs. cannot verify. If the project has `.proofrun/boundaries.md`, use that. Otherwise, read `references/boundaries-template.md` from this skill.

### 3. Start Session

```bash
npx proofrun session start --change <name> [--device <type>]
```

For structured verification, use the change name. For free-form, use a descriptive slug:
- "check Chinese translations" → `--change "chinese-locale-audit"`
- "verify recording flow" → `--change "recording-flow-e2e"`

This acquires a simulator slot and port, starts the dev server, and waits for it to be ready. If a session is already active, stop it first with `npx proofrun session stop`.

### 4. Verify Each Criterion (Explore-Then-Document)

For each agent-verifiable criterion:

**Explore phase** (not recorded):
- Use the simulator interaction tool (iosef) freely
- Navigate to the relevant screen
- Try different paths, find elements, verify behavior
- This is messy — wrong taps, backtracking is normal

**Document phase** (recorded via proofrun):
- Once you've confirmed the verification path, record the clean steps:

```bash
npx proofrun step "Navigate to Library tab" --ac 1 --command "iosef tap --identifier tab-bar-library"
npx proofrun screenshot /tmp/screen.jpeg --ac 1 --note "Library screen with search bar"
npx proofrun judge --ac 1 --pass "Search bar found at (398,98) via iosef find --identifier library-search-input"
```

**If a criterion fails**:
1. Record the failure: `npx proofrun judge --ac 3 --fail "Clear button not found — missing testID"`
2. Fix the code (if verifying your own implementation)
3. Record the fix: `npx proofrun fix --ac 3 --description "Added testID='library-search-clear' to SearchBar clear icon"`
4. Re-verify and record new judgment
5. Max retries per AC: check `session.max_retries_per_ac` from context output

**For human-required criteria**:
```bash
npx proofrun judge --ac 4 --human "Cannot verify audio output — requires human listener"
```

### 5. Check Progress

```bash
npx proofrun evidence
```

Compare the returned AC list against your criteria. Verify all have judgments before generating the report.

### 6. Generate Report

```bash
npx proofrun report --open
```

This creates a self-contained interactive HTML report with embedded screenshots. Tell the user the report is ready and provide the file path.

### 7. Release Resources

```bash
npx proofrun session stop
```

Always stop the session when done — this releases simulator and port locks for other agents.

### 8. Handle Human Feedback

If the user provides feedback (via the report's Export Feedback button → JSON file):
1. Read the exported feedback JSON
2. For each rejected criterion: understand the comment, fix the issue
3. Start a new session and re-verify rejected criteria
4. Generate a new report

## Important Notes

- **CLI is dumb, you are smart**: The CLI just records what you tell it. YOU decide what to verify, how to navigate, and what passes/fails.
- **Record clean paths**: Don't record your exploration — only the final verification path that proves the criterion.
- **Run `npx proofrun --help` for complete command reference** — exact syntax, all arguments, examples.
- **One criterion at a time**: Verify, record evidence, judge. Then move to the next.
- **Screenshots are proof**: Take screenshots at key verification points. They're embedded in the report.
- **Keep criteria specific**: Whether extracted from artifacts or defined from a query, each criterion should be discrete and verifiable — "Home screen has no missing translations" not "app works in Chinese."
