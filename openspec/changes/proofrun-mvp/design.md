## Context

AI agents (Claude Code, Codex, Cursor, etc.) can implement features end-to-end but have no standard way to verify their work against a running app. Existing E2E test tools (Maestro, Detox, Playwright) are designed for prescribed, scripted test flows — not for agentic, exploratory verification where the AI decides what to do next based on what it sees.

Proofrun fills this gap: a CLI + skill that gives agents a structured way to verify their work and produce evidence. It's not a test framework — it's a **verification workflow** with evidence capture and human feedback.

**Key inspiration**: Simon Willison's [Showboat](https://github.com/simonw/showboat) — which gives agents a way to prove CLI work by capturing commands + outputs in a verifiable document. Proofrun extends this concept to visual/interactive app verification.

**Key principle**: The proofrun CLI is a **dumb, deterministic tool**. It reads config, manages locks, captures evidence, generates reports. It does NOT understand acceptance criteria, classify what's verifiable, judge pass/fail, or make any decisions. That's the agent's job. The CLI is the agent's toolbelt, not its brain.

## Goals / Non-Goals

**Goals:**
- CLI tool installable via `npm i -g proofrun` or usable via `npx proofrun`
- Agent skill installable via `npx skills add rokabytedev/proofrun`
- Platform presets for zero-friction onboarding (Expo, RN CLI, Next.js, Flutter)
- Resource management for concurrent agents (simulator pool, port allocation)
- Interactive HTML reports with human annotation/feedback
- Pluggable context sources (OpenSpec, GitHub, markdown) via config
- `proofrun --help` as complete agent-readable documentation (Showboat pattern)

**Non-Goals:**
- Building a test framework (no assertions library, no test runner)
- Replacing E2E tools (Maestro, Detox, Playwright stay for regression)
- Building a simulator interaction tool (use iosef, Appium, etc.)
- Android/web support in MVP (architecture supports it, ship iOS first)
- CI/CD integration (local development only for MVP)
- Cloud/remote execution
- Any LLM/AI logic in the CLI itself — the CLI is purely deterministic

## Config Schema

The `proofrun.config.yaml` file is the central configuration. It is created once per project via `proofrun init --preset <name>` and committed to version control.

```yaml
# proofrun.config.yaml — complete schema with all fields

# ─── Platform ───────────────────────────────────────────────
# Target platform for verification. Determines which simulator/device
# tooling is expected and how the app is launched.
platform: ios                      # ios | android | web
                                   # MVP: only "ios" is supported

# ─── App Identity ──────────────────────────────────────────
# Used by session management to launch the correct app and verify
# the agent is testing the right build.
app:
  bundle_id: com.example.myapp     # iOS bundle identifier (from app.json or Xcode project)
  display_name: "My App"           # Human-readable name (used in reports)

# ─── Dev Server ────────────────────────────────────────────
# How to start and manage the development server.
# The agent starts this during `proofrun session start`.
# {{port}} is replaced with the acquired port number at runtime.
dev_server:
  start: "npx expo start --port {{port}}"
                                   # Command to start the dev server.
                                   # {{port}} placeholder is replaced with acquired port.
                                   # Examples:
                                   #   Expo: "npx expo start --port {{port}}"
                                   #   Next.js: "npx next dev --port {{port}}"
                                   #   Vite: "npx vite --port {{port}}"
  ready_signal: "Bundling complete"
                                   # Regex pattern matched against stdout.
                                   # Session start waits for this before declaring ready.
                                   # Examples:
                                   #   Expo/Metro: "Bundling complete"
                                   #   Next.js: "Ready in"
                                   #   Vite: "ready in"
  health_check: "curl -s http://localhost:{{port}}"
                                   # Optional. Command to verify server is responding.
                                   # Exit code 0 = healthy. {{port}} replaced at runtime.
  startup_timeout: 120             # Seconds to wait for ready_signal before failing.
                                   # Default: 120

# ─── Simulator / Device Pool ───────────────────────────────
# Manages a pool of simulators for concurrent agent use.
# Each slot is flock-locked during a session to prevent conflicts.
simulator:
  pool_size: 5                     # Number of simulator slots (lock files created: sim-0 to sim-4).
                                   # Default: 5
  device_types:                    # Named device types. Agent picks by name when starting session.
    default: "iPhone 16 Pro"       # Used when no specific type requested.
    narrow: "iPhone SE (3rd generation)"
                                   # For testing narrow screen layouts.
    wide: "iPhone 16 Pro Max"      # For testing wide screen layouts.
    tablet: "iPad Pro 13-inch (M4)"
                                   # For testing tablet layouts.
                                   # Agent specifies: proofrun session start --device narrow

# ─── Port Pool ─────────────────────────────────────────────
# Port range for dev server instances. Each session acquires one port.
# Ports are flock-locked to prevent conflicts between concurrent agents.
port_range:
  start: 8090                      # First port in the range. Default: 8090
  end: 8099                        # Last port in the range. Default: 8099
                                   # Total available = end - start + 1 (10 ports)

# ─── Interaction Tool ──────────────────────────────────────
# Which simulator interaction tool the agent uses.
# Proofrun does NOT call this tool — the agent does, guided by
# the interaction tool's own skill (e.g., ios-simulator-interaction).
# This config helps `proofrun doctor` verify the tool is available
# and helps `proofrun context` include relevant instructions.
interaction:
  tool: iosef                      # Tool name. Used by `proofrun doctor` to check availability.
                                   # Values: iosef | appium | playwright | custom
  tool_check: "iosef --help"       # Command to verify tool is installed. Exit 0 = available.
  tool_install_hint: "npx skills add riwsky/iosef@ios-simulator-interaction -g"
                                   # Shown by `proofrun doctor` if tool_check fails.
  element_strategy: identifier     # How elements are targeted in this app.
                                   # identifier = by accessibilityIdentifier / testID
                                   # name = by accessibility label
                                   # coordinates = by x,y position
                                   # Informational — included in `proofrun context` output
                                   # so the agent knows the preferred approach.
  testid_attribute: testID         # The source-code attribute name that maps to accessibility ID.
                                   # React Native: testID
                                   # Flutter: Key
                                   # SwiftUI: accessibilityIdentifier
                                   # Informational — included in `proofrun context` output.

# ─── Change Context Source ─────────────────────────────────
# Where to find acceptance criteria and change artifacts.
# `proofrun context <change>` reads this config and returns
# INSTRUCTIONS for the agent on how to gather context — it does
# NOT read the artifacts itself.
change_context:
  source: openspec                 # openspec | github | markdown | manual
                                   #
                                   # openspec: Change artifacts at openspec/changes/<name>/
                                   #   CLI outputs: artifact paths, openspec CLI commands
                                   #
                                   # github: Change described in a GitHub issue or PR
                                   #   CLI outputs: gh CLI commands to fetch issue/PR body
                                   #
                                   # markdown: Change described in a markdown file
                                   #   CLI outputs: file path to read
                                   #
                                   # manual: No structured source
                                   #   CLI outputs: generic instructions for the agent
                                   #   to gather context from git history / conversation

  # Source-specific config (only the relevant source's fields are used):
  openspec:
    change_dir: "openspec/changes/{{change}}"
                                   # Path template. {{change}} replaced with change name.
    artifacts:                     # Which artifacts to read for change context.
      - proposal.md
      - design.md
      - "specs/**/*.md"
      - tasks.md

  github:
    issue_command: "gh issue view {{change}} --json title,body,labels"
                                   # {{change}} = issue number or identifier
    pr_command: "gh pr view {{change}} --json title,body,files"

  markdown:
    path: "docs/changes/{{change}}.md"
                                   # {{change}} replaced with change name

# ─── App Knowledge Source ──────────────────────────────────
# Where to find general app knowledge (navigation, screens, states,
# features) — separate from change-specific context.
# The agent reads this to understand HOW THE APP WORKS before verifying.
# `proofrun context` includes these instructions in its output.
app_knowledge:
  source: openspec-specs           # openspec-specs | docs | readme | none
                                   #
                                   # openspec-specs: Capability specs at openspec/specs/
                                   #   CLI outputs: discovery command + path + tips
                                   #
                                   # docs: Documentation directory
                                   #   CLI outputs: paths to scan
                                   #
                                   # readme: Just the README
                                   #   CLI outputs: README path
                                   #
                                   # none: No structured knowledge source
                                   #   CLI outputs: generic guidance to explore codebase

  # Source-specific config:
  openspec_specs:
    discovery_command: "openspec list --specs"
                                   # Command the agent runs to see available specs.
    spec_path: "openspec/specs/"   # Where spec files live.
    tips: >-
      Spec names are descriptive (e.g. practice-session-ui, library-browser,
      quick-settings-bar). Read the 2-3 most relevant to your acceptance criteria
      for navigation and behavior context. If a spec doesn't help, try another.

  docs:
    paths:                         # Directories/files to scan for app knowledge.
      - "docs/"
      - "README.md"

# ─── Boundaries ────────────────────────────────────────────
# Path to the verification boundaries file. Defines what the agent
# can and cannot verify. If the file doesn't exist, the agent uses
# the default boundaries-template.md bundled with the proofrun skill.
boundaries:
  path: ".proofrun/boundaries.md"  # Project-specific boundaries file.
                                   # Default: uses skill's references/boundaries-template.md

# ─── Reports ───────────────────────────────────────────────
# Configuration for HTML report generation.
reports:
  output_dir: ".proofrun/reports"  # Where reports are saved. Default: .proofrun/reports
  embed_screenshots: true          # true = base64 encode images inline (self-contained)
                                   # false = reference external files (smaller HTML, needs files)
  open_after_generate: false       # Auto-open in browser after `proofrun report`. Default: false

# ─── Session Defaults ──────────────────────────────────────
session:
  lock_dir: ".proofrun/locks"      # Where flock lock files are stored. Default: .proofrun/locks
  evidence_dir: ".proofrun/sessions"
                                   # Where session evidence is stored. Default: .proofrun/sessions
  max_retries_per_ac: 2            # Max fix-and-retry cycles per AC before marking as failed.
                                   # Default: 2. Informational — included in context output
                                   # so the skill can reference it.
```

## CLI Output Protocol

Every proofrun command outputs structured JSON to stdout. The CLI is built for agent consumption — no human-readable text, no color codes, no progress spinners. The only exception is `--help`, which outputs plain text (since agents read help as documentation).

**Envelope format:** Every response follows a common envelope:

```json
{
  "ok": true,                    // boolean — did the command succeed?
  "command": "session.start",    // string — which command was run
  "data": { ... },               // object — command-specific response payload
  "error": null                  // string | null — error message if ok=false
}
```

**Error responses:** When `ok` is false, `data` is null and `error` contains a human/agent-readable message:

```json
{
  "ok": false,
  "command": "session.start",
  "data": null,
  "error": "All simulator slots are locked. Waited 300s. Consider increasing simulator.pool_size in proofrun.config.yaml."
}
```

**Exit codes:**
- `0` — success (`ok: true`)
- `1` — runtime error or failure (`ok: false`)
- `2` — bad arguments / usage error (`ok: false`, `error` explains the issue)

### Command: `proofrun init --preset <name>`

Creates `proofrun.config.yaml` from a preset template with auto-detected project values.

```json
{
  "ok": true,
  "command": "init",
  "data": {
    "preset": "expo",
    "config_path": "proofrun.config.yaml",
    "auto_detected": {
      "app.bundle_id": {
        "value": "com.rokabyte.accent",
        "source": "app.json → expo.ios.bundleIdentifier"
      },
      "app.display_name": {
        "value": "Waader!",
        "source": "app.json → expo.name"
      },
      "change_context.source": {
        "value": "openspec",
        "source": "openspec/ directory detected"
      }
    },
    "placeholders": [
      {
        "field": "simulator.device_types.tablet",
        "reason": "No tablet device type configured. Add manually if needed."
      }
    ],
    "gitignore_updated": true
  },
  "error": null
}
```

### Command: `proofrun doctor`

Checks environment readiness. Returns all checks with pass/fail status.

```json
{
  "ok": true,
  "command": "doctor",
  "data": {
    "all_passed": false,
    "checks": [
      {
        "name": "config",
        "status": "pass",
        "detail": "proofrun.config.yaml found and valid"
      },
      {
        "name": "interaction_tool",
        "status": "pass",
        "detail": "iosef v0.2.5 available",
        "check_command": "iosef --help"
      },
      {
        "name": "locking",
        "status": "pass",
        "detail": "Using flock (kernel-level locks)",
        "mechanism": "flock"
      },
      {
        "name": "dev_server",
        "status": "pass",
        "detail": "npx expo found in PATH"
      },
      {
        "name": "simulator",
        "status": "warn",
        "detail": "2 of 5 simulator slots available",
        "available_slots": 2,
        "total_slots": 5
      },
      {
        "name": "flock",
        "status": "fail",
        "detail": "flock not found. Install: brew install flock. Falling back to proper-lockfile.",
        "install_hint": "brew install flock"
      }
    ]
  },
  "error": null
}
```

Note: `ok` is true even if some checks are `warn` or `fail` — the doctor command itself succeeded. The agent reads `data.all_passed` and individual check statuses to decide how to proceed.

### Command: `proofrun session start --change <name> [--device <type>]`

Acquires simulator + port, starts dev server, creates session.

```json
{
  "ok": true,
  "command": "session.start",
  "data": {
    "session_id": "20260314-063200-a1b2c3",
    "change_name": "add-search",
    "simulator": {
      "slot": 2,
      "device_name": "iPhone 16 Pro",
      "device_type": "default",
      "udid": "C9A19AFA-25F8-47C7-A297-24D8B9C271D0",
      "lock_file": ".proofrun/locks/sim-2.lock"
    },
    "port": {
      "number": 8091,
      "lock_file": ".proofrun/locks/port-8091.lock"
    },
    "dev_server": {
      "pid": 74892,
      "command": "npx expo start --port 8091",
      "log_file": ".proofrun/sessions/20260314-063200-a1b2c3/server.log",
      "status": "ready"
    },
    "session_dir": ".proofrun/sessions/20260314-063200-a1b2c3",
    "state_file": ".proofrun/sessions/20260314-063200-a1b2c3/state.json"
  },
  "error": null
}
```

### Command: `proofrun session stop`

Releases all resources, stops dev server.

```json
{
  "ok": true,
  "command": "session.stop",
  "data": {
    "session_id": "20260314-063200-a1b2c3",
    "released": {
      "simulator_slot": 2,
      "port": 8091,
      "dev_server_pid": 74892
    },
    "session_dir": ".proofrun/sessions/20260314-063200-a1b2c3",
    "evidence_entries": 12,
    "duration_seconds": 342
  },
  "error": null
}
```

### Command: `proofrun session status`

Shows current session state or pool availability.

**When a session is active:**
```json
{
  "ok": true,
  "command": "session.status",
  "data": {
    "active": true,
    "session_id": "20260314-063200-a1b2c3",
    "change_name": "add-search",
    "simulator": {
      "slot": 2,
      "device_name": "iPhone 16 Pro",
      "udid": "C9A19AFA-25F8-47C7-A297-24D8B9C271D0"
    },
    "port": 8091,
    "dev_server": {
      "pid": 74892,
      "status": "running"
    },
    "started_at": "2026-03-14T06:32:00Z",
    "evidence_entries": 8,
    "pool": {
      "simulators": { "available": 3, "total": 5, "locked_slots": [1, 2] },
      "ports": { "available": 9, "total": 10, "locked_ports": [8091] }
    }
  },
  "error": null
}
```

**When no session is active:**
```json
{
  "ok": true,
  "command": "session.status",
  "data": {
    "active": false,
    "session_id": null,
    "pool": {
      "simulators": { "available": 5, "total": 5, "locked_slots": [] },
      "ports": { "available": 10, "total": 10, "locked_ports": [] }
    }
  },
  "error": null
}
```

### Command: `proofrun context <change-name>`

Reads config and outputs instructions for the agent on how to gather change context and app knowledge.

```json
{
  "ok": true,
  "command": "context",
  "data": {
    "change_context": {
      "source": "openspec",
      "change_name": "add-search",
      "instructions": "Read all change artifacts to understand what was implemented and what to verify.",
      "commands": [
        "openspec show add-search --json"
      ],
      "artifact_paths": [
        "openspec/changes/add-search/proposal.md",
        "openspec/changes/add-search/design.md",
        "openspec/changes/add-search/specs/**/*.md",
        "openspec/changes/add-search/tasks.md"
      ]
    },
    "app_knowledge": {
      "source": "openspec-specs",
      "instructions": "Scan capability specs to understand app navigation and behavior before verifying. Spec names are descriptive (e.g. practice-session-ui, library-browser). Read the 2-3 most relevant to your acceptance criteria. If a spec doesn't help, try another.",
      "discovery_command": "openspec list --specs",
      "spec_path": "openspec/specs/"
    },
    "interaction": {
      "tool": "iosef",
      "element_strategy": "identifier",
      "testid_attribute": "testID"
    },
    "boundaries": {
      "path": ".proofrun/boundaries.md",
      "fallback": "Use the default boundaries-template.md from the proofrun skill if the file at path does not exist."
    },
    "session": {
      "max_retries_per_ac": 2
    }
  },
  "error": null
}
```

**With `manual` source (no structured spec):**
```json
{
  "ok": true,
  "command": "context",
  "data": {
    "change_context": {
      "source": "manual",
      "change_name": "add-search",
      "instructions": "No structured spec source configured. To understand what to verify: check recent git commits (git log --oneline -20), read changed files (git diff main --name-only), and ask the user for acceptance criteria if unclear.",
      "commands": [],
      "artifact_paths": []
    },
    "app_knowledge": {
      "source": "none",
      "instructions": "No structured app knowledge source. Read README.md and any docs/ directory. Use the simulator interaction tool to explore the app's navigation and discover screens.",
      "discovery_command": null,
      "spec_path": null
    },
    "interaction": {
      "tool": "iosef",
      "element_strategy": "identifier",
      "testid_attribute": "testID"
    },
    "boundaries": {
      "path": ".proofrun/boundaries.md",
      "fallback": "Use the default boundaries-template.md from the proofrun skill if the file at path does not exist."
    },
    "session": {
      "max_retries_per_ac": 2
    }
  },
  "error": null
}
```

### Command: `proofrun step <description> [--ac <n>]`

Records a verification step in the evidence log.

```json
{
  "ok": true,
  "command": "step",
  "data": {
    "entry_id": 1,
    "type": "step",
    "ac": 1,
    "description": "Navigate to Library tab",
    "timestamp": "2026-03-14T06:35:12Z",
    "evidence_file": ".proofrun/sessions/20260314-063200-a1b2c3/evidence.json",
    "total_entries": 1
  },
  "error": null
}
```

### Command: `proofrun screenshot <file> [--ac <n>] [--note <text>]`

Copies screenshot to session, records in evidence log.

```json
{
  "ok": true,
  "command": "screenshot",
  "data": {
    "entry_id": 2,
    "type": "screenshot",
    "ac": 1,
    "source_path": "/tmp/screenshot.jpeg",
    "stored_path": ".proofrun/sessions/20260314-063200-a1b2c3/screenshots/002-ac1.jpeg",
    "note": "Library screen with search bar visible",
    "file_size_bytes": 35420,
    "timestamp": "2026-03-14T06:35:15Z",
    "total_entries": 2
  },
  "error": null
}
```

### Command: `proofrun judge --ac <n> --pass|--fail|--human <reasoning>`

Records the agent's judgment for an acceptance criterion.

```json
{
  "ok": true,
  "command": "judge",
  "data": {
    "entry_id": 3,
    "type": "judgment",
    "ac": 1,
    "status": "pass",
    "reasoning": "Search bar found at (398, 98) via iosef find --identifier library-search-input. Screenshot confirms icon visible in top-right corner.",
    "replaced_previous": false,
    "timestamp": "2026-03-14T06:35:18Z",
    "total_entries": 3
  },
  "error": null
}
```

**When replacing a previous judgment (fix-and-retry):**
```json
{
  "ok": true,
  "command": "judge",
  "data": {
    "entry_id": 7,
    "type": "judgment",
    "ac": 3,
    "status": "pass",
    "reasoning": "Fixed missing testID. Clear button now found and tapping resets search results.",
    "replaced_previous": true,
    "previous_status": "fail",
    "previous_reasoning": "Clear button not found — missing testID on SearchBar clear icon.",
    "timestamp": "2026-03-14T06:38:42Z",
    "total_entries": 7
  },
  "error": null
}
```

### Command: `proofrun note <text>`

Adds a freeform note to the evidence log.

```json
{
  "ok": true,
  "command": "note",
  "data": {
    "entry_id": 4,
    "type": "note",
    "text": "App is currently in Chinese locale. Using --identifier selectors throughout since labels are localized.",
    "timestamp": "2026-03-14T06:35:20Z",
    "total_entries": 4
  },
  "error": null
}
```

### Command: `proofrun report [--output <path>] [--open]`

Generates the interactive HTML report from session evidence.

```json
{
  "ok": true,
  "command": "report",
  "data": {
    "report_path": ".proofrun/reports/2026-03-14-add-search.html",
    "session_id": "20260314-063200-a1b2c3",
    "change_name": "add-search",
    "summary": {
      "total_acs": 5,
      "pass": 3,
      "fail": 1,
      "human_required": 1,
      "total_steps": 12,
      "total_screenshots": 8
    },
    "acs": [
      { "ac": 1, "status": "pass", "screenshots": 2 },
      { "ac": 2, "status": "pass", "screenshots": 2 },
      { "ac": 3, "status": "pass", "screenshots": 1 },
      { "ac": 4, "status": "fail", "screenshots": 2 },
      { "ac": 5, "status": "human_required", "screenshots": 0 }
    ],
    "report_size_bytes": 2458320,
    "opened_in_browser": true
  },
  "error": null
}
```

### Evidence File Schema: `evidence.json`

The evidence file is the intermediate data store between evidence capture commands and report generation. Stored at `.proofrun/sessions/<id>/evidence.json`.

```json
{
  "session_id": "20260314-063200-a1b2c3",
  "change_name": "add-search",
  "started_at": "2026-03-14T06:32:00Z",
  "simulator": {
    "device_name": "iPhone 16 Pro",
    "udid": "C9A19AFA-25F8-47C7-A297-24D8B9C271D0"
  },
  "port": 8091,
  "entries": [
    {
      "id": 1,
      "type": "step",
      "ac": 1,
      "description": "Navigate to Library tab",
      "timestamp": "2026-03-14T06:35:12Z"
    },
    {
      "id": 2,
      "type": "screenshot",
      "ac": 1,
      "stored_path": "screenshots/002-ac1.jpeg",
      "note": "Library screen with search bar visible",
      "timestamp": "2026-03-14T06:35:15Z"
    },
    {
      "id": 3,
      "type": "judgment",
      "ac": 1,
      "status": "pass",
      "reasoning": "Search bar found at (398, 98) via iosef find --identifier library-search-input.",
      "timestamp": "2026-03-14T06:35:18Z"
    },
    {
      "id": 4,
      "type": "note",
      "text": "App is in Chinese locale.",
      "timestamp": "2026-03-14T06:35:20Z"
    }
  ]
}
```

### Session State File Schema: `state.json`

Stored at `.proofrun/sessions/<id>/state.json`. Records session metadata and resource state.

```json
{
  "session_id": "20260314-063200-a1b2c3",
  "status": "active",
  "change_name": "add-search",
  "started_at": "2026-03-14T06:32:00Z",
  "stopped_at": null,
  "simulator": {
    "slot": 2,
    "device_name": "iPhone 16 Pro",
    "device_type": "default",
    "udid": "C9A19AFA-25F8-47C7-A297-24D8B9C271D0",
    "lock_file": ".proofrun/locks/sim-2.lock"
  },
  "port": {
    "number": 8091,
    "lock_file": ".proofrun/locks/port-8091.lock"
  },
  "dev_server": {
    "pid": 74892,
    "command": "npx expo start --port 8091",
    "log_file": "server.log"
  }
}
```

### Report Feedback Schema: `feedback.json`

Exported from the interactive HTML report by the human reviewer. The agent reads this to address rejections.

```json
{
  "session_id": "20260314-063200-a1b2c3",
  "change_name": "add-search",
  "reviewed_at": "2026-03-14T07:15:00Z",
  "reviewer": "human",
  "acs": [
    {
      "ac": 1,
      "original_status": "pass",
      "review_status": "accepted",
      "comment": null,
      "annotations": []
    },
    {
      "ac": 4,
      "original_status": "fail",
      "review_status": "rejected",
      "comment": "The button position is off — it should be right-aligned, not centered.",
      "annotations": [
        {
          "type": "circle",
          "screenshot_id": "006-ac4.jpeg",
          "x": 220,
          "y": 450,
          "radius": 40,
          "color": "#ff0000",
          "label": "Should be right-aligned"
        }
      ]
    },
    {
      "ac": 5,
      "original_status": "human_required",
      "review_status": "accepted",
      "comment": "Audio plays correctly. Verified manually."
    }
  ],
  "summary": {
    "accepted": 4,
    "rejected": 1,
    "pending": 0
  }
}
```

## Decisions

### D1: Node.js CLI with `bin` field for npx support

**Choice:** Implement the CLI in Node.js with a `#!/usr/bin/env node` entry point.

**Why:** The target audience (React Native, Expo, Next.js developers) already has Node.js. npm/npx distribution is the lowest friction install path. The skill ecosystem (`npx skills add`) is also npm-based.

**Alternatives considered:**
- Go binary (like Showboat): Faster, but requires separate distribution, can't leverage npm ecosystem
- Python: Less common in the RN/Expo ecosystem
- Shell scripts: Not portable enough, hard to maintain

### D2: Two-level initialization — project init vs. session start

**Choice:** Separate `proofrun init` (once per project, creates config) from `proofrun session start` (once per verification run, acquires resources).

```
proofrun init --preset expo          # Project-level, creates proofrun.config.yaml
proofrun session start --change X    # Run-level, acquires simulator + port
```

**Why:** Project config rarely changes. Session resources are ephemeral. Mixing them creates confusion about what's persistent vs. transient.

The agent drives both: it scans the project to determine the right preset, runs `proofrun init --preset expo`, then reviews the generated config and suggests the user review if anything looks project-specific (like bundle ID).

### D3: Preset-driven config generation

**Choice:** `proofrun init --preset <name>` fills in 90%+ of config from a preset template. The agent scans the project to determine which preset to use and fills in project-specific values (bundle ID, etc.).

**Available presets (MVP):**
- `expo` — Expo managed workflow (Metro, testID, iosef)
- `react-native-cli` — React Native CLI (Metro, testID, iosef)

**Future presets:**
- `nextjs` — Next.js web app (Vite/webpack, Playwright)
- `flutter` — Flutter (flutter run, Flutter Driver/integration_test)

**Preset auto-detection by the agent:**
The agent scans the project structure before calling `proofrun init`:
- Found `app.json` with `expo` key → `--preset expo`
- Found `react-native.config.js` → `--preset react-native-cli`
- Found `next.config.js` → `--preset nextjs`
- Found `pubspec.yaml` with `flutter` → `--preset flutter`

**Auto-detection of project-specific values:**
After applying the preset, `proofrun init` auto-detects from project files:
- `app.bundle_id`: from `app.json` → `expo.ios.bundleIdentifier` (Expo), or `ios/Podfile` (RN CLI)
- `app.display_name`: from `app.json` → `expo.name`
- `change_context.source`: detects `openspec/` directory → sets to `openspec`

Values that can't be auto-detected are left as placeholder comments with instructions.

### D4: flock-based resource locking

**Choice:** Use kernel-level `flock` for simulator and port locks. Lock files live in `.proofrun/locks/` within the project directory.

**Why flock over file-based PID locks:**
- Kernel auto-releases when process dies — no stale lock problem, no cleanup logic needed
- Atomic — no race conditions between concurrent processes
- Timeout support via `flock --timeout`

**macOS availability:** `flock` is not built into macOS. Options:
1. `brew install flock` — recommended, documented in `proofrun doctor`
2. Node.js fallback using `proper-lockfile` npm package — used automatically if flock not found

**Lock file structure:**
```
.proofrun/
├── locks/
│   ├── sim-0.lock        # flock'd by owning process during session
│   ├── sim-1.lock        # empty files — the lock is the flock, not the content
│   ├── sim-2.lock
│   ├── sim-3.lock
│   └── sim-4.lock
│   ├── port-8090.lock
│   ├── port-8091.lock
│   └── ...
├── sessions/
│   └── <session-id>/
│       ├── state.json     # Session metadata (change, device, port, timestamps)
│       ├── evidence.json  # All recorded steps/screenshots/judgments
│       ├── server.log     # Dev server stdout/stderr
│       └── screenshots/   # Copied screenshot files
└── reports/
    └── <date>-<change>.html
```

**Lock acquisition flow:**
1. Iterate simulator slots 0 to pool_size-1
2. Try exclusive flock on `.proofrun/locks/sim-<n>.lock`
3. If acquired → record slot number in session state
4. If all locked → poll every 10s until one becomes available (or timeout)
5. Same pattern for port acquisition (also verify port not in use via `lsof`)

**Proactive release:** `proofrun session stop` closes all flock file descriptors (releasing locks), kills the dev server process, and updates session state. The skill instructs the agent to always call `session stop` on completion. If the agent process crashes, the kernel auto-releases all flocks.

**Lock directory initialization:** `proofrun session start` creates `.proofrun/locks/` and empty lock files if they don't exist. No separate initialization step needed.

### D5: `proofrun context` — config-to-instructions translator

**Choice:** `proofrun context <change>` reads the config and outputs structured JSON instructions telling the agent HOW to gather change context and app knowledge. It does NOT read the change artifacts itself.

**Why the CLI doesn't read artifacts:** The CLI is dumb. Reading and understanding acceptance criteria requires LLM intelligence. The CLI's job is to translate config into actionable instructions for the agent.

**Output format:**
```json
{
  "change_context": {
    "source": "openspec",
    "change_name": "add-search",
    "instructions": "Read all change artifacts to understand what was implemented and what to verify.",
    "commands": [
      "openspec show add-search --json"
    ],
    "artifact_paths": [
      "openspec/changes/add-search/proposal.md",
      "openspec/changes/add-search/design.md",
      "openspec/changes/add-search/specs/**/*.md",
      "openspec/changes/add-search/tasks.md"
    ]
  },
  "app_knowledge": {
    "source": "openspec-specs",
    "instructions": "Scan capability specs to understand app navigation and behavior before verifying. Spec names are descriptive. Read the 2-3 most relevant to your acceptance criteria. If a spec doesn't help, try another.",
    "discovery_command": "openspec list --specs",
    "spec_path": "openspec/specs/"
  },
  "interaction": {
    "tool": "iosef",
    "element_strategy": "identifier",
    "testid_attribute": "testID"
  },
  "boundaries": {
    "path": ".proofrun/boundaries.md",
    "fallback": "Use the default boundaries-template.md from the proofrun skill if this file doesn't exist."
  },
  "session": {
    "max_retries_per_ac": 2
  }
}
```

**When source is `manual` (no structured spec system):**
```json
{
  "change_context": {
    "source": "manual",
    "instructions": "No structured spec source configured. To understand what to verify: check recent git commits (git log --oneline -20), read changed files (git diff main --name-only), and ask the user for acceptance criteria if unclear."
  },
  "app_knowledge": {
    "source": "none",
    "instructions": "No structured app knowledge source. Read README.md and any docs/ directory. Use the simulator interaction tool to explore the app's navigation and discover screens."
  }
}
```

### D6: Explore-then-document evidence model

**Choice:** The agent explores freely with the simulator tool (iosef), then records the clean verification path using proofrun commands.

**Why:** Agent exploration is messy — wrong taps, dead ends, backtracking. The report should capture the **clean path** (proof), not the exploration journey. The agent calls `proofrun step/screenshot/judge` only after confirming an AC passes.

**Workflow per AC:**
```
1. Agent reads AC + relevant app specs (via proofrun context instructions)
2. Agent uses iosef to explore the app (not recorded by proofrun)
3. Agent identifies the verification path and confirms pass/fail
4. Agent records the clean evidence:
   proofrun step "Navigate to Library tab" --ac 1
   proofrun screenshot <path> --ac 1
   proofrun judge --ac 1 --pass "Search bar found at (398,98) via iosef find"
5. If AC fails, agent attempts to fix the code (max retries from config)
6. Evidence is built incrementally — one AC (or one verification point) at a time
```

### D7: Interactive HTML report with feedback loop

**Choice:** Generate a self-contained HTML file with embedded base64 screenshots, per-AC controls, and annotation capability.

**Report structure:**

```
┌─────────────────────────────────────────────────────────┐
│ Proofrun Verification Report                             │
│ Change: add-search | 2026-03-14 | iPhone 16 Pro         │
├─────────────────────────────────────────────────────────┤
│ Summary: ✅ 3 verified  ❌ 1 failed  🧑 1 human        │
├─────────────────────────────────────────────────────────┤
│ AC 1: Search bar visible on Library screen    ✅         │
│ ┌──────────────────────────────┐                         │
│ │ [Screenshot — click to zoom] │  Agent: "Found element  │
│ │                              │  at (398,98) via iosef  │
│ │                              │  find --identifier..."  │
│ └──────────────────────────────┘                         │
│ Steps:                                                   │
│   1. Navigate to Library tab                             │
│   2. Check search icon visible                           │
│                                                          │
│ [✅ Accept] [❌ Reject] [💬 Comment ___________]        │
├─────────────────────────────────────────────────────────┤
│ AC 2: ...                                                │
└─────────────────────────────────────────────────────────┘
```

**Interactive features (MVP):**
- Accept/reject buttons per AC with visual state
- Comment textarea per AC
- Screenshot click-to-zoom
- "Export Feedback" button → JSON download
- localStorage persistence (re-opening restores feedback state)

**Interactive features (post-MVP):**
- Canvas annotation on screenshots (circles, arrows, freehand, text)
- Feedback JSON saved as sidecar file alongside HTML

**Feedback loop:**
```
Agent generates report → Human opens in browser → Human reviews each AC:
  ✅ Accept → confirmed
  ❌ Reject → adds comment/annotation explaining what's wrong
  💬 Comment → adds note
→ Human exports feedback as JSON
→ Agent reads feedback JSON → addresses rejections → re-verifies → new report
```

**Technical implementation:**
- Single HTML file, all JS/CSS inline, no external dependencies
- Screenshots base64-encoded as `<img src="data:image/jpeg;base64,...">` (self-contained)
- Vanilla JS — no React, no build step, no framework
- Report template at `templates/report.html` in the proofrun package
- `proofrun report` reads `evidence.json`, injects data into template, writes HTML

### D8: Skill + --help division of responsibility

**Choice:** The skill teaches workflow and judgment. `--help` teaches CLI mechanics.

```
┌─────────────────────────────────────────────────────────┐
│  SKILL.md (installed via npx skills add)                 │
│  ─────────────────────────────────────                   │
│  Purpose: Teach the agent WHEN and WHY                   │
│                                                          │
│  • When to trigger proofrun                              │
│  • How to initialize (scan project, pick preset)         │
│  • How to use `proofrun context` to gather ACs           │
│  • How to discover app knowledge (read specs/docs)       │
│  • How to classify ACs using boundaries                  │
│  • The explore-then-document pattern                     │
│  • How to handle human feedback from report              │
│  • Prerequisite checking (install iosef if missing)       │
│  • "Run `npx proofrun --help` for command reference"     │
├─────────────────────────────────────────────────────────┤
│  proofrun --help (available via CLI)                     │
│  ───────────────────────────────────                     │
│  Purpose: Teach the agent WHAT and HOW                   │
│                                                          │
│  • All subcommands with exact syntax                     │
│  • Argument types and defaults                           │
│  • Exit codes                                            │
│  • Concrete examples                                     │
│  • Pure reference — no workflow, no judgment calls        │
└─────────────────────────────────────────────────────────┘
```

**Why two layers:** The skill is loaded into context when the agent needs verification workflow guidance. The `--help` is consulted on-demand for specific command syntax. This avoids bloating either one — the skill stays focused on workflow, the help stays focused on commands.

### D9: Repo structure — npm package + skills.sh compatible

**Choice:** Single repo that publishes as both an npm CLI package and a skills.sh skill.

```
proofrun/
├── package.json              # npm package config
│                             #   name: "proofrun"
│                             #   bin: { "proofrun": "./bin/proofrun.js" }
│                             #   files: ["bin/", "src/", "skills/", "presets/", "templates/"]
├── bin/
│   └── proofrun.js           # #!/usr/bin/env node — CLI entry point
├── src/
│   ├── cli.js                # Command routing (commander/yargs)
│   ├── commands/
│   │   ├── init.js           # proofrun init --preset <name>
│   │   ├── doctor.js         # proofrun doctor
│   │   ├── session.js        # proofrun session start|stop|status
│   │   ├── context.js        # proofrun context <change>
│   │   ├── evidence.js       # proofrun step|screenshot|judge|note
│   │   └── report.js         # proofrun report
│   ├── config.js             # Config loading + validation
│   ├── locking.js            # flock wrapper + proper-lockfile fallback
│   └── presets/
│       ├── expo.yaml         # Expo preset template
│       └── react-native-cli.yaml
├── skills/                   # ← skills.sh auto-discovers this directory
│   └── proofrun/
│       ├── SKILL.md          # Agent workflow skill
│       └── references/
│           └── boundaries-template.md  # Default verification boundaries
├── templates/
│   └── report.html           # Interactive HTML report template
├── examples/
│   ├── proofrun.config.yaml  # Example config (annotated)
│   └── sample-report.html    # Example output report
├── README.md
├── LICENSE                   # MIT
├── .gitignore
└── openspec/                 # OpenSpec for developing proofrun itself
```

**Install paths:**
```bash
# Primary: Install skill → agent learns workflow, uses npx for CLI
npx skills add rokabytedev/proofrun -g

# Alternative: Install CLI globally (if npx latency is unacceptable)
npm i -g proofrun
```

The skill instructs the agent to use `npx proofrun <command>` — npx handles on-demand CLI installation. No explicit `npm i -g` needed unless the user wants faster invocation.

## Risks / Trade-offs

### [flock availability on macOS] → Mitigation: ship Node.js fallback

`flock` is not built into macOS — requires `brew install flock`. **Mitigation:** The locking module checks for flock at runtime. If not available, it uses `proper-lockfile` npm package as a fallback (cross-platform, handles stale locks via PID checking). `proofrun doctor` reports which locking mechanism is in use and recommends flock for best reliability.

### [iosef as the only interaction tool] → Mitigation: tool is configurable

Proofrun doesn't bundle or depend on iosef — it's configured in `interaction.tool`. If iosef has issues, users can configure a different tool. The skill instructs the agent to check for the tool and install if missing. `proofrun doctor` verifies tool availability using `interaction.tool_check`.

### [HTML report complexity] → Mitigation: MVP is simple, iterate

Interactive annotations, canvas drawing, feedback export — this is significant frontend work. **Mitigation:** MVP report has: summary table, per-AC sections with screenshots, accept/reject buttons, comment fields, JSON export. Canvas annotation is post-MVP. The report template is a single HTML file with vanilla JS — no build step, no framework.

### [Config schema evolution] → Mitigation: version the schema

As proofrun evolves, the config schema will gain fields. **Mitigation:** Include a `schema_version` field (implicit v1 for MVP). `proofrun doctor` warns on outdated config patterns. New fields always have defaults so old configs continue to work.

### [Concurrent session conflicts] → Mitigation: flock + port verification

Even with flock, two agents could theoretically conflict if one acquires a port lock but the port is already in use by a non-proofrun process. **Mitigation:** After acquiring a port lock, verify the port is actually free via `lsof -i :<port>`. If occupied, release the lock and try the next port.

## Open Questions

1. **GitHub org**: `rokabytedev/proofrun` (decided)
2. **Minimum viable presets** — Ship Expo only for MVP? Or include React Native CLI (minor differences)?
3. **Report feedback format** — JSON download button (MVP) vs. auto-save sidecar file vs. both?
4. **Showboat interop** — Should proofrun optionally output Showboat-compatible markdown alongside HTML? Or is this unnecessary complexity?
5. **Config validation** — How strict? Fail on unknown fields (catches typos) or ignore them (forward-compatible)?
