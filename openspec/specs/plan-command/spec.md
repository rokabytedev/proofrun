## ADDED Requirements

### Requirement: Agent can create a verification plan

The CLI SHALL provide a `proofrun plan add` command that records a planned verification criterion with its spec text and test cases. The plan is stored in the active session directory as `plan.json`.

#### Scenario: Add a criterion with test cases
- **WHEN** the agent runs `proofrun plan add --criterion <name> --spec "<text>" --cases "Case one" --cases "Case two"`
- **THEN** the CLI appends a criterion entry to the session's `plan.json` with the name, spec text, and list of test cases
- **AND** outputs confirmation with the criterion name and number of cases

#### Scenario: Add a criterion without test cases
- **WHEN** the agent runs `proofrun plan add --criterion <name> --spec "<text>"`
- **THEN** the CLI creates a criterion entry with an empty cases array

#### Scenario: Add a criterion with duplicate name
- **WHEN** the agent runs `proofrun plan add` with a criterion name that already exists in the plan
- **THEN** the CLI SHALL error with a message indicating the criterion already exists

#### Scenario: No active session
- **WHEN** the agent runs `proofrun plan add` with no active session
- **THEN** the CLI SHALL error with the standard "no active session" message

### Requirement: Agent can list the verification plan

The CLI SHALL provide a `proofrun plan list` command that displays all planned criteria with their test cases and verification status.

#### Scenario: List plan with mixed status
- **WHEN** the agent runs `proofrun plan list` and some criteria have been judged
- **THEN** the CLI outputs each criterion with: name, spec text, test cases, and status (pending/verified)
- **AND** a criterion is marked "verified" if it has at least one judgment in the session's evidence
- **AND** the output includes a summary line: "N/M criteria verified, X/Y test cases covered"

#### Scenario: No plan exists
- **WHEN** the agent runs `proofrun plan list` and no `plan.json` exists in the session
- **THEN** the CLI outputs a message: "No plan created yet. Run `proofrun plan add` to start."

### Requirement: Agent can check plan coverage

The CLI SHALL provide a `proofrun plan check` command that compares the plan against recorded evidence and reports gaps.

#### Scenario: All criteria verified
- **WHEN** the agent runs `proofrun plan check` and every planned criterion has at least one judgment
- **THEN** the CLI outputs "All planned criteria verified" with the count

#### Scenario: Gaps exist
- **WHEN** the agent runs `proofrun plan check` and some planned criteria have no judgment
- **THEN** the CLI outputs a warning listing each unverified criterion with its spec text
- **AND** the exit code is 0 (warning, not error — CLI is dumb, agent decides)

#### Scenario: Evidence exists for criteria not in plan
- **WHEN** the agent has recorded judgments for criteria that are not in the plan
- **THEN** the CLI lists them under "Unplanned criteria" as informational (not an error)

### Requirement: Plan data structure

The plan SHALL be stored as `plan.json` in the session directory alongside `evidence.json` and `state.json`.

#### Scenario: Plan JSON structure
- **WHEN** a plan is created
- **THEN** the file contains a JSON object with:
  ```json
  {
    "criteria": [
      {
        "criterion": "variant-pills-visible",
        "spec": "Variant pills displayed for multi-variant sounds",
        "cases": ["Sound with 6 variants", "Sound with 2 variants", "Single-variant sound"]
      }
    ],
    "created_at": "ISO timestamp"
  }
  ```

### Requirement: Plan is carry-forward aware

On follow-up runs, the agent creates a new plan. Carried criteria SHALL appear in the plan with their carry reason.

#### Scenario: Plan entry for a carried criterion
- **WHEN** the agent runs `proofrun plan add --criterion <name> --spec "<text>" --carried`
- **THEN** the criterion is marked as `"carried": true` in the plan
- **AND** `proofrun plan check` counts carried criteria as verified (they inherit prior judgment)
