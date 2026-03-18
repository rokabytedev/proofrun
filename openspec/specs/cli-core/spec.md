## MODIFIED Requirements

### Requirement: Config loading
The CLI MUST load configuration from `.proofrun/config.toml` (TOML format) instead of `.proofrun/config.yaml` (YAML format). The config MUST contain only user preferences that the CLI mechanically needs.

#### Scenario: TOML config loading
- **WHEN** the CLI loads config
- **THEN** it MUST parse `.proofrun/config.toml` using a TOML parser
- **AND** it MUST validate only preference fields: simulator.pool_size, port_range.start/end, session paths, reports settings

#### Scenario: Config validation
- **WHEN** config is loaded
- **THEN** the CLI MUST NOT warn about unknown keys (config is slim, no unknown key detection needed)
- **AND** the CLI MUST error only if mechanically-required fields are invalid
