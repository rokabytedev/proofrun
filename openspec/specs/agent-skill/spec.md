## MODIFIED Requirements

### Requirement: Skill teaches workbook mental model
The SKILL.md MUST teach agents to treat `.proofrun/knowledge/` as an iterative workbook that improves across sessions.

#### Scenario: Knowledge workflow in SKILL.md
- **WHEN** the agent reads the skill
- **THEN** it MUST understand:
  - Read `proofrun knowledge --list` to discover available topics
  - Load only topics relevant to the current task
  - Knowledge is advisory, not authoritative — the app is truth
  - After verification, update knowledge with discoveries
  - Keep notes generic (useful across sessions)
  - Create new topic files for distinct knowledge areas
