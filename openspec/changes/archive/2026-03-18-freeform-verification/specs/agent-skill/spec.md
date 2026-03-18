## MODIFIED Requirements

### Requirement: Skill teaches verification workflow
The SKILL.md MUST teach the agent the end-to-end verification workflow without requiring external documentation. The workflow MUST handle both structured (change-driven) and free-form (query-driven) verification without branching into separate modes.

#### Scenario: Workflow coverage
- **WHEN** the agent reads the skill
- **THEN** it MUST understand:
  - When to trigger proofrun (after implementation with ACs, OR when user requests verification of app behavior)
  - How to check if proofrun is initialized (`config.yaml` exists)
  - How to initialize if not (`npx proofrun init --preset <detected>`)
  - How to gather project context (`npx proofrun context` for free-form, `npx proofrun context <change>` for structured)
  - How to determine what to verify (extract from artifacts OR define from query)
  - How to discover app knowledge (read relevant specs/docs)
  - How to start a session (`npx proofrun session start`)
  - The explore-then-document pattern (use simulator tool freely, record clean path)
  - How to record evidence (`npx proofrun step/screenshot/judge`)
  - How to generate the report (`npx proofrun report`)
  - How to release resources (`npx proofrun session stop`)
  - How to handle human feedback from the report

#### Scenario: Free-form query verification
- **WHEN** the user asks the agent to verify something about the app (e.g., "check Chinese locale translations")
- **THEN** the skill MUST guide the agent to:
  - Break the query into discrete, verifiable criteria with AC numbers
  - Use `npx proofrun context` (no change name) to get project context
  - Start a session with a descriptive slug derived from the query (e.g., `--change "chinese-locale-audit"`)
  - Discover and add ACs during exploration (not required to define all upfront)
  - Follow the same evidence capture and reporting workflow as structured verification

#### Scenario: Structured change verification
- **WHEN** the agent has just completed implementing a change with acceptance criteria
- **THEN** the skill MUST guide the agent to:
  - Use `npx proofrun context <change-name>` to get full context including change artifacts
  - Extract ACs from change artifacts
  - Follow the standard evidence capture and reporting workflow
