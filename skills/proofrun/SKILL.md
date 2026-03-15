---
name: proofrun
description: AI agent verification workflow — verify implementation against acceptance criteria using simulator interaction, capture screenshot evidence, generate interactive HTML reports for human review
---

# Proofrun — Verification Workflow

You are an AI agent that has just implemented a feature. This skill teaches you how to verify your work against acceptance criteria by interacting with the running app and producing an auditable evidence report.

## When to Trigger

Trigger proofrun verification when ALL of these are true:
- You have completed implementing a change (feature, fix, etc.)
- Acceptance criteria exist for the change
- The app runs in a simulator (iOS first, via iosef)
- The user has not explicitly said to skip verification

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

```bash
npx proofrun context <change-name>
```

This returns instructions (not content) for gathering:
- **Change context**: What was implemented, where to find specs/ACs
- **App knowledge**: How to discover app navigation and behavior
- **Interaction config**: Which tool/strategy to use
- **Boundaries**: What you can vs. cannot verify

Follow the returned instructions — run the discovery commands, read the specified files.

### 2. Classify Acceptance Criteria

For each AC, classify as:
- **Agent-verifiable**: Element visibility, navigation, text content, form inputs, gestures, state persistence
- **Human-required**: Audio output, haptic feedback, performance, real-device-only features, VoiceOver/accessibility announcements

Read the boundaries file (from context output) for the full classification guide. If the project has `.proofrun/boundaries.md`, use that. Otherwise, read `references/boundaries-template.md` from this skill.

### 3. Start Session

```bash
npx proofrun session start --change <change-name> [--device <type>]
```

This acquires a simulator slot and port, starts the dev server, and waits for it to be ready.

### 4. Verify Each AC (Explore-Then-Document)

For each agent-verifiable AC:

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

**If an AC fails**:
1. Record the failure: `npx proofrun judge --ac 3 --fail "Clear button not found — missing testID"`
2. Fix the code
3. Record the fix: `npx proofrun fix --ac 3 --description "Added testID='library-search-clear' to SearchBar clear icon"`
4. Re-verify and record new judgment
5. Max retries per AC: check `session.max_retries_per_ac` from context output

**For human-required ACs**:
```bash
npx proofrun judge --ac 4 --human "Cannot verify audio output — requires human listener"
```

### 5. Check Progress

```bash
npx proofrun evidence
```

Compare the returned AC list against your full list of ACs. Verify all ACs have judgments.

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
2. For each rejected AC: understand the comment, fix the issue
3. Start a new session and re-verify rejected ACs
4. Generate a new report

## Important Notes

- **CLI is dumb, you are smart**: The CLI just records what you tell it. YOU decide what to verify, how to navigate, and what passes/fails.
- **Record clean paths**: Don't record your exploration — only the final verification path that proves the AC.
- **Run `npx proofrun --help` for complete command reference** — exact syntax, all arguments, examples.
- **One AC at a time**: Verify, record evidence, judge. Then move to the next AC.
- **Screenshots are proof**: Take screenshots at key verification points. They're embedded in the report.
