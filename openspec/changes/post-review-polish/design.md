## Context

Proofrun currently stores device locks in `.proofrun/locks/` relative to the project root. This is invisible to agents running in other git worktrees of the same project or agents verifying other projects that share the same physical simulators/emulators. The SKILL.md workflow has several gaps: vague knowledge-update instructions, a non-agent-verifiable example (recording flow), missing background-task instructions for the serve command, and incorrect workflow ordering (stop session after serve instead of before). Templates contain inaccurate verification boundaries and the `simulators.md` template conflates device management with interaction concerns. Legacy single-session report code (`--session` flag) creates redundancy since the multi-run report already handles single-session cases.

## Goals / Non-Goals

**Goals:**
- Device locks are system-global (`~/.proofrun/locks/`), visible to all agents on the machine regardless of project or worktree
- Agents can diagnose and resolve stale locks without human help
- SKILL.md provides clear, actionable instructions for device management, knowledge updates, serve workflow, and human communication
- Templates accurately classify what agents can and cannot verify
- Device management and interaction concerns are cleanly separated in templates
- No legacy single-session code paths remain

**Non-Goals:**
- Automatic device pool creation (the SKILL.md instructs the agent, the CLI doesn't automate pool provisioning)
- Android emulator or web browser pool management (only iOS simulator pool guidance for now; Android/web are TBD)
- Distributed locking across networked machines (locks are per-machine only)
- Port conflict resolution at the CLI level (SKILL.md guides agents, CLI doesn't manage ports)

## Decisions

### 1. Lock directory moves to `~/.proofrun/locks/`

**Why:** Simulators and emulators are system resources, not project resources. An agent in worktree A and an agent in project B share the same physical device pool. Project-local locks are invisible across these boundaries.

**Alternative considered:** `<project-root>/.proofrun/locks/` with a symlink to a global dir. Rejected because the project-local path is already used for sessions — having locks sometimes local and sometimes global via symlinks is confusing. A clean global path is simpler.

**Implementation:**
- `src/locking.js`: `getGlobalLockDir()` returns `~/.proofrun/locks/` (using `os.homedir()`). Create the directory on first use.
- Remove `LOCK_DIR` constant from `src/config.js` — it's no longer project-relative.
- `src/commands/session.js`: Replace `resolve(projectRoot, LOCK_DIR)` with `getGlobalLockDir()`.
- `src/commands/info.js` and `src/commands/doctor.js`: Update lock dir references to use global path.
- `src/config.test.js`: Remove the `LOCK_DIR` test.

### 2. Enriched lock held files with stale detection

**Current format:** `.lock.held` file contains just the session ID string.

**New format:** JSON with diagnostic metadata:
```json
{
  "session_id": "20260315100000-aaaaaa",
  "project": "/Users/rokabyte/Development/accent",
  "device": "B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466",
  "locked_at": "2026-03-15T10:00:00Z",
  "pid": 12345
}
```

`pid` is the process ID of the CLI process that acquired the lock (i.e., the `proofrun session start` process's parent — the agent's shell process). This enables stale detection: if the PID is no longer running, the lock is likely stale.

**Stale detection logic in `isLockStale(lockData)`:**
1. Check if `lockData.pid` is still alive using `process.kill(pid, 0)` (signal 0 tests existence without killing)
2. If PID is dead → stale
3. If PID is alive → check if the session state file in `lockData.project` shows `status: "stopped"` for `lockData.session_id`. If stopped → stale (session ended but lock wasn't released, likely a crash between session stop and lock release).
4. Otherwise → active

### 3. `--force-unlock` flag on `session start`

When `session start --device <id>` finds the device is locked, it fails with an error message that includes:
- Who holds the lock (session ID, project path, PID)
- Whether the lock appears stale (PID dead or session stopped)
- If stale: suggest `session start --device <id> --force-unlock` to take over
- If active: tell agent to ask human for approval before using `--force-unlock`

`--force-unlock` removes the existing `.lock.held` file and acquires a new lock. It works regardless of whether the lock is stale or active — the guard is at the SKILL.md instruction level (agent must ask human if lock is active).

### 4. `proofrun device status` command

New command: `proofrun device status [--device <id>]`

Without `--device`: lists all devices with locks and their status (free/locked/stale).
With `--device <id>`: shows detailed status for one device.

Output (plain text):
```
Device: B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466
Status: locked (stale — PID 12345 is not running)
Session: 20260315100000-aaaaaa
Project: /Users/rokabyte/Development/accent
Locked at: 2026-03-15T10:00:00Z

Suggestion: Lock appears stale. Use `proofrun session start --device B1DBC6F9 --force-unlock` to take over.
```

JSON output follows the standard `{ok, command, data}` envelope.

This command reads from `~/.proofrun/locks/` and does not require a project config (it's a global system command). However, for simplicity, we'll still require `proofrun` to be run from a project directory (config is needed for other commands, and it avoids special-casing). We can relax this later if needed.

Actually, since this command only reads global lock state, it should work without a project config. Add a `requireConfig: false` path: if config exists, use it; if not, just read global locks without project context.

**Implementation:** Create `src/commands/device.js` with `registerDevice(program)`. The `device` command has subcommand `status`. Register in `src/cli.js`.

### 5. SKILL.md workflow ordering fix

**Current order:** ... → Generate Report → Serve Report → Clean Up (session stop) → Handle Feedback → Follow-Up Runs

**Corrected order:**
1. (steps 1-8 unchanged)
2. **Stop Session** — release device lock immediately after evidence is collected
3. **Generate Report** — can happen after session is stopped (evidence files are written)
4. **Serve Report for Feedback** — explicit background task instruction
5. **Handle Feedback** — read feedback, decide next action
6. **If rejections → Follow-Up Run** — acquire device again, fix, new session

Rationale: The device is a shared resource. Holding it during human review (could be 30+ minutes) wastes resources and blocks other agents. Evidence is finalized at session stop; report generation reads from files.

### 6. Background task instruction for serve

The SKILL.md must instruct the agent to use Claude Code's background task capability, not just shell `&`. The instruction should be explicit:

```
Run the serve command as a **background task** (not foreground) so you receive a notification when feedback arrives:

[Run `npx proofrun serve --change <name>` as a background task]

Then tell the user:

> Your verification report is ready for review at http://localhost:<PORT>
>
> Please review each criterion — approve or reject with comments.
> Click **Submit Feedback** when done (or **LGTM** to approve everything).
> I'll be notified automatically and will address any feedback.
```

### 7. Knowledge update DOs/DONTs

Replace the vague "Update knowledge files as you discover things" with an explicit mapping table in SKILL.md:

| Discovery | Target File | Example |
|-----------|-------------|---------|
| Build command, dev server setup | `environment.md` | "Build: `npx expo run:ios`" |
| Element identifiers, testID patterns | `interaction.md` | "Settings tab: `accessibilityIdentifier='settings-tab'`" |
| Navigation patterns, interaction quirks | `interaction.md` | "Bottom tab bar requires double-tap on iPad" |
| New devices added to pool | `devices.md` | "(Proofrun-only) iPhone 17 Pro Max — UDID-123" |
| Verification boundary discovered | `boundaries.md` | "Audio playback: human-required" |

**Never put in knowledge files:**
- Current screen state or test observations
- Session-specific criteria or results
- Temporary workarounds for this verification run
- Anything that will be different next session

### 8. `simulators.md` → `devices.md` rename and restructure

Rename the template and restructure around three concerns:

1. **Device Management Policy** — Agent prompts human on first run: dedicated pool (recommended) vs. use-available. Records choice. All future agents read it.

2. **Device Pool** (if dedicated-pool policy) — Lists the proofrun-dedicated devices with identifiers. Agent fills this in after creating devices per the guidance in SKILL.md.

3. **Device Lifecycle** — How to boot, use, and shut down devices. Includes post-verification cleanup (shut down simulator after LGTM to free RAM).

Remove the Stable/Observed split — prerequisites handle the "verify each session" concern already.

Remove iosef reference — that belongs in `interaction.md` only.

### 9. Device pool management in SKILL.md

Add a section to SKILL.md "Set Up Environment" that instructs the agent:

- Read `devices.md` for device management policy
- If no policy recorded yet → ask human: (1) dedicated pool (recommended) or (2) use-available
- If dedicated pool and no devices exist → create devices following principles:
  - Research latest OS version first (e.g., `xcrun simctl list runtimes`)
  - Start with 3 devices (unless human requests otherwise)
  - Name format: `(Proofrun-only) <Device Name>` (e.g., `(Proofrun-only) iPhone 17 Pro Max`)
  - Form factor variety: large phone (latest gen), small phone (prior gen), tablet
  - Record the created devices in `devices.md`
- If use-available → warn about race condition risk, ask human before each device use

### 10. `boundaries.md` accuracy fixes

**Remove from human-required:**
- "Complex internationalization | RTL layouts, font rendering edge cases" — LLMs can verify translations, locale formatting, and RTL element positioning via the accessibility tree and coordinates

**Refine "Visual polish":**
- Split into: animations (human-required) and objective visual properties (agent-verifiable)
- Agent-verifiable: alignment (coordinates), text overflow (accessibility tree), element overlap (coordinate comparison)
- Human-required: animation smoothness/feel, subjective aesthetic judgment

**Update classification guidelines:**
- Replace "human perception (hearing, visual judgment)" with: "human sensory perception that tools cannot capture (hearing, animation feel) or subjective aesthetic judgment"

### 11. Remove legacy single-session report code

**In `src/commands/report.js`:**
- Remove the `--session <id>` option
- Remove the entire single-session code path (the `else` branch at line 34-96)
- The `report` command now always requires `--change <name>`
- If `--change` is not provided, attempt auto-detection: find the active session's `change_name` and use that. If no active session exists, check the most recent session's `change_name`. If nothing found, error with "Specify --change <name>".
- Remove `--open` flag (users use `proofrun serve` to view reports now, or can manually open the file)
- Remove the legacy fields (`session_id`, `summary`, `criteria`) from the top-level report data that were for backward compat
- Remove the `proofrun report --open` line from SKILL.md

**In `src/commands/report.test.js`:**
- `buildReportData` tests stay (it's still used internally by `buildMultiRunReportData`)
- No test changes needed — tests already use both functions

**In `src/cli.js` HELP_TEXT:**
- Remove `--session <id>` and `--open` from the report command options
- Update the EXAMPLES section to use `--change`

### 12. Export feedback JSON button in report HTML

Add a small muted button to the report HTML: "Export Feedback JSON". Visible in both serve mode and static mode. When clicked, it collects the current feedback state (same JSON structure as what gets POSTed) and triggers a browser download of the JSON file.

This is a secondary feature for users who prefer to manually transfer feedback. Styling: small, muted/gray, positioned below the primary feedback buttons (or in the footer area if in static mode).

### 13. Bad examples in SKILL.md

Replace:
```
recording-flow-e2e      → Record → playback → delete flow completes without errors
```
With:
```
onboarding-flow-e2e     → Onboarding screens display correctly and can be navigated to completion
```

Replace:
```
- "verify recording flow" → `--change "recording-flow-e2e"`
```
With:
```
- "verify the onboarding flow" → `--change "onboarding-flow-e2e"`
```

### 14. `interaction.md` cleanup

Remove any device management content from `interaction.md`. The iosef install/verify instructions stay in `interaction.md` (since iosef is an interaction tool). The device provisioning reference that was in `simulators.md` moves to `devices.md`.

## Risks / Trade-offs

**[Risk: Global lock dir permissions]** → `~/.proofrun/locks/` is in the user's home directory, same as `~/.claude/`. No permission issues expected. The directory is created with default umask on first use.

**[Risk: Stale lock detection false positives]** → PID recycling could theoretically cause a false "active" result. Mitigation: PIDs recycle slowly on modern systems, and we also check session state as a secondary signal. A PID match + stopped session = stale.

**[Risk: Removing `--session` flag]** → Users who relied on `--session` for debugging specific sessions lose that capability. Mitigation: They can use `--change` which now auto-detects. For debugging, they can read the session's evidence.json directly. This is a pre-launch tool with the "No Backward Compatibility" principle.

**[Risk: Lock file race condition]** → The current locking mechanism uses a write-then-read pattern which is not atomic. Moving to global locks doesn't make this worse, and the probability of two agents starting sessions for the same device in the exact same millisecond is very low. The existing PID-check pattern is sufficient for now.

**[Trade-off: `device status` requires walking global lock dir]** → For a small number of devices (< 20), reading all `.lock.held` files is fast. No performance concern.
