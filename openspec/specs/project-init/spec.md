## MODIFIED Requirements

### Requirement: Init creates config and knowledge
`proofrun init --preset <name>` MUST create both `.proofrun/config.toml` and `.proofrun/knowledge/` directory with seeded knowledge files from the preset.

#### Scenario: Expo preset initialization
- **WHEN** `proofrun init --preset expo` is run
- **THEN** it MUST create `.proofrun/config.toml` from the expo preset
- **AND** create `.proofrun/knowledge/` with seeded files: boundaries.md, dev-server.md, interaction.md, simulators.md, context.md
- **AND** add transient dirs to .gitignore
