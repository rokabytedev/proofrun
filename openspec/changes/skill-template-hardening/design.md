## Context

A real-world test run of proofrun on a React Native/Expo project (accent.ai) exposed several gaps: the agent didn't verify the build was fresh, baked change-specific criteria into persistent knowledge files, reused a device without verifying its state, and never confirmed the dev server was running. The SKILL.md's "Verify environment checkpoint" was too soft — the agent skipped it with no consequence.

## Goals / Non-Goals

**Goals:**
- Make environment verification auditable via a `prerequisite` command
- Warn the agent (via CLI) if it records evidence without prerequisites
- Strengthen SKILL.md to mandate build verification, follow-up run conventions, and re-verification defaults
- Improve knowledge templates to distinguish stable vs transient facts and prevent session-specific pollution

**Non-Goals:**
- Multi-run report support (separate change)
- Live feedback server (separate change)
- Changing the evidence/report data format beyond adding `prerequisite` entry type

## Decisions

### 1. `proofrun prerequisite` command

New command that records an environment prerequisite evidence entry:

```bash
npx proofrun prerequisite "Dev server running on port 8081"
npx proofrun prerequisite "App rebuilt with latest changes" --check "curl -s http://localhost:8081/status"
```

Implementation in `src/commands/prerequisite.js`:
- Takes a required `<description>` argument
- Optional `--check <command>` flag: runs the command, captures stdout/stderr, records pass/fail
- Appends to evidence.json with `type: "prerequisite"`
- Requires an active session (same pattern as `step`, `screenshot`, etc.)

Evidence entry shape:
```json
{
  "type": "prerequisite",
  "description": "Dev server running on port 8081",
  "check_command": "curl -s http://localhost:8081/status",
  "check_output": "packager-status:running",
  "check_passed": true,
  "id": 1,
  "timestamp": "2026-03-17T10:00:00Z"
}
```

When no `--check` is provided, `check_command`, `check_output`, and `check_passed` are omitted. The prerequisite is treated as a manual attestation by the agent.

### 2. Prerequisite warning on other evidence commands

When `step`, `screenshot`, `judge`, `note`, or `fix` is called and no `prerequisite` entries exist in the current session's evidence, print a warning to stderr:

```
Warning: No prerequisites recorded. Run `proofrun prerequisite` to record environment state first.
```

This is a warning, not an error — the command still succeeds. The warning is a nudge, not a gate. Implementation: add a helper `hasPrerequisites(evidence)` to `src/session.js` and call it in the `requireActiveSession` helper in `src/commands/evidence.js`.

### 3. Report prerequisites section

The report template shows prerequisites in a dedicated section above the criteria list. Each prerequisite displays:
- Description
- If a check was run: the command, output, and pass/fail badge
- Timestamp

If no prerequisites exist, the section shows a warning: "No environment prerequisites were recorded for this session."

### 4. SKILL.md updates

**Getting Started section** — after "Run `proofrun info`", add:

> Read knowledge files and fill in placeholders. **Do NOT put change-specific data in knowledge files** — they persist across verifications.

**Workflow section 3 (Set Up Environment)** — strengthen to:

> Follow knowledge files for platform-specific instructions. You MUST:
> - Build and install the app with your latest changes (not a cached build)
> - Verify the dev server is running and connected (if applicable)
> - Confirm the device is in a clean state

**New workflow section after Start Session** — "Record Prerequisites":

> After starting a session, record environment prerequisites before any verification:
> ```bash
> npx proofrun prerequisite "App rebuilt at <timestamp>" --check "<build verify command>"
> npx proofrun prerequisite "Dev server running" --check "curl -s http://localhost:8081/status"
> npx proofrun prerequisite "Device: iPhone 17 Pro Max, iOS 26.2"
> ```
> These are mandatory. Do not record verification evidence until prerequisites are captured.

**Principles section** — add:

> - **Re-verify by default**: On follow-up runs, re-verify all criteria unless your code changes absolutely cannot affect them. When in doubt, re-verify.

**New section: Follow-Up Runs** — add after Handle Human Feedback:

> When addressing feedback from a rejected criterion:
> 1. Fix the code
> 2. Start a new session with the SAME `--change` name and a `--reason`:
>    ```
>    npx proofrun session start --change <same-name> --device <id> --reason "fix <what-changed>"
>    ```
> 3. Re-verify ALL criteria by default. Only skip re-verification if your changes absolutely cannot affect a criterion.

### 5. Knowledge template updates

**`templates/knowledge/environment.md`** — add new section:

```markdown
## Build Verification
<!-- Agent: How do you confirm the running app includes your latest changes?
     For JS-only changes (hot reload): verify Metro is running and connected
     For native changes: you MUST rebuild and reinstall
     Record the build timestamp or version command here.
     What command shows the current build version/timestamp? -->
```

**`templates/knowledge/simulators.md`** — restructure device sections:

```markdown
### Stable (persists across sessions)
<!-- Agent: Device identifiers, OS versions, device names.
     These don't change between verification runs. -->

### Observed (re-verify each session — may be stale)
<!-- Agent: DO NOT store transient state here (current screen, app state).
     Instead, verify these each session and record as prerequisites. -->
```

**`templates/knowledge/context.md`** — add warning:

```markdown
**IMPORTANT**: Do NOT put change-specific criteria or verification details in this file.
Knowledge files persist across verifications. Change-specific context belongs in the
session evidence, not here. This file is for reusable project-level discovery patterns.
```

## Risks / Trade-offs

**Prerequisite warning is soft**: It's a stderr warning, not a hard error. This is intentional — we don't want the CLI to block legitimate use cases (e.g., adding a note to a session that doesn't need environment checks). The SKILL.md instruction is the primary enforcement mechanism.

**SKILL.md is longer**: Adding follow-up run instructions and prerequisite requirements adds content. Mitigated by clear section headers and the agent only reading relevant sections.
