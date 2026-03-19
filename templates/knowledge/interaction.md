---
name: Interaction Tool
description: How to interact with the running app — screenshots, tapping, finding elements,
  reading the accessibility tree. Read when starting any verification session.
---

<!-- Agent: Fill in the sections below for each platform this project targets.
     Remove sections for platforms that don't apply.
     Each platform requires its interaction tool skill to be installed — follow the install command and skill instructions. -->

## iOS

Recommended tool: **agent-device** (agent-first iOS + Android interaction)

Install skill: `npx skills add callstackincubator/agent-device@agent-device -g`

Follow the skill instructions for detailed usage.

<!-- Agent: Add project-specific interaction patterns below:
     - Element identifier naming conventions
     - Animation timings and wait requirements
     - Known quirks or workarounds -->

## Android

Recommended tool: **agent-device** (agent-first iOS + Android interaction — same tool as iOS, one install covers both platforms)

Install skill: `npx skills add callstackincubator/agent-device@agent-device -g`

Follow the skill instructions for detailed usage.

<!-- Agent: Add project-specific interaction patterns below:
     - Element identifier naming conventions
     - Animation timings and wait requirements
     - Known quirks or workarounds -->

## Web

Recommended tool: **agent-browser** (agent-first browser interaction)

Install skill: `npx skills add vercel-labs/agent-browser@agent-browser -g`

Follow the skill instructions for detailed usage.

Note: Chromium device emulation works on any OS. Real Mobile Safari testing requires macOS + iOS Simulator + Appium (`npm install -g appium && appium driver install xcuitest`).

<!-- Agent: Add project-specific interaction patterns below:
     - Selector strategy (data-testid, aria-label, etc.)
     - Responsive breakpoints
     - Known quirks or workarounds -->
