## Context

Proofrun's CLI, skill, and knowledge layer currently assume iOS. The `--preset` flag on `init` copies framework-specific knowledge templates, the `--simulator` flag on `session start` uses iOS terminology, and SKILL.md contains iOS-specific examples (`xcrun simctl`, `iosef`). The preset system (two directories of near-identical files) creates maintenance burden without proportional value.

The CLI is "dumb" by design — it manages config, locks, evidence, and reports. All intelligence lives in the agent skill and knowledge files. This redesign leans into that principle by making the CLI fully platform-agnostic and moving all platform specifics into knowledge templates that agents populate.

## Goals / Non-Goals

**Goals:**
- Make `proofrun init` preset-free — one universal scaffold
- Rename `--simulator` to `--device` across the entire codebase (CLI flags, internal data, tests, templates, skill)
- Rewrite SKILL.md with clear section ordering: identity → triggers → prerequisites → workflow → principles; no platform-specific content
- Create generic multi-platform knowledge templates with per-platform sections (iOS, Android, Web) and embedded agent discovery instructions
- Delete the `presets/` directory entirely

**Non-Goals:**
- Adding Android or web interaction tool support (knowledge templates will have placeholder sections, but no tooling work)
- Changing the evidence/report format
- Changing session locking mechanics (only renaming the identifier)
- Adding new CLI commands

## Decisions

### 1. `proofrun init` becomes preset-free

**Current**: `proofrun init --preset expo` copies from `presets/expo/`.

**New**: `proofrun init` (no flags) copies from a single `templates/` directory.

The `--preset` flag and all preset logic are removed. The `templates/` directory contains:
- `config.toml` — same universal config (identical across current presets)
- `knowledge/` — generic template files

```
templates/
  config.toml
  knowledge/
    environment.md
    simulators.md
    interaction.md
    boundaries.md
    context.md
```

Rationale: Both existing presets produce identical configs. The knowledge file differences are minor (Expo vs RN CLI build command hints in comments). A single generic template with agent-discovery instructions is more maintainable and extensible.

The `init` command in `src/commands/init.js` changes:
- Remove `--preset` requiredOption
- Remove preset directory resolution logic
- Point to `templates/` directory (at `resolve(__dirname, '../../templates')`)
- Remove `preset` from success output
- Update `requireConfig()` error message in `src/config.js` to say `Run \`proofrun init\` first.` (drop `--preset <name>`)

### 2. `--simulator` → `--device` rename

All references to "simulator" as the device identifier rename to "device". This affects:

**CLI flags** (`src/commands/session.js`):
- `--simulator <UDID>` → `--device <identifier>` on `session start`

**Session state** (`src/commands/session.js`):
- `sessionState.simulator` → `sessionState.device`
- All output format strings: `Simulator: ${data.simulator}` → `Device: ${data.device}`

**Evidence** (`src/session.js`):
- `initEvidence()` parameter: `simulatorUdid` → `deviceId`
- Evidence JSON field: `simulator` → `device`

**Locking** (`src/commands/session.js`):
- Lock resource name: `sim-${opts.simulator}` → `dev-${opts.device}`
- `released_simulator` → `released_device` in stop output

**Info command** (`src/commands/info.js`):
- `data.session.simulator` → `data.session.device`
- Format string: `Simulator: ${data.session.simulator}` → `Device: ${data.session.device}`

**Doctor command** (`src/commands/doctor.js`):
- No changes needed (doesn't reference simulator directly)

**Report template** (`templates/report.html`):
- Replace all `simulator` references with `device` in the HTML/JS template

**Tests**:
- `src/session.test.js` — update all `simulator` field references
- `src/config.test.js` — update if simulator referenced
- `src/commands/report.test.js` — update test fixtures

**CLI help text** (`src/cli.js`):
- Update example in the extended help: `--simulator B1DBC6F9...` → `--device B1DBC6F9...`

**Info command locks display** (`src/commands/info.js`):
- `Locks: ${data.locks.length} simulator(s) in use` → `Locks: ${data.locks.length} device(s) in use`

**Session stop** (`src/commands/session.js`):
- `sim-${state.simulator}` → `dev-${state.device}` for lock release

### 3. SKILL.md restructure

New section ordering:

```
1. Identity & Positioning (what proofrun is, "proof of work" framing)
2. When to Trigger (same triggers, no changes)
3. Getting Started (run info/doctor, follow its guidance — no manual config checks)
4. Workflow (condensed, platform-agnostic)
   4.1 Orient (info + read knowledge)
   4.2 Plan criteria
   4.3 Set up environment (defer to knowledge/environment.md)
   4.4 Verify environment works
   4.5 Start session
   4.6 Verify each criterion (explore → document)
   4.7 Generate report
   4.8 Clean up
5. Principles
   - CLI is dumb, you are smart
   - Record clean paths, not exploration
   - Update knowledge immediately
   - Screenshots are proof
   - If stuck after 2 attempts, ask user
6. Knowledge Management (brief — working notes, not specs)
7. Human Feedback (same as current)
```

Key removals from current SKILL.md:
- `xcrun simctl list devices` example → lives in knowledge/simulators.md
- `iosef tap --identifier` example → lives in knowledge/interaction.md
- `npx expo run:ios` / `npx react-native run-ios` → lives in knowledge/environment.md
- Direct config file checking → replaced with "run `proofrun info` and fix issues"

The "Core Principle: Update Knowledge Continuously" section moves from position 2 (before agent knows what proofrun is) to section 5 (Principles), referenced briefly within the workflow where relevant.

### 4. Generic knowledge templates

Five template files, each with the same pattern:

1. **Purpose header** (frontmatter: name, description)
2. **Agent discovery instructions** (what to figure out, how)
3. **Per-platform sections** (iOS, Android, Web) — all pre-created, agent fills relevant ones
4. **Tool recommendations** per platform

#### `knowledge/environment.md`
Sections: Project Structure, Build & Install, Dev Server, Connection.
Per-platform sub-sections under Build & Install.
No framework-specific hints (no "for Expo: ..." comments). Instead: "Agent: investigate the project to determine the build system and fill in the commands."

#### `knowledge/simulators.md`
Three pre-created platform sections:

```markdown
## iOS Simulator
Recommended interaction tool: iosef
Install: `npx skills add riwsky/iosef@ios-simulator-interaction -g`
<!-- Agent: fill in device management commands, available devices, UDIDs -->

## Android Emulator
Recommended interaction tool: TBD
<!-- Agent: fill in emulator management, AVD names, device IDs -->

## Mobile Web
Recommended interaction tool: TBD (browser automation)
<!-- Agent: fill in browser launch commands, viewport config -->
```

#### `knowledge/interaction.md`
Per-platform sections for interaction tool usage. Each section:
1. States the recommended agent-first tool
2. Links to tool's docs (or says "use context7 to find docs")
3. Placeholder for project-specific patterns (testID conventions, animation timings)

#### `knowledge/boundaries.md`
Already mostly generic. Remove iOS-specific framing. The agent-verifiable vs human-required table stays as-is — it's platform-agnostic.

#### `knowledge/context.md`
Already generic. No changes needed.

### 5. Delete `presets/` directory

The entire `presets/` directory (expo + react-native-cli) is removed. All content migrates to `templates/`.

## Risks / Trade-offs

**First-run experience is slightly less guided**: Without preset-specific hints, the agent does more exploration on first init. Mitigated by the knowledge template instructions being clear about what to discover.

**Existing `.proofrun/` directories break**: Users who already ran `proofrun init --preset expo` have knowledge files in the old format. Not a concern — proofrun is pre-launch, no backward compatibility required.

**`--device` is more generic but loses clarity**: "simulator" immediately tells you it's a virtual device. "device" could mean physical too. Acceptable because proofrun may eventually support physical devices, and the identifier (UDID/AVD name) is what matters.

**Lock file naming changes** (`sim-` → `dev-` prefix): Any active locks from before the rename won't be found by the new code. Acceptable — pre-launch tool, and sessions are short-lived.
