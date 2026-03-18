## ADDED Requirements

### Requirement: Init without preset flag
The `proofrun init` command SHALL scaffold a `.proofrun/` directory without requiring a `--preset` flag. The command SHALL accept no required options.

#### Scenario: Fresh initialization
- **WHEN** user runs `proofrun init` in a project with no `.proofrun/` directory
- **THEN** the command creates `.proofrun/config.toml` from `templates/config.toml`
- **AND** creates `.proofrun/knowledge/` with all template files from `templates/knowledge/`
- **AND** adds `.proofrun/locks/`, `.proofrun/sessions/`, `.proofrun/reports/` to `.gitignore`
- **AND** outputs success with config path, knowledge directory, and list of knowledge files created

#### Scenario: Config already exists
- **WHEN** user runs `proofrun init` and `.proofrun/config.toml` already exists
- **THEN** the command exits with error: `.proofrun/config.toml already exists. Delete it first to reinitialize.`

### Requirement: Templates directory replaces presets
The CLI SHALL ship a `templates/` directory at the package root containing `config.toml` and `knowledge/*.md`. The `presets/` directory SHALL be deleted.

#### Scenario: Template directory structure
- **WHEN** the package is installed
- **THEN** `templates/config.toml` exists with default session and reports configuration
- **AND** `templates/knowledge/` contains exactly: `environment.md`, `simulators.md`, `interaction.md`, `boundaries.md`, `context.md`

### Requirement: Device identifier replaces simulator
The `session start` command SHALL accept `--device <identifier>` instead of `--simulator <UDID>`.

#### Scenario: Start session with device flag
- **WHEN** agent runs `proofrun session start --change "my-change" --device ABC123`
- **THEN** session state stores `device: "ABC123"` (not `simulator`)
- **AND** evidence JSON stores `device: "ABC123"` (not `simulator`)
- **AND** lock resource is named `dev-ABC123` (not `sim-ABC123`)
- **AND** output displays `Device: ABC123`

#### Scenario: Old simulator flag rejected
- **WHEN** agent runs `proofrun session start --change "my-change" --simulator ABC123`
- **THEN** the command exits with an unknown option error (commander default behavior)

### Requirement: Device terminology in session output
All session-related output (start, stop, status) SHALL use "device" terminology instead of "simulator".

#### Scenario: Session stop output
- **WHEN** agent runs `proofrun session stop` with an active session
- **THEN** output shows `Released device: <identifier>` (not `Released simulator`)

#### Scenario: Session status output
- **WHEN** agent runs `proofrun session status` with an active session
- **THEN** output shows `Device: <identifier>` (not `Simulator`)

#### Scenario: Info command output
- **WHEN** agent runs `proofrun info` with an active session
- **THEN** output shows `Device: <identifier>` (not `Simulator`)
- **AND** locks line shows `device(s) in use` (not `simulator(s)`)

### Requirement: Device terminology in evidence and reports
Evidence JSON and HTML reports SHALL use `device` field name instead of `simulator`.

#### Scenario: Evidence JSON structure
- **WHEN** a session is started and evidence is initialized
- **THEN** `evidence.json` contains `"device": "<identifier>"` at the top level
- **AND** does not contain a `simulator` field

#### Scenario: Report template
- **WHEN** a report is generated
- **THEN** the HTML report displays the device identifier under a "Device" label (not "Simulator")

### Requirement: Config error message updated
The `requireConfig()` function SHALL display an updated error message without the `--preset` flag reference.

#### Scenario: Missing config error
- **WHEN** any command requiring config is run without `.proofrun/config.toml`
- **THEN** error message reads: `No .proofrun/config.toml found. Run \`proofrun init\` first.`
