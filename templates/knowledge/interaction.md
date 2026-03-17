---
name: Interaction Tool
description: How to interact with the running app — screenshots, tapping, finding elements,
  reading the accessibility tree. Read when starting any verification session.
---

<!-- Agent: Fill in the sections below for each platform this project targets.
     Remove sections for platforms that don't apply.
     If the interaction tool skill is installed, follow its instructions for detailed usage. -->

## iOS

Recommended tool: **iosef** (agent-first iOS simulator interaction)

Install: `npx skills add riwsky/iosef@ios-simulator-interaction -g`

If the iosef skill is installed, follow its instructions for detailed usage. Key commands:
- `iosef view` — capture screenshot of current screen
- `iosef tree` — read accessibility tree (all elements with identifiers, labels, coordinates)
- `iosef find --identifier <testID>` — find a specific element
- `iosef tap --identifier <testID>` — tap an element
- `iosef type "text"` — type text into focused field

<!-- Agent: Add project-specific interaction patterns below:
     - testID / accessibilityIdentifier naming conventions
     - Animation timings and wait requirements
     - Known quirks or workarounds -->

## Android

Recommended tool: **TBD** (no agent-first tool tested yet)

<!-- Agent: Use context7 or web search to find a suitable agent-first
     interaction tool for Android. Document its installation and key commands here.

     Add project-specific patterns:
     - Element identifier naming conventions
     - Interaction quirks -->

## Web

Recommended tool: **TBD** (browser automation)

<!-- Agent: Use context7 or web search to find a suitable agent-first
     browser interaction tool. Document its installation and key commands here.

     Add project-specific patterns:
     - Selector strategy (data-testid, aria-label, etc.)
     - Responsive breakpoints -->
