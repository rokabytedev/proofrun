## Context

Proofrun v0.2.0 shipped with a knowledge-base-redesign that removed dev server management from the CLI. However, `findActiveSession()` still checks for `dev_server.pid` as a liveness signal, causing all sessions to immediately crash. Additionally, an E2E test on a real Expo project exposed several design gaps: the CLI tries to allocate abstract "sim slots" that don't map to real devices, port allocation conflicts with Expo's auto-discovery, the workflow ordering is wrong (session before environment), and the report template has a JS syntax error.

The overarching principle: **CLI = dumb bookkeeper, Agent = smart doer**. The CLI should record what the agent tells it, not try to make decisions.

## Goals / Non-Goals

**Goals:**
- Fix the session crash bug and report template bug
- Simplify CLI to bookkeeper role (agent manages simulators and ports)
- Plain text default output for better agent comprehension
- Named criteria for meaningful report labels
- Slim config to genuine user preferences only
- Rewrite SKILL.md with correct workflow ordering and continuous knowledge improvement

**Non-Goals:**
- Adding new verification capabilities (out of scope)
- Changing the evidence data model structure (entries stay JSON-based)
- Multi-platform support beyond iOS simulator (future work)

## Decisions

### D1: Kill `context` command, create `info` command

**What:** Remove `src/commands/context.js`. Create `src/commands/info.js` that returns config, knowledge topics, lock state, diagnostics, and active session — everything from `doctor` plus project metadata.

**Why:** `context` returned only config echo + knowledge_dir path, which the agent could get from `info`. Having `doctor`, `context`, and `knowledge --list` as three separate orientation commands is wasteful.

**Keep `doctor`** as a focused diagnostic command (pass/fail checks). `info` is the all-in-one orientation command.

**`info` plain text output example:**
```
proofrun v0.2.0

Config: .proofrun/config.toml
Knowledge: 5 topics (boundaries, context, environment, interaction, simulators)

Session: none active
Locks: 0 simulators, 0 ports in use

Diagnostics:
  ✓ config valid
  ✓ knowledge directory exists
  ✓ lock directory exists
```

**`info --json` output:** Same data as JSON envelope `{ok, command, data, error}`.

### D2: Plain text default output for all commands

**What:** Change `src/output.js` to support two modes. Add `--json` flag globally via commander. When `--json` is absent, output human-readable plain text. When present, output the current JSON envelope format.

**Implementation in `src/output.js`:**
```js
// Current: success() and error() always output JSON
// New: check global --json flag

let jsonMode = false;
export function setJsonMode(enabled) { jsonMode = enabled; }

export function success(command, data) {
  if (jsonMode) {
    console.log(JSON.stringify({ ok: true, command, data, error: null }));
  } else {
    // Each command provides its own plain text formatter
    // Fallback: pretty-print key-value pairs from data
  }
}
```

Each command's action handler should have a `formatPlainText(data)` function that returns a readable string. The `success()` function calls this when not in JSON mode.

**Global `--json` flag** added in `src/cli.js` on the root program:
```js
program.option('--json', 'Output in JSON format');
program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.optsWithGlobals();
  setJsonMode(!!opts.json);
});
```

### D3: `--criterion <name>` replaces `--ac <number>`

**What:** In `step`, `screenshot`, `judge`, `fix` commands, replace `--ac <n>` (integer) with `--criterion <name>` (string). Evidence entries store `criterion: "settings-translated"` instead of `ac: 1`.

**Evidence JSON entries change:**
```json
// Before
{ "type": "step", "ac": 1, "description": "..." }
// After
{ "type": "step", "criterion": "settings-translated", "description": "..." }
```

**Report groups by criterion name** instead of AC number. The report template renders criterion names as section headers.

**Migration:** No backward compat needed (pre-launch tool).

### D4: Session start as bookkeeper

**What:** Change `session start` to accept `--simulator <UDID>` from the agent. Remove pool_size-based slot allocation and port allocation entirely.

**New signature:**
```bash
proofrun session start --change <name> --simulator <UDID>
```

**Session state.json:**
```json
{
  "session_id": "20260316-abc123",
  "status": "active",
  "change_name": "chinese-locale-audit",
  "started_at": "2026-03-16T20:24:57.357Z",
  "stopped_at": null,
  "simulator": "B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466"
}
```

**Locking:** The CLI locks a file named after the simulator UDID: `.proofrun/locks/sim-<UDID>.lock`. Uses the existing `proper-lockfile` mechanism. When another agent tries to lock the same UDID, it fails with "simulator already in use by session XYZ".

**Session liveness:** Remove the `dev_server.pid` check from `findActiveSession()`. A session is "active" if `state.json` has `status: "active"`. The session stays active until explicit `session stop`. If the agent process dies without stopping, the file lock is automatically released by the OS (proper-lockfile handles this).

**Port:** Not tracked in session metadata. Agent manages ports directly with the OS.

### D5: Slim config

**What:** Remove fields from config.toml and DEFAULTS:

```toml
# BEFORE (19 lines)
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

# AFTER (8 lines)
[session]
evidence_dir = ".proofrun/sessions"

[reports]
output_dir = ".proofrun/reports"
embed_screenshots = true
open_after_generate = false
```

**Removed:**
- `simulator.pool_size` — agent manages simulators directly
- `port_range.*` — agent manages ports, OS is bookkeeper
- `session.lock_dir` — hardcoded to `.proofrun/locks` (internal implementation)

**Kept:**
- `session.evidence_dir` — user may want to customize where sessions are stored
- `reports.output_dir` — user may want reports in a different location
- `reports.embed_screenshots` — genuine preference (large reports vs external files)
- `reports.open_after_generate` — genuine preference

**In `src/config.js`:** Update DEFAULTS, remove pool_size/port_range validation. Hardcode `LOCK_DIR = '.proofrun/locks'` as constant.

### D6: Fix report template bug

**What:** In `templates/report.html` line 142, change:
```js
const REPORT_DATA = /*__REPORT_DATA__*/{};
```
to:
```js
const REPORT_DATA = /*__REPORT_DATA__*/null;
```

The `null` serves as a valid fallback for template preview, and gets replaced by `JSON.stringify(reportData)` during generation. The current `{}` stays after replacement, creating `{...json...}{}` which is a syntax error.

### D7: Rename `dev-server.md` to `environment.md`

**What:** In both `presets/expo/knowledge/` and `presets/react-native-cli/knowledge/`, rename `dev-server.md` to `environment.md`. Update content to be a general "build and run" guide with placeholder comments for agent discovery.

**New `environment.md` template structure:**
```markdown
---
name: Environment Setup
description: How to build, install, and run the app for verification.
  Read when setting up the test environment.
---

## Project Structure
<!-- Agent: is this a monorepo? Where is the app directory? -->

## Build & Install
<!-- Agent: what command builds and installs the app on the simulator? -->

## Dev Server (if applicable)
<!-- Agent: does this project use a dev server (Metro, Flutter, etc.)?
     If so, what command starts it? What port? How does the app connect? -->

## Connection
<!-- Agent: how does the app connect to the dev server?
     URL scheme? Auto-discovery? Manual entry?
     Record the exact connection method here. -->
```

### D8: SKILL.md rewrite

**What:** Rewrite `skills/proofrun/SKILL.md` with these structural changes:

1. **Reorder steps:** Orient → Plan → Set Up Environment → Verify Environment → Start Session → Verify Criteria → Report → Clean Up
2. **First-time explore:** If knowledge files contain `<!-- Agent:` placeholders, the agent MUST fill them in before proceeding. This is not optional.
3. **Continuous knowledge updates:** Core principle stated at top — update knowledge the moment you learn something, not at the end.
4. **Environment checkpoint:** After setup and before session start, verify: correct simulator? fresh build? dev server connected? app functional?
5. **Named criteria:** Examples use `--criterion` not `--ac`
6. **Human-in-the-loop:** If agent can't figure something out after 2 attempts, pause and ask.
7. **No `context` command:** Use `proofrun info` for orientation.

### D9: Update locking.js for UDID-based locks

**What:** Simplify locking to support named resource locks instead of slot-based pools.

**New API:**
```js
// Lock a named resource (simulator UDID, or any string identifier)
acquireLock(lockDir, resourceName) → { lock, heldPath } | null

// Release a lock
releaseLock(lock)

// List locked resources
listLocks(lockDir) → [{ resource, sessionId }]
```

Remove: `ensureSimLockFiles`, `ensurePortLockFiles`, `acquireSimulatorSlot`, `acquirePort`, and all pool-based allocation logic.

Lock files are named `<resourceName>.lock` in the lock directory. The `.lock.held` sidecar file contains the session ID.

## Risks / Trade-offs

- **Breaking all commands:** Every command changes output format. Tests need full rewrite. Acceptable since proofrun is pre-launch.
- **Losing port conflict detection:** Without CLI-managed port pools, two agents could theoretically try the same port. Mitigation: OS rejects duplicate binds, agent retries on next port. Acceptable trade-off for simplicity.
- **UDID in session start:** Agent must know the UDID before starting. This means the agent needs to discover/create simulators before calling `session start`. The SKILL.md must make this clear.
