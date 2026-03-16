## Context

Proofrun's current SKILL.md and `context` command assume verification always starts from a formal change with pre-defined acceptance criteria. The CLI infrastructure (sessions, evidence, reports) already supports arbitrary AC numbers — the friction is in the skill workflow and context command gating.

The goal is to make the same workflow handle both structured verification (change with ACs from artifacts) and free-form verification (query-driven, agent defines ACs from exploration).

## Goals / Non-Goals

**Goals:**
- SKILL.md workflow handles both structured and free-form verification without branching into "modes"
- `proofrun context` works without a change name, returning app knowledge, interaction config, boundaries, and device types
- Agent can define its own ACs dynamically during exploration
- Zero changes to evidence, session, or report commands (they already support this)

**Non-Goals:**
- No new CLI commands or flags
- No "free-form mode" toggle — the workflow is just generic enough
- No changes to evidence.json schema or report template

## Decisions

### D1: SKILL.md workflow reframing

**Current:** Linear flow assuming ACs exist upfront: "Extract ACs → Classify → Verify each"

**New:** Generic flow where "determine what to verify" replaces "extract ACs":

```
1. Gather Context (proofrun context OR skip for free-form)
2. Determine What to Verify
   - Structured: extract ACs from change artifacts
   - Free-form: define verification criteria from the query
3. Start Session (--change is just a label)
4. Verify (explore-then-document, same as before)
5. Report + Stop
```

The key insight: step 2 is the same cognitive task regardless of source. The agent determines criteria, assigns numbers, and proceeds. The difference is input (artifacts vs query), not workflow.

**Rationale:** Avoids mode branching. The skill teaches one workflow that naturally adapts to input.

### D2: `proofrun context` without change name

**Current behavior:**
- `proofrun context` or `proofrun context --list` → returns discovery instructions
- `proofrun context <change>` → returns full context with change_context, app_knowledge, interaction, etc.

**New behavior:**
- `proofrun context` (no args) → returns project context: app_knowledge, interaction, simulator, boundaries, session config. Omits change_context since there's no change.
- `proofrun context <change>` → same as before (full context including change_context)
- `proofrun context --list` → same as before (discovery instructions)

This way, free-form verification can still get useful project context (how to interact with the app, what device types are available, where boundaries are) without needing a change name.

**Implementation in `src/commands/context.js`:**

Current code (lines 12-22):
```js
if (opts.list || !change) {
  // Return discovery instructions
  ...
}
```

Change to:
```js
if (opts.list) {
  // Explicit --list: return discovery instructions only
  ...
  return;
}

if (!change) {
  // No change name: return project context without change_context
  // Still includes: app_knowledge, interaction, simulator, boundaries, session
  ...
  return;
}

// With change name: full context (existing behavior)
```

**Output schema for no-change context:**
```json
{
  "ok": true,
  "command": "context",
  "data": {
    "change_context": null,
    "app_knowledge": { "source": "...", "discovery_command": "...", "tips": "..." },
    "interaction": { "tool": "iosef", "element_strategy": "identifier", "testid_attribute": "testID" },
    "simulator": { "device_types": { "default": "iPhone 16 Pro", ... } },
    "boundaries": { "path": ".proofrun/boundaries.md", "fallback": "..." },
    "session": { "max_retries_per_ac": 2 }
  }
}
```

### D3: SKILL.md trigger conditions

**Current:**
```
Trigger proofrun verification when ALL of these are true:
- You have completed implementing a change
- Acceptance criteria exist for the change
- The app runs in a simulator
```

**New:**
```
Trigger proofrun verification when:
- After implementing a change with verifiable acceptance criteria, OR
- When the user asks you to verify something about the app (e.g., "check Chinese locale translations")
- AND the app runs in a simulator
```

This broadens triggering without special modes.

### D4: SKILL.md "Determine What to Verify" section

New section replacing "Classify Acceptance Criteria":

```markdown
### 2. Determine What to Verify

**If verifying a change:** Follow the context instructions to read change artifacts. Extract numbered acceptance criteria. Classify each as agent-verifiable or human-required using the boundaries guide.

**If given a verification query:** Break the query into discrete, verifiable criteria. Assign AC numbers. Example:

Query: "Check all screens for missing Chinese translations"
→ AC 1: Home screen - all strings translated
→ AC 2: Settings screen - all strings translated
→ AC 3: Library screen - all strings translated
→ ... (discover more ACs as you explore the app)

ACs can be refined or added during exploration — you don't need to define them all upfront.

For both cases, classify each criterion as agent-verifiable or human-required.
```

### D5: Session `--change` flag for free-form

The `--change` flag on `session start` is currently required and serves as a label. For free-form verification, the agent should use a descriptive slug derived from the query.

No code change needed — the agent just passes something like `--change "chinese-locale-audit"` or `--change "recording-flow-e2e"`. The SKILL.md should guide this.

## Risks / Trade-offs

- **Risk**: Free-form verification could produce unfocused reports with too many loosely-defined ACs.
  → Mitigation: SKILL.md guidance to keep criteria discrete and specific. The agent's judgment determines quality.

- **Trade-off**: Removing the hard gate on "ACs exist" means the skill may trigger when it shouldn't.
  → Mitigation: Still requires simulator availability and user intent. The trigger conditions are broadened, not removed.
