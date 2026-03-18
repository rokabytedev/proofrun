## ADDED Requirements

### Requirement: Preset-driven initialization
`proofrun init --preset <name>` MUST create a `proofrun.config.yaml` with sensible defaults for the specified platform.

#### Scenario: Expo preset
- **WHEN** `proofrun init --preset expo` is run
- **THEN** it MUST create `proofrun.config.yaml` with:
  - `platform: ios`
  - `dev_server.start: "npx expo start --port {{port}}"`
  - `dev_server.ready_signal: "Bundling complete"`
  - `interaction.tool: iosef`
  - `interaction.element_strategy: identifier`
  - `interaction.testid_attribute: testID`
  - Default port range and simulator pool config
- **AND** prompt for `app.bundle_id` if not auto-detected from `app.json`

#### Scenario: Auto-detect from project files
- **WHEN** `proofrun init --preset expo` is run in a project with `app.json`
- **THEN** the CLI MUST auto-detect `app.bundle_id` from `app.json` → `expo.ios.bundleIdentifier`
- **AND** auto-detect display name from `expo.name`

### Requirement: Doctor check
`proofrun doctor` MUST verify the environment is ready for proofrun.

#### Scenario: All checks pass
- **WHEN** `proofrun doctor` is run
- **THEN** it MUST check and report:
  - proofrun.config.yaml exists and is valid
  - Simulator interaction tool is available (e.g., `iosef --help`)
  - flock is available (or fallback lockfile mechanism)
  - Dev server command is executable
  - At least one simulator is available
- **AND** output a pass/fail summary

#### Scenario: Missing tool
- **WHEN** a required tool is missing (e.g., iosef not installed)
- **THEN** `proofrun doctor` MUST show the failure with installation instructions

### Requirement: Gitignore setup
`proofrun init` MUST ensure `.proofrun/` is gitignored.

#### Scenario: Add to gitignore
- **WHEN** `proofrun init` is run
- **THEN** it MUST add `.proofrun/` to `.gitignore` if not already present
- **AND** `proofrun.config.yaml` MUST NOT be gitignored (it's project config, should be committed)
