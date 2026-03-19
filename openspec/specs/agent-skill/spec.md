## MODIFIED Requirements

### Requirement: Skill teaches workbook mental model
The SKILL.md MUST teach agents to treat `.proofrun/knowledge/` as an iterative workbook that improves across sessions.

#### Scenario: Knowledge workflow in SKILL.md
- **WHEN** the agent reads the skill
- **THEN** it MUST understand:
  - Read `proofrun knowledge --list` to discover available topics
  - Load only topics relevant to the current task
  - Knowledge is advisory, not authoritative — the app is truth
  - After verification, update knowledge with discoveries
  - Keep notes generic (useful across sessions)
  - Create new topic files for distinct knowledge areas

## ADDED Requirements

### Requirement: Skill references platform-agnostic interaction tools
The SKILL.md MUST reference interaction tools generically, directing agents to `knowledge/interaction` for the platform-specific tool, rather than naming any specific tool (iosef, agent-device, etc.) in the workflow steps.

#### Scenario: Interaction tool references in workflow
- **WHEN** the agent reads the verification workflow in SKILL.md
- **THEN** references to app interaction (screenshots, tapping, navigating) SHALL use generic terms like "the interaction tool" or "your platform's interaction skill"
- **AND** the skill SHALL direct agents to read `knowledge/interaction` for tool-specific guidance
- **AND** the skill SHALL NOT contain inline commands for any specific interaction tool

#### Scenario: No iosef references
- **WHEN** searching SKILL.md for "iosef"
- **THEN** zero matches SHALL be found

### Requirement: Skill covers multi-platform device pool creation
The SKILL.md device pool creation guidance MUST cover iOS simulators and Android emulators, with platform-appropriate creation methods.

#### Scenario: iOS device pool creation guidance
- **WHEN** the agent reads the device pool creation section
- **THEN** it finds guidance for creating iOS simulators
- **AND** the naming convention `(Proofrun-only) <Device Name>`
- **AND** form factor variety guidance (large phone, small phone, tablet)

#### Scenario: Android device pool creation guidance
- **WHEN** the agent reads the device pool creation section
- **THEN** it finds guidance for creating Android emulators (AVDs)
- **AND** the naming convention `(Proofrun-only) <Device Name>`
- **AND** form factor variety guidance (large phone, small phone, tablet)
- **AND** reference to `avdmanager` for AVD creation and `sdkmanager` for system images
- **AND** guidance to use `arm64-v8a` on Apple Silicon and `x86_64` on Intel

#### Scenario: Web browser session guidance
- **WHEN** the agent reads the device pool creation section
- **THEN** it finds a note that web browser sessions do not require device pool creation
- **AND** guidance to use a logical device identifier (e.g., `chromium-mobile`) for session locking
