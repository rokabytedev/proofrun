## Why

Proofrun's SKILL.md and knowledge layer are tightly coupled to iOS/React Native. iOS-specific examples (`xcrun simctl`, `iosef`) appear directly in the skill, the `--preset` flag requires maintaining per-framework preset bundles, and the `--simulator` flag assumes iOS terminology. This limits proofrun to a single platform and creates maintenance burden for each new framework.

The skill should express the *what* (verification workflow, evidence principles) while knowledge files express the *how* (platform-specific commands, tools). This makes proofrun a generic mobile app verification tool — iOS, Android, and mobile web — without the skill itself knowing about any platform.

## What Changes

- **BREAKING**: Remove `--preset` flag from `proofrun init`. Init scaffolds one universal config + generic knowledge templates.
- **BREAKING**: Rename `--simulator` to `--device` in `session start` (and all internal references).
- Restructure SKILL.md: reorder sections (identity → triggers → prerequisites → workflow → principles), remove all platform-specific examples, shrink ~60%.
- Replace preset-specific knowledge templates with generic, multi-platform templates that include per-platform sections (iOS, Android, Web) with embedded agent instructions for discovery and tool selection.
- Remove `presets/` directory entirely (expo, react-native-cli presets deleted).
- Knowledge templates instruct agents to: use the best known agent-first interaction tool per platform (e.g., iosef for iOS), use context7 or tool docs for usage instructions, and fill in project-specific details.

## Capabilities

### New Capabilities
- `generic-init`: Universal `proofrun init` (no preset flag) that scaffolds config + generic multi-platform knowledge templates.
- `skill-workflow`: Restructured SKILL.md — platform-agnostic verification workflow with clear section ordering and no framework-specific content.
- `knowledge-templates`: Generic knowledge template files with per-platform sections (iOS/Android/Web) and embedded agent discovery instructions.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **CLI**: `init` command loses `--preset` flag, `session start` renames `--simulator` to `--device`. Both are breaking changes.
- **Presets**: `presets/expo/` and `presets/react-native-cli/` directories deleted entirely.
- **Skill**: `skills/proofrun/SKILL.md` rewritten.
- **Knowledge templates**: New generic templates replace preset-specific ones. Moved from `presets/*/knowledge/` to a single `templates/knowledge/` directory.
- **Tests**: Any tests referencing `--preset` or `--simulator` flags need updating.
- **Internal code**: `session.js`, `locking.js`, and any references to "simulator" in data structures renamed to "device".
