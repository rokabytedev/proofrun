## Why

Proofrun's knowledge templates (`devices.md` and `interaction.md`) currently only provide concrete guidance for iOS via iosef. Android and Web sections are TBD placeholders that instruct the agent to research tools on its own — wasting time, producing inconsistent results, and blocking verification workflows on non-iOS platforms.

Agent-first tools now exist for both Android (`agent-device` by Callstack) and mobile web (`agent-browser` by Vercel). These tools match iosef's philosophy (no AI inside, structured CLI output, accessibility tree snapshots) and ship with Claude Code skills. By recommending them in the templates, agents can immediately start verifying on any platform.

Additionally, the iOS section currently inlines example commands (`iosef view`, `iosef tap`, etc.) that duplicate the skill's own documentation and can get out of date. All platforms should use a skill-only reference pattern: name the tool, provide the install command, and instruct the agent to follow the skill.

## What Changes

- **Replace iosef with agent-device for iOS native interaction** in `interaction.md` — agent-device provides a superset of iosef's capabilities (settings, biometrics, alerts, clipboard, pinch, diff snapshots) with a unified command surface across iOS and Android, backed by a team (Callstack) rather than a solo maintainer
- **Add agent-device for Android native interaction** in `interaction.md` — same tool, same commands, covering both platforms
- **Add agent-browser for mobile web interaction** in `interaction.md` — agent-first browser CLI with token-efficient snapshots, Chromium device emulation, and optional real Mobile Safari via iOS Simulator
- **Remove inline command examples** from all platform sections in `interaction.md` — replace with skill-only references (install command + "follow the skill instructions")
- **Add Android Emulator lifecycle** to `devices.md` — AVD creation via `avdmanager`, emulator boot/shutdown, and agent-device boot commands
- **Add Web browser lifecycle** to `devices.md` — agent-browser session lifecycle (no persistent device, browser managed by the tool)
- **Update `environment.md`** Android section — reference `sdkmanager`/`avdmanager` for SDK setup
- **Update knowledge-templates spec** — reflect new tool recommendations and skill-only pattern
- **Update SKILL.md** — replace iosef references with agent-device, add platform-aware device pool creation guidance for Android emulators

## Capabilities

### New Capabilities

_(none — this change modifies existing capabilities)_

### Modified Capabilities

- `knowledge-templates`: Tool recommendations change from iosef (iOS-only, TBD for others) to agent-device (iOS + Android) and agent-browser (Web). Inline command examples removed in favor of skill-only references.
- `agent-skill`: SKILL.md workflow references change from iosef to agent-device, and device pool creation guidance expands to cover Android emulators and web browser sessions.

## Impact

- **Templates**: `templates/knowledge/interaction.md`, `templates/knowledge/devices.md`, `templates/knowledge/environment.md`
- **Specs**: `openspec/specs/knowledge-templates/spec.md`, `openspec/specs/agent-skill/spec.md`
- **Skill**: `skills/proofrun/SKILL.md`
- **Dependencies**: Projects using proofrun will need to install `agent-device` and/or `agent-browser` skills (via `npx skills add`) depending on target platforms
- **Breaking**: Agents following the old `interaction.md` template that reference iosef commands directly will need to switch to agent-device. Since the template instructs agents to follow the skill, the transition is transparent — just install the new skill.
- **No CLI code changes**: All changes are in templates, specs, and skill documentation
