---
name: proofrun
description: AI agent verification workflow — verify implementation or app behavior using simulator interaction, capture screenshot evidence, generate interactive HTML reports for human review. Use after implementing a change with UI acceptance criteria, OR when asked to verify app behavior (e.g., "check Chinese locale translations", "verify the recording flow works"). Triggers on verification requests, "/proofrun", "verify my changes", "test the implementation", "check if it works", or free-form app verification queries.
---

# Proofrun — Verification Workflow

You are an AI agent verifying app behavior by interacting with a running app in a simulator and producing an auditable evidence report.

## Core Principle: Update Knowledge Continuously

Update `.proofrun/knowledge/` **the moment you learn something** — a navigation path, an element identifier, a timing quirk. Do not wait until the end. Knowledge files are shared working notes; the next verification (or re-run) depends on what you capture now.

## When to Trigger

Use proofrun when:
- You have completed implementing a change with verifiable acceptance criteria, OR
- The user asks you to verify something about the app (e.g., "check all screens for missing translations", "verify the onboarding flow works end-to-end")
- AND the app runs in a simulator

## Prerequisites

Before starting:

1. **Proofrun CLI**: Run `npx proofrun --help` (npx handles on-demand install)
2. **Proofrun config**: Check if `.proofrun/config.toml` exists. If not:
   - Detect project type (Expo? RN CLI?) from project files
   - Run `npx proofrun init --preset <detected>`
3. **Run proofrun info**:
   ```bash
   npx proofrun info
   ```
   This shows config, knowledge topics, active session, and diagnostics in one command.

## Workflow

### 1. Orient

```bash
npx proofrun info
```

Read the output:
- **Knowledge topics listed?** Read the relevant ones before proceeding.
- **Active session?** Stop it first if you didn't start it.
- **Diagnostics all pass?** Fix any failures before continuing.

Read relevant knowledge files:
```bash
npx proofrun knowledge environment    # how to build, install, run the app
npx proofrun knowledge interaction    # how to use the simulator interaction tool
npx proofrun knowledge simulators     # how to discover/create simulators
```

**First-time setup:** If knowledge files contain `<!-- Agent:` placeholders, you **MUST** fill them in before proceeding. Read the current knowledge file, explore to find the answers (build commands, connection method, etc.), and update the file. Do not skip this step — placeholders mean the knowledge is incomplete.

Only read topics relevant to your task — don't load everything.

### 2. Plan What to Verify

**If verifying a change:** Find the change artifacts (PR description, task file, spec). Extract acceptance criteria and assign descriptive names:

```
settings-translated     → All Settings screen labels show correct translations
library-search-works    → Library search returns results and is navigable
recording-flow-e2e      → Record → playback → delete flow completes without errors
```

Classify each as agent-verifiable or human-required. Read `knowledge/boundaries` if available.

**If given a free-form query:** Break it into discrete, verifiable criteria. Example:

> "Check all screens for missing Chinese translations"
> → `home-translated`, `settings-translated`, `library-translated`, `profile-translated`

Criteria can be added during exploration — you don't need to define them all upfront.

### 3. Set Up Environment

Based on the `environment` knowledge file:

1. **Discover or create a simulator** — get its UDID (e.g., `xcrun simctl list devices`)
2. **Boot the simulator** if not running
3. **Build and install the app** on the simulator
4. **Start the dev server** if the project needs one

Update `knowledge/environment` with everything you discover (commands, UDIDs, connection steps).

### 4. Verify Environment (Checkpoint)

Before starting a session, confirm:
- Is this the correct simulator (right device type, OS version)?
- Is it a fresh build (not a cached stale build)?
- If using a dev server: is it running and the app connected?
- Can you interact with the app (tap a button, see a screen)?

If any of these fail, fix them before starting the session. Record what you learned in knowledge files.

If you can't figure something out after 2 attempts, **pause and ask the user** — don't guess.

### 5. Start Session

```bash
npx proofrun session start --change <name> --simulator <UDID>
```

Use a descriptive slug for `--change`:
- "check Chinese translations" → `--change "chinese-locale-audit"`
- "verify recording flow" → `--change "recording-flow-e2e"`

The UDID is the simulator you verified in step 4. If another session is active, stop it first with `npx proofrun session stop`.

### 6. Verify Each Criterion (Explore-Then-Document)

For each agent-verifiable criterion:

**Explore phase** (not recorded):
- Use the simulator interaction tool freely
- Navigate to the relevant screen
- Try different paths, find elements, verify behavior
- Update knowledge files as you discover things

**Document phase** (recorded via proofrun):
- Once you've confirmed the verification path, record the clean steps:

```bash
npx proofrun step "Navigate to Settings tab" --criterion settings-translated --command "iosef tap --identifier tab-bar-settings"
npx proofrun screenshot /tmp/screen.jpeg --criterion settings-translated --note "Settings screen with all labels visible"
npx proofrun judge --criterion settings-translated --pass "All 12 labels use Chinese text, no English fallback visible"
```

**If a criterion fails**:
1. Record the failure: `npx proofrun judge --criterion settings-translated --fail "3 labels still show English: 'Privacy', 'Notifications', 'Account'"`
2. Fix the code (if verifying your own implementation)
3. Record the fix: `npx proofrun fix --criterion settings-translated --description "Added missing zh-Hans translations for Privacy, Notifications, Account keys"`
4. Re-verify and record new judgment

**For human-required criteria**:
```bash
npx proofrun judge --criterion audio-playback-quality --human "Cannot verify audio output quality — requires human listener"
```

### 7. Check Progress

```bash
npx proofrun evidence
```

Review the criteria list. Confirm all have judgments before generating the report.

### 8. Generate Report

```bash
npx proofrun report --open
```

Tell the user the report is ready and provide the file path.

### 9. Clean Up

```bash
npx proofrun session stop
```

Stop the dev server and leave the simulator as-is (or shut it down if appropriate). Always stop the session — this releases the simulator lock.

### 10. Update Knowledge

After each verification, review what you learned and make sure it's in the knowledge files:
- Navigation paths that weren't documented
- Element identifiers and naming patterns
- Timing quirks (animation waits, debounce delays)
- Connection or build steps that weren't obvious

Create new topic files for distinct knowledge areas. Keep notes generic — useful across sessions, not session-specific.

### 11. Handle Human Feedback

If the user provides feedback (via the report's Export Feedback button → JSON file):
1. Read the exported feedback JSON
2. For each rejected criterion: understand the comment, fix the issue
3. Start a new session and re-verify rejected criteria
4. Generate a new report

## Important Notes

- **CLI is dumb, you are smart**: The CLI manages locks, records evidence, and generates reports. YOU decide what to verify, how to navigate, and what passes/fails.
- **Record clean paths**: Don't record your exploration — only the final verification path that proves the criterion.
- **Run `npx proofrun --help`** for complete command reference.
- **One criterion at a time**: Verify, record evidence, judge. Then move to the next.
- **Screenshots are proof**: Take screenshots at key verification points.
- **Keep criteria specific**: Each should be discrete and verifiable — "settings-screen-translated" not "app works in Chinese."
- **Human-in-the-loop**: If stuck after 2 attempts, ask the user. Don't spiral.

## Knowledge Management

Knowledge files at `.proofrun/knowledge/` are **working notes, not specifications**. They capture patterns and tips discovered during previous verifications.

- Treat them as hints — verify against the actual app, not the knowledge file
- If you find something contradicts a knowledge file, update the file
- Knowledge files are advisory — the app is the source of truth
- **Update immediately** when you discover something, not at the end of the session
