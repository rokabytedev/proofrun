## ADDED Requirements

### Requirement: Test runner configuration
The project MUST have `npm test` configured to run all test files using Node.js built-in test runner.

#### Scenario: Run all tests
- **WHEN** `npm test` is run
- **THEN** all `src/**/*.test.js` files MUST execute
- **AND** exit code 0 MUST indicate all tests passed
- **AND** exit code 1 MUST indicate at least one test failed

### Requirement: Config module tests
Tests MUST cover the config loading and validation logic.

#### Scenario: withDefaults merges correctly
- **WHEN** a partial config is passed to `withDefaults`
- **THEN** missing fields MUST be filled from defaults
- **AND** explicitly set fields MUST override defaults
- **AND** nested objects MUST be deep-merged (not replaced)

#### Scenario: findConfigPath walks parent directories
- **WHEN** `findConfigPath` is called from a nested subdirectory
- **THEN** it MUST find `.proofrun/config.yaml` in a parent directory

#### Scenario: Malformed YAML produces JSON error
- **WHEN** `.proofrun/config.yaml` contains invalid YAML
- **THEN** `loadConfig` MUST output a JSON error envelope
- **AND** the error message MUST include the parse failure reason

### Requirement: Locking module tests
Tests MUST cover lock acquisition, release, and port validation.

#### Scenario: Sequential acquires get different slots
- **WHEN** two simulator slots are acquired from the same process
- **THEN** they MUST return different slot numbers

#### Scenario: Port validation rejects bad values
- **WHEN** `isPortInUse` is called with a non-integer or out-of-range value
- **THEN** it MUST throw an error

#### Scenario: Lock transfer writes new PID
- **WHEN** `transferLockPid` is called with a new PID
- **THEN** the lock held file MUST contain the new PID

### Requirement: Session module tests
Tests MUST cover session state management and evidence operations.

#### Scenario: generateSessionId format
- **WHEN** `generateSessionId` is called
- **THEN** it MUST return a string matching the pattern `YYYYMMDDHHMMSS-<random>`

#### Scenario: appendEvidence increments entry IDs
- **WHEN** multiple evidence entries are appended
- **THEN** each entry MUST have a sequential ID starting from 1

#### Scenario: loadEvidence handles corrupted JSON
- **WHEN** `evidence.json` contains invalid JSON
- **THEN** `loadEvidence` MUST return null (not throw)

#### Scenario: findActiveSession returns newest active
- **WHEN** multiple session directories exist
- **THEN** `findActiveSession` MUST return the most recent session with status "active"

### Requirement: Report data builder tests
Tests MUST cover the report data assembly logic.

#### Scenario: buildReportData groups entries by AC
- **WHEN** evidence contains entries for multiple ACs
- **THEN** `buildReportData` MUST group steps, screenshots, judgments, and fixes by AC number

#### Scenario: buildReportData computes summary counts
- **WHEN** evidence contains mixed pass/fail/human judgments
- **THEN** the summary MUST contain correct counts for each status
