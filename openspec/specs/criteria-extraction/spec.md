## MODIFIED Requirements

### Requirement: Context command returns preferences and knowledge path
`proofrun context` MUST return slim output: config preferences and knowledge directory path. It MUST NOT relay agent knowledge fields.

#### Scenario: Context without change
- **WHEN** `proofrun context` is run
- **THEN** it MUST return config preferences (simulator, port_range) and knowledge_dir path
- **AND** it MUST NOT include app_knowledge, interaction details, or boundaries (these are in knowledge files)

#### Scenario: Context with change
- **WHEN** `proofrun context <change>` is run
- **THEN** it MUST return the same as no-change, plus `change_name` echoed back
