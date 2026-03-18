## ADDED Requirements

### Requirement: Skill installable via skills.sh
The proofrun skill MUST be installable via `npx skills add rokabytedev/proofrun` and discovered in the `skills/` directory of the repo.

#### Scenario: Skill installation
- **WHEN** a user runs `npx skills add rokabytedev/proofrun -g`
- **THEN** the skill MUST be installed to `~/.claude/skills/proofrun/` (or equivalent agent skill directory)
- **AND** the agent MUST see `proofrun` in its available skills list

### Requirement: Skill teaches verification workflow
The SKILL.md MUST teach the agent the end-to-end verification workflow without requiring external documentation.

#### Scenario: Workflow coverage
- **WHEN** the agent reads the skill
- **THEN** it MUST understand:
  - When to trigger proofrun (after implementation, when ACs exist)
  - How to check if proofrun is initialized (`proofrun.config.yaml` exists)
  - How to initialize if not (`npx proofrun init --preset <detected>`)
  - How to extract and classify ACs (`npx proofrun criteria`)
  - How to discover app knowledge (read relevant specs/docs)
  - How to start a session (`npx proofrun session start`)
  - The explore-then-document pattern (use simulator tool freely, record clean path)
  - How to record evidence (`npx proofrun step/screenshot/judge`)
  - How to generate the report (`npx proofrun report`)
  - How to release resources (`npx proofrun session stop`)
  - How to handle human feedback from the report

### Requirement: Skill references --help for CLI details
The skill MUST reference `npx proofrun --help` for command syntax details rather than duplicating CLI documentation.

#### Scenario: CLI reference
- **WHEN** the agent needs exact command syntax
- **THEN** the skill MUST instruct: "Run `npx proofrun --help` for complete command reference"
- **AND** the skill MUST NOT duplicate the full CLI syntax in SKILL.md

### Requirement: Skill includes boundaries template
The skill MUST include a boundaries template as a reference file.

#### Scenario: Boundaries reference
- **WHEN** the agent needs to classify ACs
- **THEN** it MUST read `references/boundaries-template.md` from the skill
- **AND** the template MUST list common categories of agent-verifiable and human-required verification items
- **AND** projects MAY override with their own `.proofrun/boundaries.md`

### Requirement: Skill instructs prerequisite checking
The skill MUST instruct the agent to verify prerequisites before starting verification.

#### Scenario: Prerequisites check
- **WHEN** the agent is about to start verification
- **THEN** it MUST check:
  - Simulator interaction tool is available (e.g., `iosef --help`)
  - If not available, install it (e.g., `npx skills add riwsky/iosef@ios-simulator-interaction -g`)
  - `npx proofrun doctor` passes
  - If proofrun CLI not available, use `npx proofrun` (npx handles on-demand install)
