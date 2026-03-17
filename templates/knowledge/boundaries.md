---
name: Verification Boundaries
description: What the agent can verify via an interaction tool vs what requires human review.
  Read when classifying acceptance criteria or verification targets.
---

## Agent-Verifiable (via interaction tool)

| Category | How to Verify |
|----------|--------------|
| Element visibility | Find by identifier, check coordinates returned |
| Navigation | Tap element, verify new screen via accessibility tree |
| Text content | Read accessibility tree, check labels and values |
| Form inputs | Type into field, verify value appears |
| Gestures | Execute tap/swipe/scroll, verify resulting state |
| State persistence | Navigate away and back, verify state preserved |
| Toggle state | Tap toggle, verify accessibility value changes |
| List content | Scroll through list, find expected items |
| Conditional rendering | Trigger condition, verify element presence/absence |
| Layout structure | Compare element coordinates for relative positioning |
| Error states | Trigger error condition, verify error message appears |
| Loading states | Trigger async operation, verify loading indicator |

## Human-Required

| Category | Why |
|----------|-----|
| Audio output | No audio capture API in simulators/emulators |
| Haptic feedback | Simulators cannot produce haptics |
| Performance | Not reliably measurable via interaction tools |
| Real-device-only features | Hardware sensors, NFC, etc. |
| VoiceOver/TalkBack announcements | Not capturable via current tools |
| Visual polish | Subtle spacing, colors, animations need human eye |
| Complex internationalization | RTL layouts, font rendering edge cases |
| Network conditions | Need actual slow/offline network |
| Multi-device sync | Requires multiple devices |
| Push notifications | Real delivery pipeline required |

## Classification Guidelines

- If you can detect it via the accessibility tree or element coordinates — agent-verifiable
- If it requires human perception (hearing, visual judgment) — human-required
- When uncertain, attempt verification — if the tool can detect it, it's verifiable
- Mark borderline cases as `--human` with reasoning so the reviewer understands
