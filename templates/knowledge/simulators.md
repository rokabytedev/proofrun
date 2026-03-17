---
name: Simulators & Emulators
description: How to manage simulators, emulators, and devices for verification.
  Read when setting up the verification environment.
---

<!-- Agent: Fill in the sections below for platforms this project targets.
     Remove sections for platforms that don't apply. -->

## iOS Simulator

Recommended interaction tool: **iosef** (agent-first iOS simulator interaction)

Install:
```
npx skills add riwsky/iosef@ios-simulator-interaction -g
```

Verify: `iosef --help`

Use context7 or the iosef skill instructions for detailed usage.

### Stable (persists across sessions)
<!-- Agent: Device identifiers, OS versions, device names.
     These don't change between verification runs. -->

### Observed (re-verify each session — may be stale)
<!-- Agent: DO NOT store transient state here (current screen, app state).
     Instead, verify these each session and record as prerequisites. -->

## Android Emulator

Recommended interaction tool: **TBD** (no agent-first tool tested yet)

### Stable (persists across sessions)
<!-- Agent: Device identifiers, OS versions, AVD names.
     These don't change between verification runs. -->

### Observed (re-verify each session — may be stale)
<!-- Agent: DO NOT store transient state here (current screen, app state).
     Instead, verify these each session and record as prerequisites. -->

## Mobile Web

Recommended interaction tool: **TBD** (browser automation)

### Stable (persists across sessions)
<!-- Agent: Browser type, viewport dimensions, connection method.
     These don't change between verification runs. -->

### Observed (re-verify each session — may be stale)
<!-- Agent: DO NOT store transient state here (current page, app state).
     Instead, verify these each session and record as prerequisites. -->
