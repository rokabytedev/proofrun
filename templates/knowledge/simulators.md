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

<!-- Agent: Fill in the following once you discover them:
     - Available simulators (run device listing command)
     - Device identifiers (UDIDs)
     - Which device(s) to use for verification
     - How to boot a simulator
     - How to connect iosef to the simulator
     - Any project-specific simulator notes -->

## Android Emulator

Recommended interaction tool: **TBD** (no agent-first tool tested yet)

<!-- Agent: Use context7 or web search to find a suitable agent-first
     interaction tool for Android emulators. If none exists, fall back
     to standard ADB commands.

     Fill in the following once you discover them:
     - Available emulators/AVDs
     - Device identifiers
     - How to start an emulator
     - How to install and launch the app
     - Interaction tool installation and usage -->

## Mobile Web

Recommended interaction tool: **TBD** (browser automation)

<!-- Agent: Use context7 or web search to find a suitable agent-first
     browser interaction tool. Consider Playwright, Puppeteer, or similar.

     Fill in the following once you discover them:
     - How to launch a browser in the correct viewport
     - How to connect the interaction tool
     - Mobile viewport dimensions to use -->
