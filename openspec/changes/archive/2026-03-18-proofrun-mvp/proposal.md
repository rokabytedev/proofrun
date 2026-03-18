## Why

AI agents write code, but they can't prove it works. After implementation, verification falls to humans — who become the bottleneck. The agent has all the knowledge needed to verify its own work (it knows the acceptance criteria, it wrote the code), but lacks a structured way to interact with the running app, capture evidence, and produce an auditable report.

Proofrun closes this loop: it gives AI agents a CLI tool and workflow skill to verify their own implementation by interacting with the running app in a simulator, capturing screenshot evidence, and generating an interactive HTML report that humans can review and annotate with feedback.

## What Changes

- **CLI tool (`npx proofrun`)** — manages verification sessions (simulator/port lock acquisition, dev server lifecycle), records evidence (steps, screenshots, judgments), and generates interactive HTML reports
- **Agent skill (`npx skills add rokabytedev/proofrun`)** — teaches the agent the verification workflow: when to trigger proofrun, how to read acceptance criteria, how to classify what can/can't be verified, how to explore the app and record clean evidence paths, how to handle human feedback
- **Platform presets** — pre-configured defaults for common stacks (Expo, React Native CLI, Next.js, Flutter) so `proofrun init --preset expo` gets a project to working config with minimal effort
- **AC source adapters** — pluggable system for reading acceptance criteria from different sources (OpenSpec, GitHub issues, plain markdown)
- **Resource lock system** — flock-based lock management for concurrent agent access to simulators and ports
- **Interactive HTML reports** — self-contained HTML with embedded screenshots, per-AC accept/reject/annotate controls, and JSON feedback export for agent consumption

## Capabilities

### New Capabilities

- `cli-core`: The proofrun CLI entry point — command routing, config loading, help system. All subcommands, argument parsing, exit codes. `proofrun --help` serves as complete agent-readable documentation.
- `session-management`: Simulator pool locking (flock-based), port pool allocation, dev server lifecycle, app version verification. Acquire resources at session start, release at session stop. Stale lock detection via kernel-level flock auto-release.
- `evidence-capture`: Recording verification steps, attaching screenshots, recording agent judgments (pass/fail with reasoning). Incremental report building — one AC at a time.
- `report-generation`: Interactive HTML report with embedded base64 screenshots, per-AC accept/reject/comment controls, screenshot annotation (draw on screenshots), JSON feedback export. Self-contained single-file output.
- `criteria-extraction`: AC source adapters for OpenSpec, GitHub, and plain markdown. Extract testable acceptance criteria from change artifacts. Classify as agent-verifiable vs human-required using configurable boundaries.
- `project-init`: Platform presets (expo, react-native-cli, nextjs, flutter) and agent-driven project scanning for auto-config. Generates `proofrun.config.yaml` with sensible defaults.
- `agent-skill`: SKILL.md teaching the verification workflow — when to trigger, how to read ACs, how to explore the app, how to record evidence, how to handle human feedback. References `proofrun --help` for CLI mechanics.

### Modified Capabilities

_(none — greenfield project)_

## Impact

- **New npm package**: `proofrun` — published to npm, usable via `npx proofrun`
- **New skill**: Published to skills.sh via `npx skills add rokabytedev/proofrun`
- **Dependencies**: Node.js runtime. Simulator interaction tool (iosef recommended) installed separately.
- **Platforms**: iOS first (via iosef), with adapter architecture for future Android/web support
- **Repo**: Standalone at `github.com/rokabytedev/proofrun` (or similar)
