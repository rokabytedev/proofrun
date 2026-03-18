## ADDED Requirements

### Requirement: Report aggregates sessions by change name
`proofrun report --change <name>` SHALL find all sessions with matching `change_name` and generate a single report with multiple runs.

#### Scenario: Multiple sessions for same change
- **WHEN** agent runs `npx proofrun report --change ai-feedback-sound-detail`
- **AND** two stopped sessions exist with `change_name: "ai-feedback-sound-detail"`
- **THEN** the report SHALL contain two runs ordered chronologically
- **AND** each run SHALL have its own criteria, evidence, and prerequisites

#### Scenario: Single session for change
- **WHEN** only one session exists for the change name
- **THEN** the report SHALL render normally with one run (no tabs needed, or single tab)

#### Scenario: No sessions found
- **WHEN** no sessions exist for the change name
- **THEN** the CLI SHALL exit with error: "No sessions found for change '<name>'"

### Requirement: Report displays run tabs
The multi-run report SHALL display tabs for each run, labeled with run number and reason.

#### Scenario: Tab labels
- **WHEN** Run #1 has no reason and Run #2 has reason "fix card-tap"
- **THEN** tabs SHALL display: "Run #1 (Initial)" and "Run #2: fix card-tap"
- **AND** the latest run tab SHALL be selected by default

### Requirement: Session start accepts reason flag
`proofrun session start` SHALL accept an optional `--reason <text>` flag stored in session state.

#### Scenario: Start with reason
- **WHEN** agent runs `npx proofrun session start --change X --device D --reason "fix card-tap"`
- **THEN** `state.json` SHALL contain `reason: "fix card-tap"`

#### Scenario: Start without reason
- **WHEN** agent runs `npx proofrun session start --change X --device D` (no reason)
- **THEN** `state.json` SHALL contain `reason: null`

### Requirement: Criteria carry forward approval status
Criteria from prior runs that are carried forward SHALL inherit their approval status from the prior run's feedback.

#### Scenario: Approved criterion carried forward
- **WHEN** Run #1 criterion "chevron-visible" was approved in feedback
- **AND** Run #2 carries "chevron-visible" via `proofrun carry`
- **THEN** the Run #2 report SHALL show "chevron-visible" as "Carried from Run #1" with auto-approved status

#### Scenario: Re-verified criterion resets approval
- **WHEN** Run #2 has new evidence for "card-tap" (re-verified)
- **THEN** the approval status SHALL be empty (needs new review)
- **AND** the criterion SHALL show "Re-verified" badge

#### Scenario: New criterion has empty approval
- **WHEN** Run #2 introduces "card-tap-opens-respell" (not in Run #1)
- **THEN** the criterion SHALL show "New" badge with empty approval status

### Requirement: Top-level comment box
The report SHALL display a textarea above the criteria list for general reviewer comments.

#### Scenario: Top-level comment in feedback
- **WHEN** reviewer types "must re-verify everything" in the top-level comment box
- **AND** submits feedback
- **THEN** the feedback JSON SHALL contain `top_level_comment: "must re-verify everything"`
