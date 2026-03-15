# Verification Boundaries

Use this template to classify acceptance criteria as agent-verifiable or human-required.
Projects can override this with their own `.proofrun/boundaries.md`.

## Agent-Verifiable (Simulator Tool Can Check)

| Category | What the Agent Can Verify | How |
|----------|--------------------------|-----|
| **Element Visibility** | UI elements are present and visible on screen | `iosef find --identifier <id>` returns coordinates |
| **Navigation** | Tapping navigates to the correct screen | Tap element, take screenshot, verify expected screen |
| **Text Content** | Labels, titles, placeholders show correct text | `iosef find --name <text>` or read accessibility tree |
| **Form Inputs** | Text fields accept input, keyboards appear | `iosef type` into field, verify value |
| **Gestures** | Tap, long press, swipe produce expected results | Execute gesture via iosef, verify state change |
| **State Persistence** | Data survives navigation or app restart | Navigate away and back, verify data still present |
| **Toggle/Switch State** | Toggles reflect correct on/off state | Tap toggle, verify accessibility value changes |
| **List Content** | Lists show expected items | Scroll list, find expected elements by identifier |
| **Conditional Rendering** | Elements appear/disappear based on state | Trigger condition, verify element presence/absence |
| **Layout Structure** | Elements are in expected relative positions | Compare coordinates from `iosef find` results |
| **Error States** | Error messages appear for invalid inputs | Trigger error condition, verify error element visible |
| **Loading States** | Loading indicators appear during async operations | Trigger load, verify indicator, wait for completion |

## Human-Required (Cannot Verify via Simulator Tool)

| Category | Why the Agent Cannot Verify | Recommendation |
|----------|---------------------------|----------------|
| **Audio Output** | No audio capture API in simulator tools | Mark as `--human`, note what to listen for |
| **Haptic Feedback** | Simulator doesn't produce haptics | Mark as `--human`, note expected haptic pattern |
| **Performance** | Timing/frame rate not reliably measurable | Mark as `--human`, note performance expectation |
| **Real-Device-Only** | Features requiring hardware (camera, NFC, Bluetooth) | Mark as `--human`, note what to test on device |
| **VoiceOver** | Accessibility announcements not capturable | Mark as `--human`, note expected announcements |
| **Visual Polish** | Subtle spacing, colors, animations | Mark as `--human`, provide screenshot for comparison |
| **Internationalization** | Complex RTL layout, font rendering | Mark as `--human`, note locale to test |
| **Network Conditions** | Behavior under slow/offline network | Mark as `--human`, note conditions to simulate |
| **Multi-Device Sync** | Features requiring multiple devices | Mark as `--human`, describe sync scenario |
| **Push Notifications** | Real push notification delivery | Mark as `--human`, note expected notification |

## Classification Guidelines

1. **When in doubt, mark as human-required** — false negatives (missing a bug) are worse than extra human checks
2. **Combine approaches**: An AC might be partially agent-verifiable (element exists) and partially human-required (animation looks correct)
3. **Test IDs are your friend**: If an element has a testID/accessibilityIdentifier, it's almost certainly agent-verifiable
4. **No testID? Still try**: `iosef find --name <label>` works for elements with accessibility labels
5. **Coordinates as last resort**: `iosef tap --x 200 --y 400` works but is fragile — prefer identifiers
