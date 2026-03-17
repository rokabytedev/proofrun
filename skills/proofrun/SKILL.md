---
name: proofrun
description: AI agent verification workflow — verify mobile app behavior using simulator/emulator interaction, capture screenshot evidence, generate interactive HTML reports for human review. Use after implementing a change with UI acceptance criteria, OR when asked to verify app behavior. Triggers on verification requests, "/proofrun", "verify my changes", "test the implementation", "check if it works", or free-form app verification queries.
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
onboarding-flow-e2e     → Onboarding screens display correctly and can be navigated to completion
```

Classify each as agent-verifiable or human-required. Read `knowledge/boundaries` if available.

**If given a free-form query:** Break it into discrete, verifiable criteria.

Criteria can be added during exploration — you don't need to define them all upfront.

### 3. Set Up Environment

Follow `knowledge/environment` and `knowledge/devices` for platform-specific instructions.

#### Device Management

1. **Read `knowledge/devices`** for the device management policy.
   - If no policy is recorded yet, ask the human: **(1) Create a dedicated proofrun device pool** (recommended — no conflicts) or **(2) Use whatever device is available** (risk of conflicts).
   - Record the choice in `knowledge/devices`.

2. **Check device availability** before using any device:
   ```bash
   npx proofrun device status
   ```
   - If a device is **free** — proceed to use it.
   - If a device is **stale** (PID dead or session stopped) — use `--force-unlock` to take over.
   - If a device is **actively locked** — do NOT take it. Ask the human for approval first.
   - **Never use a device without locking it** via `proofrun session start`.

3. **If dedicated pool policy and no devices exist**, create a pool:
   - Research the latest OS version (e.g., `xcrun simctl list runtimes`)
   - Create ~3 devices with form factor variety:
     - Large phone, latest gen (e.g., "(Proofrun-only) iPhone 17 Pro Max")
     - Small phone, prior gen (e.g., "(Proofrun-only) iPhone 16")
     - Tablet (e.g., "(Proofrun-only) iPad Air 11")
   - Record the created devices in `knowledge/devices`

#### Build & Dev Server

1. **Build and install the app** with your latest changes (not a cached build)
2. **Check for port conflicts** before starting a dev server — another agent or process may be using the default port. Use an alternative port if needed.
3. **Verify the dev server** is running and connected (if applicable)
4. **Confirm the device** is in a clean state

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
- "verify the onboarding flow" → `--change "onboarding-flow-e2e"`

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

Review the criteria list. Confirm all have judgments before stopping the session.

### 9. Stop Session

```bash
npx proofrun session stop
```

Stop the session **before** generating the report. This releases the device lock immediately — don't hold the device hostage during report generation and human review, which can take a long time.

### 10. Generate Report

```bash
npx proofrun report --change <name>
```

This generates a multi-run report that aggregates all sessions for the change. If multiple runs exist, the report shows tabs for each run with carried/re-verified/new badges on criteria.

### 11. Serve Report for Live Feedback

Start the feedback server so the reviewer can submit feedback directly from the browser. **Run this as a background task** so you get notified when feedback arrives:

Run `npx proofrun serve --change <name>` as a **background task** (use your tool's background execution capability — do NOT run it in the foreground or you won't be able to continue working).

Once the server starts, tell the user:

> Your verification report is ready for review at http://localhost:PORT
>
> Please review each criterion — approve or reject with comments.
> Click **Submit Feedback** when done, or **LGTM** to approve everything.
> I'll be notified automatically when you submit and will address any feedback.

Then wait for the background task to complete. When it does, read the feedback from the latest session's `feedback.json`.

To stop a running server manually: `npx proofrun serve --stop`

### 12. Handle Feedback

When the background serve task completes (feedback received):

1. Read `feedback.json` from the latest session directory
2. Check the result:
   - **LGTM**: All criteria approved. Shut down the simulator/emulator to free system RAM. Done!
   - **Rejections**: For each rejected criterion, understand the comment and fix the issue. Then proceed to Follow-Up Runs.

### 13. Follow-Up Runs

When addressing feedback from rejected criteria:

1. Fix the code
2. Re-acquire a device (it was released at session stop). Check `proofrun device status` first.
3. Start a new session with the SAME `--change` name and a `--reason`:
   ```
   npx proofrun session start --change <same-name> --device <id> --reason "fix <what-changed>"
   ```
4. **Carry forward approved criteria** that your changes cannot affect:
   ```
   npx proofrun carry --criterion <name> --reason "No code changes affect this"
   ```
   This creates an audit trail linking to the prior run's judgment. The carried criterion inherits its prior approval in the multi-run report.

5. **Re-verify criteria** that your changes could affect — record fresh evidence and judgments.

6. Stop the session, generate the report, and serve again for feedback.

The multi-run report shows:
- **Carried** criteria with gray badge and carry reason (auto-approved if prior run was approved)
- **Re-verified** criteria with blue badge (needs new review)
- **New** criteria with purple badge (needs review)

**Decision: carry vs re-verify**: Carry only when your code changes absolutely cannot affect the criterion. When in doubt, re-verify. Carrying is faster but re-verifying is safer. Default to re-verifying everything unless you are certain.

## Principles

- **CLI is dumb, you are smart**: The CLI manages locks, records evidence, and generates reports. YOU decide what to verify, how to navigate, and what passes/fails.
- **Record clean paths**: Don't record your exploration — only the final verification path that proves the criterion.
- **Screenshots are proof**: Take screenshots at key verification points.
- **One criterion at a time**: Verify, record evidence, judge. Then move to the next.
- **Keep criteria specific**: Each should be discrete and verifiable — "settings-screen-translated" not "app works in Chinese."
- **Human-in-the-loop**: If stuck after 2 attempts, ask the user. Don't spiral.
- **Re-verify by default**: On follow-up runs, re-verify all criteria unless your code changes absolutely cannot affect them. When in doubt, re-verify.
- **Be a good citizen**: Never use a device without locking it. Don't take over active locks without human approval. Shut down devices when done.
- **Run `npx proofrun --help`** for complete command reference.

## Knowledge Management

Knowledge files at `.proofrun/knowledge/` are **working notes, not specifications**. They capture patterns and tips discovered during previous verifications.

### What to update (and where)

| Discovery | Target File |
|-----------|-------------|
| Build commands, dev server setup | `environment.md` |
| Element identifiers, testID conventions | `interaction.md` |
| Navigation patterns, interaction quirks | `interaction.md` |
| New devices added to pool, device policy | `devices.md` |
| Verification boundary discovered | `boundaries.md` |

### What NOT to put in knowledge files

- Current screen state or test observations (session-specific)
- Criteria names, judgments, or verification results (belong in session evidence)
- Temporary workarounds for this verification run
- Anything that will be different in the next session

### General guidelines

- Treat knowledge files as hints — verify against the actual app, not the knowledge file
- If you find something contradicts a knowledge file, update the file
- **Update immediately** when you discover something durable, not at the end of the session
- Create new topic files for distinct knowledge areas
