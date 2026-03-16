## Why

Proofrun's current SKILL.md and `context` command assume verification always starts from a formal change with pre-defined acceptance criteria (extracted from OpenSpec, GitHub issues, or markdown files). This excludes a powerful class of verification tasks where the agent defines its own criteria from a free-form query — e.g., "check all screens for missing Chinese translations" or "verify the recording flow works end-to-end." The CLI infrastructure (sessions, evidence, reports) already supports this, but the skill workflow and context command create unnecessary friction by assuming structured AC sources.

## What Changes

- **SKILL.md rewrite**: Reframe the workflow from "extract ACs from change artifacts" to "determine what to verify" — a generic step that works for both structured changes and free-form queries. Remove the hard gate on "acceptance criteria exist."
- **`proofrun context` command**: Support being called without a change name (for free-form tasks), return useful context (app knowledge, interaction config, boundaries, device types) regardless of whether a formal change exists.
- **Trigger conditions**: Broaden from "after implementing a change with ACs" to also cover query-driven verification invoked by the user directly.

## Capabilities

### New Capabilities

_None — this is a refinement of existing capabilities, not new functionality._

### Modified Capabilities

- `agent-skill`: SKILL.md workflow must handle both structured (change-driven) and free-form (query-driven) verification without special modes.
- `criteria-extraction`: `proofrun context` must work without a change name, returning app knowledge, interaction config, boundaries, and device types for free-form verification.

## Impact

- `skills/proofrun/SKILL.md` — rewritten workflow section
- `src/commands/context.js` — support no-change invocation, return richer context
- No breaking changes to evidence, session, or report commands — they already accept arbitrary AC numbers
