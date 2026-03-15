## ADDED Requirements

### Requirement: CLI entry point
The `proofrun` command MUST be executable via `npx proofrun` or after global install via `npm i -g proofrun`.

#### Scenario: npx execution
- **WHEN** a user runs `npx proofrun --help`
- **THEN** the CLI MUST display the full help text with all subcommands
- **AND** exit with code 0

#### Scenario: No arguments
- **WHEN** `proofrun` is run with no arguments
- **THEN** it MUST display the help text (same as `--help`)

### Requirement: Help text serves as agent documentation
The `--help` output MUST be comprehensive enough for an AI agent to learn all CLI commands without external documentation.

#### Scenario: Help text completeness
- **WHEN** an agent reads `proofrun --help`
- **THEN** it MUST find: all subcommands with syntax, argument descriptions, examples, and exit codes
- **AND** the help text MUST follow Showboat's pattern of self-contained CLI documentation

### Requirement: Subcommand groups
The CLI MUST organize commands into logical groups: setup, session, evidence, and report.

#### Scenario: Setup commands
- **WHEN** the CLI is inspected
- **THEN** it MUST provide: `init`, `doctor`

#### Scenario: Session commands
- **WHEN** the CLI is inspected
- **THEN** it MUST provide: `session start`, `session stop`, `session status`

#### Scenario: Evidence commands
- **WHEN** the CLI is inspected
- **THEN** it MUST provide: `step`, `screenshot`, `judge`, `note`, `criteria`

#### Scenario: Report commands
- **WHEN** the CLI is inspected
- **THEN** it MUST provide: `report`

### Requirement: Exit codes
The CLI MUST use consistent exit codes across all commands.

#### Scenario: Exit code meanings
- **WHEN** any proofrun command completes
- **THEN** exit code 0 MUST mean success
- **AND** exit code 1 MUST mean error or verification failure
- **AND** exit code 2 MUST mean bad arguments or usage error

### Requirement: Config file loading
The CLI MUST load `proofrun.config.yaml` from the project root when available.

#### Scenario: Config exists
- **WHEN** `proofrun.config.yaml` exists in the current directory or a parent directory
- **THEN** the CLI MUST load and validate it before executing the command

#### Scenario: Config missing for commands that need it
- **WHEN** a session or evidence command is run without a config file
- **THEN** the CLI MUST exit with a clear error suggesting `proofrun init`
