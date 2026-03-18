## Why

Proofrun's config.yaml conflates two fundamentally different things: user preferences (pool size, port range, report settings) and agent knowledge (how to start the dev server, interaction patterns, app navigation). These have different authorship (human vs agent), different lifecycles (static vs evolving), and different formats (strict typed values vs free-form text). The CLI also manages the dev server lifecycle, which the agent is fully capable of doing itself based on free-form instructions.

Separating preferences from knowledge enables:
- **Agent-to-agent knowledge transfer**: Each verification session enriches a knowledge base that future agents benefit from
- **Simpler CLI**: No dev server management, no relay of agent knowledge — just lock management, evidence capture, and reporting
- **Better format fit**: TOML for strict config, markdown with frontmatter for knowledge files
- **Progressive disclosure**: Agents load only the knowledge topics relevant to their current task

## What Changes

- **config.yaml → config.toml**: Slim config with only user preferences (~15 lines). Switch from YAML to TOML for stricter typing.
- **New knowledge/ directory**: Per-topic markdown files with frontmatter (name, description). Seeded from preset templates, enriched by agents over time.
- **New `proofrun knowledge` command**: `--list` shows topic index, `<topic>` reads a file. Plain text default, `--json` optional.
- **Dev server management removed from CLI**: `session start` only acquires locks and creates session state. Agent handles dev server based on knowledge/dev-server.md.
- **Boundaries moves to knowledge**: `boundaries.md` becomes `knowledge/boundaries.md`, seeded from template.
- **Doctor simplified**: Checks infrastructure readiness only (config, knowledge dir, locks). Does not check iosef or dev server — those are agent responsibilities guided by knowledge files.
- **SKILL.md updated**: Teaches agents the workbook mental model — read knowledge, iterate on it, keep it generic.
- **Presets updated**: Seed both config.toml and knowledge/ starter files.

## Capabilities

### New Capabilities

- `knowledge-base`: The `proofrun knowledge` command for reading knowledge files with progressive disclosure (frontmatter index, per-topic retrieval).

### Modified Capabilities

- `cli-core`: Config loading switches from YAML to TOML. Help text updated.
- `session-management`: Dev server lifecycle removed from `session start/stop`. Session locks are session-bound, not PID-bound.
- `project-init`: Presets create config.toml + knowledge/ directory with seeded files.
- `agent-skill`: SKILL.md updated with workbook mental model and knowledge iteration workflow.
- `criteria-extraction`: `proofrun context` simplified — reads config for preferences, returns knowledge directory path. Removed relay of agent knowledge fields.

## Impact

- **Breaking change**: config.yaml → config.toml migration. Existing configs need manual conversion.
- `src/commands/session.js` — significant simplification (remove dev server spawn/monitor/kill)
- `src/commands/context.js` — simplified to return preferences + knowledge path
- `src/config.js` — switch from js-yaml to toml parser
- `src/locking.js` — simplify to session-bound locks (remove PID transfer)
- New: `src/commands/knowledge.js`
- `skills/proofrun/SKILL.md` — rewrite with workbook model
- `presets/` — new format: config.toml + knowledge/ templates
- Dependencies: add `toml` package, potentially remove `js-yaml`
