## ADDED Requirements

### Requirement: SKILL.md section ordering
The SKILL.md SHALL follow this section order: (1) Identity and positioning, (2) When to trigger, (3) Getting started, (4) Workflow, (5) Principles, (6) Knowledge management, (7) Human feedback handling.

#### Scenario: Agent reads skill for the first time
- **WHEN** an agent loads the proofrun skill
- **THEN** it first encounters what proofrun is (identity as a proof-of-work verification tool for mobile apps)
- **AND** then learns when to activate (trigger conditions)
- **AND** then learns prerequisites (CLI availability, `proofrun info`)
- **AND** then follows the workflow steps
- **AND** then reads guiding principles

### Requirement: No platform-specific content in SKILL.md
The SKILL.md SHALL NOT contain any platform-specific commands, tool names, or examples. All platform-specific details SHALL be deferred to knowledge files.

#### Scenario: iOS references removed
- **WHEN** the SKILL.md is searched for iOS-specific content
- **THEN** it does not contain `xcrun`, `simctl`, `expo`, `react-native`, or any iOS/framework-specific commands

#### Scenario: Workflow references knowledge files
- **WHEN** the workflow describes environment setup
- **THEN** it instructs the agent to follow `knowledge/environment.md` and `knowledge/simulators.md`
- **AND** does not inline platform-specific setup commands

### Requirement: Prerequisites use CLI commands only
The prerequisites section SHALL instruct the agent to run `proofrun info` (or `proofrun doctor`) and follow its output, rather than manually checking config files or directories.

#### Scenario: Getting started flow
- **WHEN** the agent begins the proofrun workflow
- **THEN** the skill instructs: ensure `npx proofrun` is available, run `npx proofrun info`, fix any reported issues
- **AND** does not instruct the agent to directly check `.proofrun/config.toml` existence

### Requirement: Identity positions proofrun as proof-of-work
The opening section SHALL frame proofrun as "AI agent provable verification for mobile apps" — the value is auditable evidence that the agent actually verified behavior, not just claimed to.

#### Scenario: Identity section content
- **WHEN** the agent reads the first section
- **THEN** it understands proofrun produces proof-of-work (auditable evidence chain)
- **AND** the framing emphasizes evidence capture and human review, not CLI commands

### Requirement: Knowledge update principle placement
The "update knowledge continuously" principle SHALL appear within the Principles section (section 5), not before the agent understands what proofrun is.

#### Scenario: Principle not at top of file
- **WHEN** the SKILL.md is read top-to-bottom
- **THEN** the knowledge update principle appears after the workflow section
- **AND** the workflow section may briefly reference it inline (e.g., "update knowledge files as you discover things")
