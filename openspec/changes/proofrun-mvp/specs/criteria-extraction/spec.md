## ADDED Requirements

### Requirement: Criteria extraction from configured source
`proofrun criteria` MUST extract acceptance criteria from the configured AC source.

#### Scenario: OpenSpec source
- **WHEN** the config specifies `acceptance_criteria.source: openspec` and `proofrun criteria <change-name>` is run
- **THEN** the CLI MUST read all artifacts in `openspec/changes/<change-name>/` (proposal, design, specs, tasks)
- **AND** extract verifiable behavioral outcomes (UI states, navigation flows, element visibility, interactions)
- **AND** output a numbered list of ACs with classification

#### Scenario: Markdown source
- **WHEN** the config specifies `acceptance_criteria.source: markdown` with a file path
- **THEN** the CLI MUST read the specified markdown file and extract checkboxes or structured criteria

#### Scenario: Manual source
- **WHEN** the config specifies `acceptance_criteria.source: manual`
- **THEN** `proofrun criteria` MUST prompt for ACs to be provided (or accept via stdin)

### Requirement: AC classification
Each extracted AC MUST be classified as agent-verifiable, human-required, or partial.

#### Scenario: Classification using boundaries
- **WHEN** ACs are extracted
- **THEN** each MUST be classified by checking against the boundaries reference file
- **AND** the classification MUST be output alongside each AC:
  - Agent-verifiable: checkable via screenshots, accessibility tree, element assertions
  - Human-required: audio, haptics, performance, real-device APIs, subjective quality
  - Partial: some aspects verifiable, others need human

#### Scenario: Default to human-required when ambiguous
- **WHEN** an AC does not clearly match either category
- **THEN** it MUST default to human-required

### Requirement: App knowledge discovery
The skill MUST instruct the agent to discover app knowledge (navigation, screen states, features) before verifying.

#### Scenario: OpenSpec-based app knowledge
- **WHEN** the project uses OpenSpec with specs at `openspec/specs/`
- **THEN** the agent MUST scan spec names (via `openspec list --specs` or `ls openspec/specs/`)
- **AND** read the 2-3 most relevant specs for the ACs being verified
- **AND** if a spec doesn't help, try another one

#### Scenario: Non-OpenSpec app knowledge
- **WHEN** the project does not use OpenSpec
- **THEN** the agent MUST look for app knowledge in: README, docs/, CLAUDE.md, or other documentation
- **AND** use the simulator interaction tool to explore the app as a fallback
