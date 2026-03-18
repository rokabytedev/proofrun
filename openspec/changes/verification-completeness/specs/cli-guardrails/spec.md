## ADDED Requirements

### Requirement: Judge warns when no screenshot exists for criterion

When the agent records a judgment, the CLI SHALL check the current session's evidence for screenshots associated with that criterion and warn if none exist.

#### Scenario: Judgment without screenshot
- **WHEN** the agent runs `proofrun judge --criterion <name> --pass "<reasoning>"`
- **AND** no screenshot entry with that criterion exists in the session's evidence
- **THEN** the CLI outputs the judgment confirmation as normal
- **AND** prints a warning: "Warning: No screenshot recorded for criterion '<name>'. Judgments without screenshots are harder to review."

#### Scenario: Judgment with existing screenshot
- **WHEN** the agent runs `proofrun judge --criterion <name> --pass "<reasoning>"`
- **AND** at least one screenshot entry with that criterion exists in the session's evidence
- **THEN** the CLI outputs the judgment confirmation with no warning

#### Scenario: Human-required judgment
- **WHEN** the agent runs `proofrun judge --criterion <name> --human "<reasoning>"`
- **AND** no screenshot exists for that criterion
- **THEN** the CLI SHALL still warn — human reviewers benefit from seeing what the agent saw

### Requirement: Session stop warns about unfilled knowledge placeholders

When the agent stops a session, the CLI SHALL scan knowledge files for unfilled `<!-- Agent:` placeholders and warn if any remain.

#### Scenario: Unfilled placeholders exist
- **WHEN** the agent runs `proofrun session stop`
- **AND** knowledge files in the project's `.proofrun/knowledge/` directory contain `<!-- Agent:` comment blocks
- **THEN** the CLI prints a warning listing each file with unfilled placeholders
- **AND** the session still stops successfully (warning, not error)

#### Scenario: All placeholders filled
- **WHEN** the agent runs `proofrun session stop`
- **AND** no knowledge files contain `<!-- Agent:` comment blocks
- **THEN** the CLI stops the session with no additional warnings

#### Scenario: No knowledge directory
- **WHEN** the agent runs `proofrun session stop`
- **AND** no `.proofrun/knowledge/` directory exists
- **THEN** the CLI stops the session with no warnings (knowledge is optional)

### Requirement: Session stop warns about plan coverage gaps

When the agent stops a session, the CLI SHALL check if a plan exists and report any unverified criteria.

#### Scenario: Plan has unverified criteria
- **WHEN** the agent runs `proofrun session stop`
- **AND** `plan.json` exists in the session directory with criteria that have no corresponding judgment
- **THEN** the CLI prints a warning listing each unverified criterion
- **AND** the session still stops successfully

#### Scenario: No plan exists
- **WHEN** the agent runs `proofrun session stop`
- **AND** no `plan.json` exists in the session directory
- **THEN** the CLI stops the session with no plan-related warnings
