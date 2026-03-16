## ADDED Requirements

### Requirement: Knowledge directory structure
Proofrun MUST store agent knowledge as per-topic markdown files in `.proofrun/knowledge/`.

#### Scenario: Knowledge file format
- **WHEN** a knowledge file exists at `.proofrun/knowledge/<topic>.md`
- **THEN** it MUST have YAML frontmatter with `name` and `description` fields
- **AND** the body MUST be free-form markdown

### Requirement: Knowledge list command
`proofrun knowledge --list` MUST display an index of available knowledge topics.

#### Scenario: Plain text list
- **WHEN** `proofrun knowledge --list` is run
- **THEN** it MUST print each topic's filename (without .md) and description from frontmatter
- **AND** output MUST be plain text by default

#### Scenario: JSON list
- **WHEN** `proofrun knowledge --list --json` is run
- **THEN** it MUST output JSON with `{ ok, command, data: { topics: [...], knowledge_dir } }`

#### Scenario: Empty knowledge directory
- **WHEN** `.proofrun/knowledge/` exists but has no .md files
- **THEN** the command MUST output an empty list, not error

### Requirement: Knowledge read command
`proofrun knowledge <topic>` MUST read and display a specific knowledge file.

#### Scenario: Plain text read
- **WHEN** `proofrun knowledge interaction` is run
- **THEN** it MUST print the file content including frontmatter as readable text

#### Scenario: JSON read
- **WHEN** `proofrun knowledge interaction --json` is run
- **THEN** it MUST output JSON with `{ ok, command, data: { topic, name, description, content } }`
- **AND** `content` MUST be the markdown body (without frontmatter)

#### Scenario: Topic not found
- **WHEN** `proofrun knowledge nonexistent` is run
- **THEN** it MUST error with a message listing available topics
