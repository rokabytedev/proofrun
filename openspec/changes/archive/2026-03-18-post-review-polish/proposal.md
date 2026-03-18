## Why

Post-implementation review of the multi-run feedback, skill hardening, and platform-agnostic changes revealed several gaps: device locks are project-local (invisible across worktrees/projects), the skill workflow has ordering issues and vague knowledge-update instructions, templates contain inaccurate verification boundaries, and legacy single-session report code creates confusion. These need to be fixed before real multi-agent verification workflows are reliable.

## What Changes

- **BREAKING**: Migrate device locks from `.proofrun/locks/` (project-local) to `~/.proofrun/locks/` (system-global) so locks are visible across worktrees and projects
- Add stale lock detection (check PID liveness + session state) and `--force-unlock` flag to `session start` for taking over stale locks
- Enrich lock held files with project path, PID, and timestamp for diagnostics
- Add `proofrun device status [--device <id>]` command to check device lock state with actionable guidance
- Rename `simulators.md` template to `devices.md`, restructure around device management policy + pool + lifecycle (remove Stable/Observed pattern)
- Add device pool management guidance to `devices.md` template and SKILL.md (first-run wizard, dedicated pool, naming conventions, cleanup)
- Remove "Complex internationalization" from human-required in `boundaries.md`, refine "Visual polish" split, fix classification guidelines
- Remove iosef reference from `devices.md` (interaction tool belongs only in `interaction.md`)
- Replace bad examples in SKILL.md ("recording-flow-e2e") with agent-verifiable examples
- Add explicit knowledge-update DOs/DONTs with file mappings to SKILL.md
- Fix workflow ordering: stop session before serve, explicit background task instruction, human communication template
- Remove legacy single-session `--session` flag and `proofrun report --open` code path
- Add muted "Export Feedback JSON" button to report HTML for secondary use case

## Capabilities

### New Capabilities
- `global-device-locking`: System-level lock directory at `~/.proofrun/locks/`, stale lock detection, force-unlock, enriched lock metadata, `device status` command
- `device-pool-management`: Device management policy in `devices.md` template, first-run setup guidance in SKILL.md, pool creation principles, device cleanup lifecycle
- `skill-workflow-polish`: Fix SKILL.md examples, knowledge-update guidance, serve workflow ordering, background task instructions, human communication wording
- `template-refinements`: boundaries.md accuracy fixes, simulators.md → devices.md rename/restructure, interaction.md deduplication, report HTML export button

### Modified Capabilities
(none — no existing openspec/specs/ to modify)

## Impact

- `src/locking.js` — lock directory changes from project-local to `~/.proofrun/locks/`, enriched held file format
- `src/config.js` — remove `LOCK_DIR` constant (no longer project-relative)
- `src/commands/session.js` — use global lock dir, add `--force-unlock` flag
- `src/commands/device.js` — new command for device status checking
- `src/commands/report.js` — remove `--session` flag and single-session code path
- `src/cli.js` — register device command, remove legacy report options
- `skills/proofrun/SKILL.md` — workflow rewrite (ordering, examples, knowledge guidance, serve instructions)
- `templates/knowledge/simulators.md` → `templates/knowledge/devices.md` — rename + restructure
- `templates/knowledge/boundaries.md` — accuracy fixes
- `templates/knowledge/interaction.md` — remove device management content
- `templates/report.html` — add export feedback JSON button
