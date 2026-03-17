---
name: proofrun
description: AI agent verification workflow — verify mobile app behavior using simulator/emulator interaction, capture screenshot evidence, generate interactive HTML reports for human review. Use after implementing a change with UI acceptance criteria, OR when asked to verify app behavior (e.g., "check Chinese locale translations", "verify the recording flow works"). Triggers on verification requests, "/proofrun", "verify my changes", "test the implementation", "check if it works", or free-form app verification queries.
---

# Proofrun — Mobile App Verification

You are an AI agent producing provable verification evidence for mobile app behavior. You interact with a running app in a simulator or emulator, capture auditable evidence (steps, screenshots, judgments), and generate an interactive HTML report for human review.

The report is your proof of work — without it, you're just claiming you verified something.

## When to Trigger

Use proofrun when:
- You have completed implementing a change with verifiable acceptance criteria, OR
- The user asks you to verify something about the app (e.g., "check all screens for missing translations", "verify the onboarding flow works end-to-end")
- AND the app runs in a simulator or emulator

## Getting Started

1. **Ensure proofrun is available**: `npx proofrun --help`
2. **Check project readiness**: `npx proofrun info`
3. Fix any issues reported — the output tells you how.
4. **Read relevant knowledge**: `npx proofrun knowledge <topic>`
   Fill in any `<!-- Agent: ... -->` placeholder sections before proceeding.
   **Do NOT put change-specific data in knowledge files** — they persist across verifications.

## Workflow

### 1. Orient

```bash
npx proofrun info
```

Read the output:
- **Knowledge topics listed?** Read the relevant ones before proceeding.
- **Active session?** Stop it first if you didn't start it.
- **Diagnostics all pass?** Fix any failures before continuing.

Read relevant knowledge files. Only load topics relevant to your task.

**First-time setup:** If knowledge files contain `<!-- Agent:` placeholders, you **MUST** fill them in before proceeding. Explore the project, find the answers, and update the files.

### 2. Plan What to Verify

**If verifying a change:** Find the change artifacts (PR description, task file, spec). Extract acceptance criteria and assign descriptive names:

```
settings-translated     → All Settings screen labels show correct translations
library-search-works    → Library search returns results and is navigable
recording-flow-e2e      → Record → playback → delete flow completes without errors
```

Classify each as agent-verifiable or human-required. Read `knowledge/boundaries` if available.

**If given a free-form query:** Break it into discrete, verifiable criteria.

Criteria can be added during exploration — you don't need to define them all upfront.

### 3. Set Up Environment

Follow `knowledge/environment` and `knowledge/simulators` for platform-specific instructions. You **MUST**:

1. **Discover or create a device** — get its identifier
2. **Boot the device** if not running
3. **Build and install the app** with your latest changes (not a cached build)
4. **Verify the dev server** is running and connected (if applicable)
5. **Confirm the device** is in a clean state

Update knowledge files with everything you discover.

### 4. Verify Environment (Checkpoint)

Before starting a session, confirm:
- Is this the correct device (right type, OS version)?
- Is it a fresh build (not cached/stale)?
- If using a dev server: is it running and the app connected?
- Can you interact with the app (tap a button, see a screen)?

If any of these fail, fix them before starting the session.

### 5. Start Session

```bash
npx proofrun session start --change <name> --device <identifier>
```

Use a descriptive slug for `--change`:
- "check Chinese translations" → `--change "chinese-locale-audit"`
- "verify recording flow" → `--change "recording-flow-e2e"`

If another session is active, stop it first with `npx proofrun session stop`.

### 6. Record Prerequisites

After starting a session, record environment prerequisites before any verification:

```bash
npx proofrun prerequisite "App rebuilt at <timestamp>" --check "<build verify command>"
npx proofrun prerequisite "Dev server running" --check "curl -s http://localhost:8081/status"
npx proofrun prerequisite "Device: iPhone 17 Pro Max, iOS 26.2"
```

These are mandatory. Do not record verification evidence until prerequisites are captured.

### 7. Verify Each Criterion (Explore-Then-Document)

For each agent-verifiable criterion:

**Explore phase** (not recorded):
- Use the interaction tool freely
- Navigate to the relevant screen
- Try different paths, find elements, verify behavior
- Update knowledge files as you discover things

**Document phase** (recorded via proofrun):
- Once you've confirmed the verification path, record the clean steps:

```bash
npx proofrun step "Navigate to Settings tab" --criterion settings-translated
npx proofrun screenshot /tmp/screen.jpeg --criterion settings-translated --note "Settings screen with all labels visible"
npx proofrun judge --criterion settings-translated --pass "All 12 labels use Chinese text, no English fallback visible"
```

**If a criterion fails**:
1. Record the failure: `npx proofrun judge --criterion <name> --fail "<reasoning>"`
2. Fix the code (if verifying your own implementation)
3. Record the fix: `npx proofrun fix --criterion <name> --description "<what you fixed>"`
4. Re-verify and record new judgment

**For human-required criteria**:
```bash
npx proofrun judge --criterion audio-playback-quality --human "Cannot verify audio output quality — requires human listener"
```

### 8. Check Progress

```bash
npx proofrun evidence
```

Review the criteria list. Confirm all have judgments before generating the report.

### 9. Generate Report

```bash
npx proofrun report --open
```

Tell the user the report is ready and provide the file path.

### 10. Clean Up

```bash
npx proofrun session stop
```

Stop the dev server if appropriate. Always stop the session — this releases the device lock.

### 11. Handle Human Feedback

If the user provides feedback (via the report's Export Feedback button → JSON file):
1. Read the exported feedback JSON
2. For each rejected criterion: understand the comment, fix the issue
3. Start a new session and re-verify rejected criteria
4. Generate a new report

### 12. Follow-Up Runs

When addressing feedback from a rejected criterion:
1. Fix the code
2. Start a new session with the SAME `--change` name and a `--reason`:
   ```
   npx proofrun session start --change <same-name> --device <id> --reason "fix <what-changed>"
   ```
3. Re-verify ALL criteria by default. Only skip re-verification if your changes absolutely cannot affect a criterion.

## Principles

- **CLI is dumb, you are smart**: The CLI manages locks, records evidence, and generates reports. YOU decide what to verify, how to navigate, and what passes/fails.
- **Record clean paths**: Don't record your exploration — only the final verification path that proves the criterion.
- **Update knowledge immediately**: Update `.proofrun/knowledge/` the moment you learn something — a navigation path, an element identifier, a timing quirk. Do not wait until the end.
- **Screenshots are proof**: Take screenshots at key verification points.
- **One criterion at a time**: Verify, record evidence, judge. Then move to the next.
- **Keep criteria specific**: Each should be discrete and verifiable — "settings-screen-translated" not "app works in Chinese."
- **Human-in-the-loop**: If stuck after 2 attempts, ask the user. Don't spiral.
- **Re-verify by default**: On follow-up runs, re-verify all criteria unless your code changes absolutely cannot affect them. When in doubt, re-verify.
- **Run `npx proofrun --help`** for complete command reference.

## Knowledge Management

Knowledge files at `.proofrun/knowledge/` are **working notes, not specifications**. They capture patterns and tips discovered during previous verifications.

- Treat them as hints — verify against the actual app, not the knowledge file
- If you find something contradicts a knowledge file, update the file
- Knowledge files are advisory — the app is the source of truth
- **Update immediately** when you discover something, not at the end of the session
- Create new topic files for distinct knowledge areas
- **Do NOT put change-specific data in knowledge files** — they persist across verifications. Change-specific criteria and verification details belong in session evidence, not here.
