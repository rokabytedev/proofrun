## ADDED Requirements

### Requirement: Required field validation
`loadConfig` MUST validate that required fields are present and non-empty.

#### Scenario: Missing platform
- **WHEN** config is loaded without a `platform` field
- **THEN** `loadConfig` MUST output a JSON error and exit with code 1
- **AND** the error MUST name the missing field

#### Scenario: Missing dev_server.start
- **WHEN** config is loaded without `dev_server.start`
- **THEN** `loadConfig` MUST output a JSON error and exit with code 1

#### Scenario: Empty app.bundle_id
- **WHEN** config has `app.bundle_id` set to an empty string
- **THEN** `loadConfig` MUST output a JSON error and exit with code 1

### Requirement: Type validation
`loadConfig` MUST validate that numeric fields are valid numbers.

#### Scenario: Non-integer pool_size
- **WHEN** `simulator.pool_size` is set to a string or float
- **THEN** `loadConfig` MUST output a JSON error and exit with code 1

#### Scenario: Non-integer port range values
- **WHEN** `port_range.start` or `port_range.end` is not an integer
- **THEN** `loadConfig` MUST output a JSON error and exit with code 1

### Requirement: Unknown key warnings in doctor
`proofrun doctor` MUST warn about unrecognized top-level config keys.

#### Scenario: Typo in config key
- **WHEN** config contains `dev_servre` (typo) as a top-level key
- **THEN** `proofrun doctor` MUST include a check with `status: "warn"` listing the unknown key

#### Scenario: Valid config keys pass
- **WHEN** config contains only known top-level keys
- **THEN** `proofrun doctor` MUST NOT produce unknown-key warnings
