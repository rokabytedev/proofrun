## ADDED Requirements

### Requirement: HTML report generation
`proofrun report` MUST generate a self-contained interactive HTML file from the session evidence.

#### Scenario: Generate report
- **WHEN** `proofrun report` is run during or after a session
- **THEN** it MUST create an HTML file at `.proofrun/reports/<date>-<change-name>.html`
- **AND** the file MUST be self-contained (all screenshots base64-encoded inline, all JS/CSS inline)
- **AND** it MUST be openable in any browser without a server

#### Scenario: Report with --open flag
- **WHEN** `proofrun report --open` is run
- **THEN** it MUST generate the report and open it in the default browser

### Requirement: Report summary section
The report MUST include a summary at the top.

#### Scenario: Summary contents
- **WHEN** the report is viewed
- **THEN** it MUST display: change name, date, simulator device, total ACs, verified count, failed count, human-required count

### Requirement: Per-AC evidence sections
The report MUST include one section per acceptance criterion.

#### Scenario: AC section contents
- **WHEN** an AC section is viewed
- **THEN** it MUST display:
  - AC number and criterion text
  - Status badge (verified / failed / human-required)
  - Agent's reasoning for the judgment
  - All screenshots attached to this AC (zoomable)
  - All verification steps recorded for this AC
  - Commands used (interaction tool commands for reproducibility)

### Requirement: Interactive feedback controls
Each AC section MUST include controls for human feedback.

#### Scenario: Accept/reject buttons
- **WHEN** a human reviews an AC section
- **THEN** they MUST be able to click Accept or Reject
- **AND** the selection MUST be visually indicated
- **AND** a text field MUST appear for comments on rejection

#### Scenario: Screenshot annotation
- **WHEN** a human clicks on a screenshot in the report
- **THEN** they MUST be able to draw on it (circles, arrows, freehand)
- **AND** add text annotations
- **AND** the annotations MUST be saved with the feedback

### Requirement: Feedback export
The report MUST support exporting human feedback for agent consumption.

#### Scenario: Export as JSON
- **WHEN** the human clicks "Export Feedback" in the report
- **THEN** a JSON file MUST be downloaded containing:
  - Per-AC: accept/reject status, comments, annotation data
  - Overall: summary of rejections and comments
- **AND** this JSON MUST be readable by the agent for follow-up fixes

#### Scenario: Feedback saved alongside report
- **WHEN** feedback is given in the report
- **THEN** the feedback state MUST be persisted in browser localStorage keyed by session ID
- **AND** re-opening the same report MUST restore previous feedback state
