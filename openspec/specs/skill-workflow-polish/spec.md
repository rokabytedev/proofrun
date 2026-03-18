## ADDED Requirements

### Requirement: Agent-verifiable examples only
SKILL.md examples SHALL use criteria that agents can actually verify.

#### Scenario: Criteria examples
- **WHEN** SKILL.md shows example criteria names
- **THEN** examples SHALL be agent-verifiable (e.g., "onboarding-flow-e2e → Onboarding screens display correctly and can be navigated to completion")
- **AND** SHALL NOT include criteria requiring human perception (e.g., recording flow, audio playback)

#### Scenario: Change name trigger examples
- **WHEN** SKILL.md shows trigger-to-change-name mappings
- **THEN** examples SHALL use agent-verifiable scenarios (e.g., "verify the onboarding flow" → `--change "onboarding-flow-e2e"`)

### Requirement: Explicit knowledge update guidance
SKILL.md SHALL provide an explicit mapping of what discoveries go into which knowledge files.

#### Scenario: Knowledge update DOs table
- **WHEN** SKILL.md instructs agents on knowledge updates
- **THEN** it SHALL include a table mapping discovery types to target files: build commands → `environment.md`, element identifiers and navigation patterns → `interaction.md`, device pool changes → `devices.md`, verification boundaries → `boundaries.md`

#### Scenario: Knowledge update DONTs
- **WHEN** SKILL.md instructs agents on knowledge updates
- **THEN** it SHALL explicitly list what NOT to put in knowledge files: current screen state, session-specific criteria or results, temporary workarounds for this verification run

### Requirement: Correct workflow ordering
SKILL.md SHALL order workflow steps so the session is stopped before serving the report.

#### Scenario: Stop session before serve
- **WHEN** reading the SKILL.md workflow
- **THEN** "Stop Session" SHALL come before "Serve Report for Feedback"
- **AND** the rationale SHALL be stated: release the device lock immediately after evidence collection since report generation and human review can take a long time

### Requirement: Background task instruction for serve
SKILL.md SHALL instruct the agent to run the serve command as a background task using Claude Code's background task capability.

#### Scenario: Serve as background task
- **WHEN** SKILL.md instructs the agent to start the feedback server
- **THEN** it SHALL explicitly instruct running the command as a background task (not foreground, not shell `&`)
- **AND** explain that the agent will be notified when feedback arrives

#### Scenario: Human communication template
- **WHEN** the agent starts the serve command
- **THEN** SKILL.md SHALL provide a message template for the agent to send to the human, including: the report URL, instruction to review and approve/reject criteria, instruction to click Submit Feedback or LGTM, and that the agent will be notified automatically

### Requirement: Remove legacy single-session references
SKILL.md SHALL NOT reference legacy single-session report commands.

#### Scenario: No legacy report command
- **WHEN** reading SKILL.md
- **THEN** there SHALL be no reference to `proofrun report --open` or `--session` flag
- **AND** the report command SHALL always use `--change <name>`

### Requirement: Device conflict awareness
SKILL.md SHALL instruct agents on how to handle device and port conflicts.

#### Scenario: Device conflict check
- **WHEN** SKILL.md instructs the agent to set up the environment
- **THEN** it SHALL instruct the agent to check device lock status via `proofrun device status` before attempting to use a device
- **AND** instruct the agent to be a "good citizen": never use a device without locking it, ask human approval if a device is actively locked by someone else

#### Scenario: Port conflict awareness
- **WHEN** SKILL.md instructs the agent to start a dev server
- **THEN** it SHALL warn about potential port conflicts with other agents or processes
- **AND** instruct the agent to check if the port is in use and use an alternative if needed
