## ADDED Requirements

### Requirement: Accurate verification boundaries
`boundaries.md` SHALL accurately classify what agents can and cannot verify.

#### Scenario: Internationalization is agent-verifiable
- **WHEN** reading `boundaries.md`
- **THEN** internationalization (translations, locale formatting, RTL layout positioning) SHALL be listed as agent-verifiable
- **AND** SHALL NOT appear in the human-required section

#### Scenario: Visual polish split
- **WHEN** reading `boundaries.md`
- **THEN** objective visual properties (alignment, text overflow, element overlap) SHALL be listed as agent-verifiable
- **AND** animations (smoothness, timing feel) and subjective aesthetic judgment SHALL be listed as human-required

#### Scenario: Classification guidelines accuracy
- **WHEN** reading `boundaries.md` classification guidelines
- **THEN** the human-required guideline SHALL reference "human sensory perception that tools cannot capture (hearing, animation feel) or subjective aesthetic judgment"
- **AND** SHALL NOT use the broad term "visual judgment"

### Requirement: Interaction.md deduplication
`interaction.md` SHALL be the sole location for interaction tool references.

#### Scenario: No device management in interaction.md
- **WHEN** reading `interaction.md`
- **THEN** it SHALL contain interaction patterns (how to tap, find elements, take screenshots)
- **AND** SHALL NOT contain device provisioning or boot/shutdown instructions (those belong in `devices.md`)

### Requirement: Export feedback JSON button in report
The report HTML SHALL include a button to export feedback as a JSON file.

#### Scenario: Export button in serve mode
- **WHEN** the report is displayed in serve mode
- **THEN** an "Export Feedback JSON" button SHALL be visible
- **AND** it SHALL be styled as a secondary/muted button below the primary feedback buttons

#### Scenario: Export button in static mode
- **WHEN** the report is opened as a static file
- **THEN** an "Export Feedback JSON" button SHALL be visible (as the only feedback-related action)

#### Scenario: Export downloads JSON file
- **WHEN** user clicks "Export Feedback JSON"
- **THEN** the browser SHALL download a `.json` file containing the current feedback state in the same structure as the feedback POST body

### Requirement: Remove legacy single-session report code
The `--session` flag and single-session code path SHALL be removed from the report command.

#### Scenario: No --session flag
- **WHEN** agent runs `proofrun report --session <id>`
- **THEN** the CLI SHALL show an error for unknown option

#### Scenario: Report requires --change or auto-detects
- **WHEN** agent runs `proofrun report` without `--change`
- **THEN** the CLI SHALL attempt to auto-detect the change name from the active session or most recent session
- **AND** if no session exists, SHALL error with "Specify --change <name>"

#### Scenario: No --open flag
- **WHEN** agent runs `proofrun report --open`
- **THEN** the CLI SHALL show an error for unknown option

#### Scenario: No legacy fields in report data
- **WHEN** `buildMultiRunReportData` generates report data
- **THEN** the top-level object SHALL NOT contain legacy convenience fields (`session_id`, `summary`, `criteria`) — only `change_name`, `runs`, `latest_run`, `generated_at`
