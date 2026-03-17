## ADDED Requirements

### Requirement: Prerequisite command records environment evidence
The CLI SHALL provide a `proofrun prerequisite <description>` command that records environment prerequisite evidence entries in the active session.

#### Scenario: Record a manual prerequisite
- **WHEN** agent runs `npx proofrun prerequisite "Dev server running on port 8081"`
- **THEN** evidence.json SHALL contain an entry with `type: "prerequisite"` and `description: "Dev server running on port 8081"`
- **AND** the entry SHALL have `id` and `timestamp` fields

#### Scenario: Record a prerequisite with automated check
- **WHEN** agent runs `npx proofrun prerequisite "Dev server status" --check "curl -s http://localhost:8081/status"`
- **THEN** the CLI SHALL execute the check command
- **AND** evidence.json SHALL contain an entry with `type: "prerequisite"`, `check_command`, `check_output` (stdout), and `check_passed` (true if exit code 0)

#### Scenario: Check command fails
- **WHEN** agent runs `npx proofrun prerequisite "Build ready" --check "false"`
- **THEN** the entry SHALL have `check_passed: false`
- **AND** the CLI SHALL still record the entry (not error out)
- **AND** the CLI output SHALL indicate the check failed

#### Scenario: No active session
- **WHEN** agent runs `npx proofrun prerequisite "test"` without an active session
- **THEN** the CLI SHALL exit with an error: "No active session"

### Requirement: Warning when evidence recorded without prerequisites
The CLI SHALL print a warning to stderr when `step`, `screenshot`, `judge`, `note`, or `fix` is called and no prerequisite entries exist in the current session.

#### Scenario: First step without prerequisites
- **WHEN** agent runs `npx proofrun step "Navigate to settings"` and no prerequisite entries exist
- **THEN** stderr SHALL contain: "Warning: No prerequisites recorded."
- **AND** the step SHALL still be recorded (warning, not error)

#### Scenario: Step after prerequisites exist
- **WHEN** agent runs `npx proofrun step "Navigate to settings"` and at least one prerequisite entry exists
- **THEN** no warning SHALL be printed

### Requirement: Report displays prerequisites section
The HTML report SHALL display prerequisite evidence in a dedicated section above the criteria list.

#### Scenario: Prerequisites shown in report
- **WHEN** a report is generated for a session with prerequisite entries
- **THEN** the report SHALL display a "Prerequisites" section listing each prerequisite with description and timestamp
- **AND** prerequisites with check commands SHALL show the command, output, and pass/fail badge

#### Scenario: No prerequisites warning in report
- **WHEN** a report is generated for a session with no prerequisite entries
- **THEN** the report SHALL display a warning: "No environment prerequisites were recorded for this session."

### Requirement: Prerequisite in CLI help
The `prerequisite` command SHALL appear in the extended help text and `--help` output.

#### Scenario: Help text
- **WHEN** user runs `npx proofrun --help`
- **THEN** the prerequisite command SHALL be listed under EVIDENCE COMMANDS
