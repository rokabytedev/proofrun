## Why

A real test run revealed systematic gaps in proofrun's skill instructions and knowledge templates. The agent skipped build verification, baked session-specific data into persistent knowledge files, reused a stale device without checking, and never verified the dev server was running. These gaps reduce trust in verification reports — the agent might be verifying against old code on a misconfigured simulator.

Additionally, the skill has no mechanism to enforce environment verification. The agent can skip it with no consequence. A `prerequisite` command would make environment checks mandatory and auditable in the report.

## What Changes

- **SKILL.md**: Strengthen build verification checkpoint, add mandatory prerequisite recording, add follow-up run instructions (`--reason` flag), instruct agent to always re-verify everything unless absolutely safe, warn against session-specific knowledge
- **Knowledge templates**: Add Build Verification section to `environment.md`, add stable vs transient distinction to `simulators.md`, add "no session-specific data" warning to `context.md`
- **New CLI command**: `proofrun prerequisite <description>` to record mandatory environment evidence before verification steps. The CLI enforces that prerequisites exist before other evidence commands succeed.

## Capabilities

### New Capabilities
- `prerequisite-evidence`: CLI command to record environment prerequisite evidence, with optional `--check <command>` flag for automated checks. Report displays prerequisites in a separate section.

### Modified Capabilities

## Impact

- `src/commands/` — new `prerequisite.js` command
- `src/session.js` — evidence entry type `prerequisite`
- `src/cli.js` — register new command, help text
- `skills/proofrun/SKILL.md` — significant updates to workflow sections
- `templates/knowledge/environment.md` — add Build Verification section
- `templates/knowledge/simulators.md` — add stable vs transient distinction
- `templates/knowledge/context.md` — add session-specific data warning
- `templates/report.html` — prerequisites section in report
- Evidence commands (`step`, `screenshot`, `judge`, `note`, `fix`) — warn if no prerequisites recorded yet
