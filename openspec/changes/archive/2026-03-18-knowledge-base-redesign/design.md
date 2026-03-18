## Context

Proofrun currently uses a single config.yaml that mixes user preferences with agent knowledge. The CLI also manages dev server lifecycle, which adds complexity without adding value (agents can run processes themselves). This redesign separates config from knowledge and simplifies the CLI.

## Goals / Non-Goals

**Goals:**
- Separate user preferences (config.toml) from agent knowledge (knowledge/ directory)
- Remove dev server management from CLI
- Add `proofrun knowledge` command for progressive disclosure of knowledge files
- Simplify session management to lock-only (no PID transfer)
- Seed knowledge from preset templates with battle-tested tooling instructions
- Teach agents the workbook mental model via SKILL.md

**Non-Goals:**
- No changes to evidence capture commands (step, screenshot, judge, note, fix, evidence)
- No changes to report generation
- No migration tool for existing config.yaml → config.toml (pre-launch, just document)

## Decisions

### D1: Config format — TOML

Switch from YAML to TOML for the slim config file.

**Rationale**: Config is now ~15 lines of strict preferences. TOML has unambiguous types (no YAML `yes`/`no` gotcha), explicit section headers, and the `toml` npm package has 3M+ weekly downloads.

**config.toml schema:**
```toml
# .proofrun/config.toml — User preferences only

[simulator]
pool_size = 5

[port_range]
start = 8090
end = 8099

[session]
lock_dir = ".proofrun/locks"
evidence_dir = ".proofrun/sessions"

[reports]
output_dir = ".proofrun/reports"
embed_screenshots = true
open_after_generate = false
```

**Implementation**: Replace `js-yaml` dependency with `toml` package. Update `src/config.js` to look for `config.toml` instead of `config.yaml`. Remove all fields that were relay-only (dev_server, interaction details, change_context, app_knowledge, app, platform, boundaries).

**Validation**: Only validate fields the CLI mechanically needs:
- `simulator.pool_size` — positive integer
- `port_range.start/end` — integers, start <= end
- `session.lock_dir` / `session.evidence_dir` — strings
- `reports.output_dir` — string
- No unknown-key warnings (unnecessary with slim config)

### D2: Knowledge directory structure

```
.proofrun/knowledge/
├── boundaries.md       # What can/cannot verify via simulator
├── dev-server.md       # How to start, monitor, stop dev server
├── interaction.md      # Simulator tool (iosef), element strategy
├── simulators.md       # Available devices, how to manage them
├── context.md          # How to find change context (openspec, etc.)
└── ... (agent creates more as needed)
```

Each file has YAML frontmatter:
```markdown
---
name: Interaction Tool
description: How to interact with the iOS simulator. Read when starting any verification session.
---

## Required Tool: iosef
...
```

The CLI reads frontmatter for `--list` output. Content is free-form markdown.

### D3: Knowledge command

**`proofrun knowledge --list`** — Plain text table of topics with descriptions:
```
Available knowledge:

  boundaries      What the agent can verify via simulator vs what requires
                  human review. Read when classifying criteria.

  dev-server      How to start, monitor, and stop the dev server. Read when
                  starting a verification session.

  interaction     How to interact with the iOS simulator. Read when starting
                  any verification session.
```

With `--json`:
```json
{
  "ok": true,
  "command": "knowledge.list",
  "data": {
    "topics": [
      { "name": "boundaries", "description": "What the agent can verify..." },
      { "name": "dev-server", "description": "How to start, monitor..." }
    ],
    "knowledge_dir": ".proofrun/knowledge"
  }
}
```

**`proofrun knowledge <topic>`** — Prints file content (plain text, including frontmatter):
```
$ proofrun knowledge interaction

name: Interaction Tool
description: How to interact with the iOS simulator...

## Required Tool: iosef
Install the iosef skill: npx skills add riwsky/iosef@ios-simulator-interaction -g
...
```

With `--json`:
```json
{
  "ok": true,
  "command": "knowledge",
  "data": {
    "topic": "interaction",
    "name": "Interaction Tool",
    "description": "How to interact with...",
    "content": "## Required Tool: iosef\n..."
  }
}
```

### D4: Session management simplification

**session start** — Only acquires locks and creates session state:
1. Check no active session exists
2. Ensure lock files exist
3. Acquire simulator slot (poll with timeout)
4. Acquire port from range
5. Create session directory + evidence.json
6. Return: session_id, allocated port, simulator slot

**session stop** — Releases locks and finalizes:
1. Release simulator and port locks
2. Update session state to "stopped"
3. Return: released resources, evidence count, duration

**Removed**: Dev server spawn, ready signal wait, PID transfer, process group kill.

**Lock strategy**: Session-bound locks (Option B from exploration). Lock files contain session ID, not PID. Stale detection via session age — if a session has been "active" for >24 hours, doctor flags it.

**Implementation in `src/locking.js`**:
- Remove `transferLockPid()` — no longer needed
- Change lock held files to contain session ID instead of PID
- Add `isLockStale(heldPath, maxAgeMs)` for stale detection
- Keep `acquireSimulatorSlot()` and `acquirePort()` — they still iterate and acquire first available

### D5: Presets redesign

Each preset is now a directory:
```
presets/
├── expo/
│   ├── config.toml                    # Slim preferences
│   └── knowledge/
│       ├── boundaries.md              # Verification boundaries
│       ├── dev-server.md              # Expo dev server instructions
│       ├── interaction.md             # iosef setup and usage
│       ├── simulators.md              # iOS simulator management
│       └── context.md                 # OpenSpec context discovery
└── react-native-cli/
    ├── config.toml
    └── knowledge/
        ├── boundaries.md
        ├── dev-server.md
        ├── interaction.md
        ├── simulators.md
        └── context.md
```

`proofrun init --preset expo`:
1. Copy `presets/expo/config.toml` → `.proofrun/config.toml`
2. Copy `presets/expo/knowledge/` → `.proofrun/knowledge/`
3. Add gitignore entries for transient dirs

### D6: Context command simplification

`proofrun context` now returns slim output:
```json
{
  "ok": true,
  "command": "context",
  "data": {
    "knowledge_dir": ".proofrun/knowledge",
    "config": {
      "simulator": { "pool_size": 5 },
      "port_range": { "start": 8090, "end": 8099 }
    }
  }
}
```

With a change name, same output (change name is just echoed back for the agent's reference):
```json
{
  "data": {
    "change_name": "add-search",
    "knowledge_dir": ".proofrun/knowledge",
    "config": { ... }
  }
}
```

The agent reads knowledge files directly using `proofrun knowledge <topic>` or by reading the files. Context just points the way.

### D7: Doctor simplification

Doctor checks infrastructure only:
1. **config** — `.proofrun/config.toml` exists and parses
2. **knowledge** — `.proofrun/knowledge/` directory exists with at least one file
3. **locking** — Lock dir is writable, flock or PID-file mechanism available
4. **pool** — Simulator slot availability (N of M available)

Removed checks: interaction tool, dev server command. These are agent responsibilities guided by knowledge files.

### D8: SKILL.md workbook model

Add a new section teaching agents to treat knowledge/ as an iterative workbook:

```markdown
### Knowledge Management

Knowledge files at `.proofrun/knowledge/` are working notes, not specifications.
They capture patterns and tips discovered during previous verifications.

**Before verification**: Run `npx proofrun knowledge --list` to see available topics.
Read topics relevant to your task. Treat them as hints — verify against the actual
app, not the knowledge file.

**After verification**: Update knowledge files with anything you discovered:
- Navigation paths, screen transitions
- Element identifiers and patterns
- Timing quirks, animation waits
- Anything that would make the next verification faster

**Principles**:
- Keep notes generic (useful across sessions, not session-specific)
- If you find something contradicts a knowledge file, update the file
- Create new topic files when you discover a distinct knowledge area
- Knowledge files are advisory — the app is the source of truth
```

## Risks / Trade-offs

- **Breaking change**: Existing config.yaml won't work. Acceptable for pre-launch tool.
- **More files**: knowledge/ directory adds file count. Mitigated by progressive disclosure — agents only read what they need.
- **Agent writes knowledge**: Quality depends on agent judgment. Mitigated by SKILL.md guidance ("keep generic", "not a bible").
- **No dev server management**: Agent must handle it. Mitigated by knowledge/dev-server.md providing clear instructions.
