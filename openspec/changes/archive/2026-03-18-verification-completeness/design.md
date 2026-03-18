## Context

Real-world testing revealed that the proofrun agent produces shallow verification — covering happy paths for a fraction of spec criteria. The agent also ignored the reviewer's top-level feedback comment requesting broader coverage, and sometimes submitted judgments without screenshots.

The core issue is that there's no structured planning step between environment setup and execution. The agent jumps straight into ad-hoc verification without mapping the full scope of what needs testing. There are also no CLI-level nudges when the agent skips important steps.

### Current workflow
```
Orient → Plan (ad-hoc) → Environment → Session → Prerequisites → Verify → Evidence → Stop → Report → Serve → Feedback
```

### Proposed workflow
```
Orient → Plan (ad-hoc) → Environment → Session → Prerequisites → Plan (structured) → Verify → Evidence → Stop → Report → Serve → Feedback
```

The **structured plan phase** is inserted between prerequisites and verification. It requires the agent to explicitly map every spec acceptance criterion to a proofrun criterion with concrete test cases before recording any evidence.

## Goals / Non-Goals

**Goals:**
- Force completeness: agent must map all spec criteria before executing
- Provide coverage visibility: `plan check` shows gaps at any time
- Nudge good behavior: CLI warns on missing screenshots and unfilled placeholders
- Fix feedback handling: agent reads and acts on top-level comments
- Fix device cleanup: agent checks lock status before shutting down devices

**Non-Goals:**
- Hard enforcement (the CLI remains "dumb" — it warns, doesn't block)
- Automated criterion generation from specs (agent does the thinking)
- Changes to the report format or evidence structure
- Changes to the plan command ergonomics beyond what's specified

## Decisions

### 1. Plan storage: `plan.json` in session directory

**Choice:** Store the plan as `plan.json` in the session directory alongside `evidence.json` and `state.json`.

**Why:** The plan is session-scoped. On follow-up runs, the agent creates a new plan (which may carry criteria from prior runs). Storing it in the session directory keeps it naturally scoped and included in the session's evidence trail.

**Structure:**
```json
{
  "criteria": [
    {
      "criterion": "variant-pills-visible",
      "spec": "Variant pills displayed for multi-variant sounds, hidden for single-variant",
      "cases": ["6-variant sound /t/", "2-variant sound /l/", "single-variant /f/"],
      "carried": false
    }
  ],
  "created_at": "2026-03-18T12:00:00.000Z"
}
```

### 2. Plan command as subcommands of `proofrun plan`

**Choice:** Three subcommands: `plan add`, `plan list`, `plan check`.

**Why:** Follows the existing pattern of `session start/stop/status` and `device status`. Keeps the CLI surface clean.

**Commands:**
- `proofrun plan add --criterion <name> --spec "<text>" [--cases "Case one" --cases "Case two"] [--carried]`
- `proofrun plan list` — show all planned criteria with verification status
- `proofrun plan check` — compare plan vs evidence, show gaps

### 3. Screenshot warning on judge: check evidence, not block

**Choice:** `proofrun judge` checks if any screenshot entry exists for the criterion in the current evidence. If not, prints a warning after the judgment confirmation. Does not block.

**Why:** "CLI is dumb, agent is smart." The CLI nudges but doesn't enforce. Some judgments genuinely don't need screenshots (e.g., "human_required" for audio). The SKILL.md instruction provides the enforcement: "Every judgment MUST be supported by at least one screenshot."

**Implementation:** In `src/commands/evidence.js`, the judge action loads evidence, filters for `type === 'screenshot' && criterion === opts.criterion`. If count is 0, print warning to stderr.

### 4. Placeholder warning on session stop: scan knowledge files

**Choice:** `proofrun session stop` scans `config._knowledgeDir` for `.md` files containing `<!-- Agent:` and warns about each file that has unfilled placeholders.

**Why:** The agent has maximum context at session end — it just finished interacting with the app and discovered patterns. This is the best moment to remind it to capture durable knowledge.

**Implementation:** In `src/commands/session.js`, the stop action reads each `.md` file in the knowledge directory, checks for `<!-- Agent:` regex match. Files with matches are listed in a warning. The `config._knowledgeDir` path is already available from `loadConfig()`.

### 5. Plan coverage warning on session stop

**Choice:** `proofrun session stop` checks if `plan.json` exists, and if so, compares planned criteria against evidence judgments. Warns about unverified criteria.

**Why:** This is the natural "are you sure?" checkpoint before the session closes. Combined with the SKILL.md instruction ("you MUST address all gaps before stopping"), it creates a strong nudge without hard blocking.

**Implementation:** In `src/commands/session.js`, the stop action loads `plan.json` from the session directory, loads evidence, checks which planned criteria have at least one judgment. Lists gaps as warnings.

### 6. SKILL.md changes: plan phase, feedback, device cleanup, screenshots

**Workflow step 7 (new "Create Verification Plan"):** Inserted between prerequisites (step 6) and verification (step 8, renumbered). Instructions:
- Read all spec files / acceptance criteria for the change
- For each acceptance criterion, run `proofrun plan add` with criterion name, spec text, and test cases
- Test cases should cover: representative samples from different categories, all distinct entry points, edge cases
- Must complete the plan before recording any evidence
- Run `proofrun plan list` to review the plan

**Step 8 (Verify Each Criterion):** Add instruction: "Every judgment MUST be preceded by at least one screenshot showing the state being judged. Do not judge a criterion without visual evidence."

**Step 9 (Check Progress):** Update to include `proofrun plan check` alongside `proofrun evidence`.

**Step 12 (Handle Feedback):** Add explicit instruction: "Read the `top_level_comment` field. If the reviewer requests additional criteria, entry points, or broader coverage, you MUST address these in the follow-up run — add new criteria to the plan."

**Step 12 (Handle Feedback — LGTM path):** Fix device cleanup: "Check `proofrun device status` for the device you used. If it is **free**, shut it down to free RAM. If it is **locked by another session**, leave it alone."

**Principles:** Add: "Verify completely — create a verification plan that covers all spec criteria. Don't cherry-pick easy criteria."

### 7. Device management instruction strengthening

The SKILL.md device policy prompt is currently ignorable. Change to imperative:

> **STOP.** If no device policy is recorded in `knowledge/devices`, you MUST ask the human before using any device. Do not proceed, even in autonomous/autopilot mode. This is a human preference that cannot be assumed.

### 8. Knowledge template: devices.md cleanup section

Add a "Device Cleanup" section to `templates/knowledge/devices.md`:

```markdown
## Device Cleanup

<!-- Agent: After verification is complete and feedback is received:
  1. Check `proofrun device status` — only clean up devices that are FREE
  2. Shut down the simulator/emulator to free system RAM
  3. Do NOT shut down a device that is locked by another session
-->
```

## Risks / Trade-offs

**Risk:** Agent ignores plan phase and records evidence directly.
→ **Mitigation:** `proofrun session stop` warns about missing plan and unverified criteria. SKILL.md instruction is explicit. The CLI cannot hard-block because the plan is optional from the CLI's perspective.

**Risk:** Plan phase adds overhead to every verification run.
→ **Mitigation:** For small verifications (1-2 criteria), the plan phase is trivial — one or two `plan add` commands. The cost scales with the complexity of what's being verified, which is exactly when planning matters most.

**Risk:** Agent creates a minimal plan to satisfy the requirement.
→ **Mitigation:** The SKILL.md instructs the agent to map ALL spec criteria, not just a subset. The plan is visible in the session data and can be audited. But ultimately, an agent that wants to cut corners will find a way — the goal is to make the right path easy, not to make the wrong path impossible.
