## ADDED Requirements

### Requirement: Context command outputs instructions, not content
`proofrun context <change>` MUST read the config and output structured JSON instructions telling the agent HOW to gather change context and app knowledge. It MUST NOT read or parse the change artifacts itself.

#### Scenario: OpenSpec source
- **WHEN** the config specifies `change_context.source: openspec` and `proofrun context add-search` is run
- **THEN** the CLI MUST output JSON with:
  - `change_context.source`: "openspec"
  - `change_context.change_name`: "add-search"
  - `change_context.instructions`: human-readable instructions for the agent
  - `change_context.commands`: array of CLI commands the agent can run (e.g., `openspec show add-search --json`)
  - `change_context.artifact_paths`: array of file paths to read (with `{{change}}` replaced)
- **AND** it MUST NOT read any of those files or run any of those commands

#### Scenario: GitHub source
- **WHEN** the config specifies `change_context.source: github`
- **THEN** the CLI MUST output JSON with:
  - `change_context.commands`: array containing the configured `github.issue_command` or `github.pr_command` with `{{change}}` replaced
  - `change_context.instructions`: instructions to run the command and read the output

#### Scenario: Markdown source
- **WHEN** the config specifies `change_context.source: markdown`
- **THEN** the CLI MUST output JSON with:
  - `change_context.artifact_paths`: array containing the configured `markdown.path` with `{{change}}` replaced
  - `change_context.instructions`: instructions to read the file

#### Scenario: Manual source
- **WHEN** the config specifies `change_context.source: manual`
- **THEN** the CLI MUST output JSON with:
  - `change_context.instructions`: generic guidance for the agent to gather context from git history, changed files, or conversation with the user

### Requirement: App knowledge instructions
`proofrun context` MUST include app knowledge instructions in its output.

#### Scenario: OpenSpec specs as app knowledge
- **WHEN** the config specifies `app_knowledge.source: openspec-specs`
- **THEN** the output MUST include `app_knowledge` with:
  - `discovery_command`: the configured command to list specs
  - `spec_path`: where spec files live
  - `instructions`: guidance on how to scan spec names and pick relevant ones
  - `tips`: the configured tips text

#### Scenario: No app knowledge source
- **WHEN** the config specifies `app_knowledge.source: none`
- **THEN** the output MUST include `app_knowledge` with generic guidance to explore the codebase and app

### Requirement: Interaction tool info included
`proofrun context` MUST include interaction tool configuration in its output.

#### Scenario: Interaction info
- **WHEN** `proofrun context` is run
- **THEN** the output MUST include `interaction` with: tool name, element_strategy, testid_attribute
- **AND** this informs the agent which approach to use when interacting with the app

### Requirement: Boundaries info included
`proofrun context` MUST include boundaries file path in its output.

#### Scenario: Boundaries info
- **WHEN** `proofrun context` is run
- **THEN** the output MUST include `boundaries.path` pointing to the project's boundaries file
- **AND** a `boundaries.fallback` note about using the default template if the file doesn't exist

### Requirement: Session config included
`proofrun context` MUST include session-relevant config in its output.

#### Scenario: Session defaults
- **WHEN** `proofrun context` is run
- **THEN** the output MUST include `session.max_retries_per_ac` so the skill can reference it
