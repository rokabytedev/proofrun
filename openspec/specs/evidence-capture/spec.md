## ADDED Requirements

### Requirement: Step recording
`proofrun step` MUST record a verification step description, optionally associated with an AC.

#### Scenario: Record a step
- **WHEN** `proofrun step "Navigate to Library tab" --ac 1` is run
- **THEN** the step MUST be appended to the session's evidence log
- **AND** include a timestamp, the description text, and the AC number

#### Scenario: Step without AC association
- **WHEN** `proofrun step "Launch app"` is run without `--ac`
- **THEN** the step MUST be recorded as a general setup step, not tied to any specific AC

### Requirement: Screenshot capture
`proofrun screenshot` MUST attach a screenshot image to the session evidence, optionally linked to an AC.

#### Scenario: Screenshot with file path
- **WHEN** `proofrun screenshot /path/to/screenshot.jpeg --ac 1` is run
- **THEN** the image file MUST be copied to `.proofrun/sessions/<session-id>/screenshots/`
- **AND** a reference MUST be added to the evidence log with the AC association

#### Scenario: Screenshot with note
- **WHEN** `proofrun screenshot /path/to/image.jpeg --ac 2 --note "Search results visible"` is run
- **THEN** the note MUST be stored alongside the screenshot reference in the evidence log

### Requirement: Judgment recording
`proofrun judge` MUST record the agent's pass/fail judgment for an AC with reasoning.

#### Scenario: Pass judgment
- **WHEN** `proofrun judge --ac 1 --pass "Search bar found at (398, 98) via interaction tool find"` is run
- **THEN** the judgment MUST be recorded with status "pass", the AC number, and the reasoning text

#### Scenario: Fail judgment
- **WHEN** `proofrun judge --ac 3 --fail "Clear button not found — missing testID"` is run
- **THEN** the judgment MUST be recorded with status "fail", the AC number, and the reasoning text

#### Scenario: Human-required judgment
- **WHEN** `proofrun judge --ac 4 --human "Cannot verify audio output"` is run
- **THEN** the judgment MUST be recorded with status "human-required" and the reasoning text

#### Scenario: Duplicate judgment replaces previous
- **WHEN** a judgment is recorded for an AC that already has a judgment
- **THEN** the new judgment MUST replace the previous one (supports fix-and-retry workflow)

### Requirement: Note recording
`proofrun note` MUST add freeform text to the evidence log.

#### Scenario: Add a note
- **WHEN** `proofrun note "App is in Chinese locale, using --identifier selectors"` is run
- **THEN** the note MUST be appended to the evidence log with a timestamp

### Requirement: Evidence log format
All evidence MUST be stored in a structured JSON file within the session directory.

#### Scenario: Evidence log structure
- **WHEN** evidence is recorded during a session
- **THEN** it MUST be stored at `.proofrun/sessions/<session-id>/evidence.json`
- **AND** the file MUST be valid JSON at all times (append-safe)
- **AND** each entry MUST have: type (step/screenshot/judge/note), timestamp, and entry-specific fields
