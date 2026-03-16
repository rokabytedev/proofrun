---
name: Interaction Tool
description: How to interact with the iOS simulator — screenshots, tapping, finding elements, accessibility tree. Read when starting any verification session.
---

## Required Tool: iosef

Install the iosef skill for AI-agent-optimized simulator interaction:
```
npx skills add riwsky/iosef@ios-simulator-interaction -g
```

Verify installation: `iosef --help`

If the iosef skill is installed, follow its instructions for detailed usage. Key commands:
- `iosef view` — capture screenshot of current screen
- `iosef tree` — read accessibility tree (all elements with identifiers, labels, coordinates)
- `iosef find --identifier <testID>` — find a specific element
- `iosef tap --identifier <testID>` — tap an element
- `iosef type "text"` — type text into focused field

## Element Strategy

This project uses React Native `testID` props which map to iOS `accessibilityIdentifier`.
Use `iosef find --identifier <testID>` to locate elements.

## testID Attribute

The testID attribute name is `testID` (React Native convention).

<!-- Agent: add project-specific interaction patterns below (testID naming conventions, animation timings, known quirks) -->
