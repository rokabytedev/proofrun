## ADDED Requirements

### Requirement: Carry command records criterion carryover
`proofrun carry --criterion <name> --reason <text>` SHALL record a carry evidence entry linking to the prior run's judgment.

#### Scenario: Carry a criterion
- **WHEN** agent runs `npx proofrun carry --criterion chevron-visible --reason "No code changes affect chevron"`
- **AND** an active session exists with a prior stopped session for the same change
- **THEN** evidence.json SHALL contain an entry with `type: "carry"`, `criterion: "chevron-visible"`, `reason: "No code changes affect chevron"`, `carried_from_session`, and `carried_from_run`

#### Scenario: Criterion not in prior run
- **WHEN** agent runs `npx proofrun carry --criterion nonexistent --reason "..."`
- **AND** the prior run has no evidence for "nonexistent"
- **THEN** the CLI SHALL exit with error: "Criterion 'nonexistent' not found in prior run"

#### Scenario: No prior session exists
- **WHEN** agent runs `npx proofrun carry --criterion X --reason "..."`
- **AND** no prior stopped session exists for this change name
- **THEN** the CLI SHALL exit with error: "No prior session found for change '<name>'. Cannot carry criteria without a prior run."

#### Scenario: No active session
- **WHEN** agent runs `npx proofrun carry` without an active session
- **THEN** the CLI SHALL exit with error: "No active session"
