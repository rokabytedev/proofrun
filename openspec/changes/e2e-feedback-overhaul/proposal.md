## Why

E2E testing of proofrun on a real Expo project (accent) revealed critical bugs and design gaps that prevent agents from completing the verification workflow. Sessions crash immediately after starting, reports render blank pages, the simulator pool abstraction doesn't map to real devices, and the workflow ordering is wrong. The CLI also does too much (port allocation, abstract sim slots) while not doing enough (plain text output, environment verification checkpoint).

## What Changes

- **BREAKING** Kill `context` command — merge useful parts into new `info` command
- **BREAKING** Replace `--ac <number>` with `--criterion <name>` across all evidence commands
- **BREAKING** Remove `simulator.pool_size` and `port_range` from config — agent manages these directly
- **BREAKING** Default CLI output to plain text, add `--json` flag for structured output
- **BREAKING** `session start` takes `--simulator <UDID>` — CLI bookkeeps, agent chooses device
- Fix session crash bug: `findActiveSession()` checks removed `dev_server.pid`
- Fix report template bug: `{}` placeholder after JSON causes blank page
- Replace `dev-server.md` knowledge template with `environment.md` (generic, works for native)
- Rewrite SKILL.md: first-time explore step, continuous knowledge updates, environment checkpoint before evidence recording, correct step ordering
- Slim config.toml to genuine user preferences only

## Capabilities

### New Capabilities
- `info-command`: All-in-one project readiness command replacing `context` and subsumes `doctor` — returns config, knowledge topics, lock state, diagnostics, active session
- `named-criteria`: Replace numeric AC identifiers with descriptive string names for evidence commands and reports
- `plain-text-output`: Default human/agent-readable plain text output for all commands, with `--json` opt-in
- `session-locking`: Simplified session start that accepts simulator UDID from agent, CLI acts as bookkeeper rather than allocator

### Modified Capabilities

_(none — proofrun has no existing specs)_

## Impact

- All CLI commands change output format (plain text default)
- `session start` CLI signature changes
- Evidence commands (`step`, `screenshot`, `judge`, `fix`) signature changes (`--ac` → `--criterion`)
- Config schema changes (fields removed)
- Report template and renderer changes
- SKILL.md complete rewrite
- Preset knowledge files renamed/restructured
- Tests need updating for new output format and command signatures
