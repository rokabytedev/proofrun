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
- AND the app runs in a simulator

## Prerequisites

Before starting, verify proofrun is set up:

1. **Proofrun CLI**: Run `npx proofrun --help` (npx handles on-demand install)
2. **Proofrun config**: Check if `.proofrun/config.toml` exists. If not:
   - Detect project type (Expo? RN CLI?) from project files
   - Run `npx proofrun init --preset <detected>`
3. **Environment check**: Run `npx proofrun doctor` and address any failures
4. **Knowledge check**: Run `npx proofrun knowledge --list` to see available knowledge.
   Read the `interaction` topic for simulator tool setup instructions.

## Workflow

### 1. Gather Context

Get config and knowledge path:
```bash
npx proofrun context              # free-form verification
npx proofrun context <change>     # change-specific verification
```

Read relevant knowledge files:
```bash
npx proofrun knowledge interaction   # how to use the simulator tool
npx proofrun knowledge dev-server    # how to start the dev server
npx proofrun knowledge context       # how to find what to verify
npx proofrun knowledge boundaries    # what you can/cannot verify
```

Only read topics relevant to your task — don't load everything.

### 2. Determine What to Verify

**If verifying a change:** Follow the instructions in `knowledge/context` to find change artifacts. Extract numbered acceptance criteria. Classify each as agent-verifiable or human-required using `knowledge/boundaries`.

**If given a verification query:** Break the query into discrete, verifiable criteria. Assign AC numbers. Example:

Query: "Check all screens for missing Chinese translations"
→ AC 1: Home screen — all visible strings translated
→ AC 2: Settings screen — all visible strings translated
→ AC 3: Library screen — all visible strings translated
→ ... (discover more as you explore the app)

ACs can be added during exploration — you don't need to define them all upfront.

### 3. Set Up Environment

Based on knowledge files:
1. Start the dev server (follow `knowledge/dev-server`)
2. Boot and connect to a simulator (follow `knowledge/simulators`)
3. Install and launch the app

### 4. Start Session

```bash
npx proofrun session start --change <name>
```

For structured verification, use the change name. For free-form, use a descriptive slug:
- "check Chinese translations" → `--change "chinese-locale-audit"`
- "verify recording flow" → `--change "recording-flow-e2e"`

This acquires a simulator slot and port lock. If a session is already active, stop it first with `npx proofrun session stop`.

### 5. Verify Each Criterion (Explore-Then-Document)

For each agent-verifiable criterion:

**Explore phase** (not recorded):
- Use the simulator interaction tool freely
- Navigate to the relevant screen
- Try different paths, find elements, verify behavior

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

**For human-required criteria**:
```bash
npx proofrun judge --ac 4 --human "Cannot verify audio output — requires human listener"
```

### 6. Check Progress

```bash
npx proofrun evidence
```

Compare the returned AC list against your criteria. Verify all have judgments.

### 7. Generate Report

```bash
npx proofrun report --open
```

Tell the user the report is ready and provide the file path.

### 8. Clean Up

```bash
npx proofrun session stop
```

Stop the dev server and simulator. Always stop the session — this releases locks for other agents.

### 9. Update Knowledge

After verification, update `.proofrun/knowledge/` with anything you discovered:
- Navigation paths and screen transitions
- Element identifiers and naming patterns
- Timing quirks (animation waits, debounce delays)
- Anything that would make the next verification faster

Create new topic files for distinct knowledge areas. Keep notes generic — useful across sessions, not session-specific.

### 10. Handle Human Feedback

If the user provides feedback (via the report's Export Feedback button → JSON file):
1. Read the exported feedback JSON
2. For each rejected criterion: understand the comment, fix the issue
3. Start a new session and re-verify rejected criteria
4. Generate a new report

## Important Notes

- **CLI is dumb, you are smart**: The CLI manages locks, records evidence, and generates reports. YOU decide what to verify, how to navigate, and what passes/fails.
- **Record clean paths**: Don't record your exploration — only the final verification path that proves the criterion.
- **Run `npx proofrun --help` for complete command reference**.
- **One criterion at a time**: Verify, record evidence, judge. Then move to the next.
- **Screenshots are proof**: Take screenshots at key verification points.
- **Keep criteria specific**: Each should be discrete and verifiable — "Home screen has no missing translations" not "app works in Chinese."

## Knowledge Management

Knowledge files at `.proofrun/knowledge/` are **working notes, not specifications**. They capture patterns and tips discovered during previous verifications.

- Treat them as hints — verify against the actual app, not the knowledge file
- If you find something contradicts a knowledge file, update the file
- Knowledge files are advisory — the app is the source of truth
