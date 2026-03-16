## MODIFIED Requirements

### Requirement: Context command outputs instructions, not content
`proofrun context` MUST read the config and output structured JSON instructions. It MUST support being called without a change name for free-form verification, returning project context (app knowledge, interaction config, boundaries, device types) without change-specific context.

#### Scenario: No change name (free-form verification)
- **WHEN** `proofrun context` is run without a change name and without `--list`
- **THEN** the CLI MUST output JSON with:
  - `change_context`: null
  - `app_knowledge`: app knowledge config (source, discovery_command, tips)
  - `interaction`: tool config (tool, element_strategy, testid_attribute)
  - `simulator`: device types from config
  - `boundaries`: path and fallback
  - `session`: max_retries_per_ac
- **AND** it MUST NOT error or require a change name

#### Scenario: With --list flag
- **WHEN** `proofrun context --list` is run
- **THEN** the CLI MUST output discovery instructions for finding available changes
- **AND** this behavior MUST be unchanged from current implementation

#### Scenario: With change name (unchanged)
- **WHEN** `proofrun context <change-name>` is run
- **THEN** the CLI MUST output full context including change_context, app_knowledge, interaction, simulator, boundaries, and session
- **AND** this behavior MUST be unchanged from current implementation
