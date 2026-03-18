## 1. Update interaction.md template

- [ ] 1.1 Replace iOS section: remove iosef recommendation and inline command examples, replace with agent-device skill-only reference (tool name, install command `npx skills add callstackincubator/agent-device@agent-device -g`, "follow the skill instructions for detailed usage", project-specific patterns placeholder)
- [ ] 1.2 Replace Android section: remove TBD placeholder, add agent-device skill-only reference (same tool/install as iOS — note that one install covers both platforms, project-specific patterns placeholder)
- [ ] 1.3 Replace Web section: remove TBD placeholder, add agent-browser skill-only reference (tool name, install command `npx skills add vercel-labs/agent-browser@agent-browser -g`, note about Chromium emulation vs real Safari, project-specific patterns placeholder)
- [ ] 1.4 Update the top-level comment to reflect the skill-only pattern (remove "If the interaction tool skill is installed" conditional — it's now always required)

## 2. Update devices.md template

- [ ] 2.1 Add Android Emulator section to Device Pool: AVD creation guidance using `avdmanager` CLI (non-interactive `echo "no" | avdmanager create avd ...`), system image download via `sdkmanager`, `arm64-v8a` for Apple Silicon / `x86_64` for Intel, naming convention `(Proofrun-only) <Device Name>`, form factor variety (large phone, small phone, tablet using Pixel device profiles)
- [ ] 2.2 Add Android lifecycle to Device Lifecycle section: boot via interaction tool or `emulator -avd <name>`, wait for boot (`adb wait-for-device`), shutdown (`adb emu kill`), delete (`avdmanager delete avd --name <name>`)
- [ ] 2.3 Add Web Browser section to Device Pool: note that web sessions are ephemeral (no persistent device), agent-browser manages browser lifecycle, use logical device identifier (e.g., `chromium-mobile`, `safari-ios-sim`) for proofrun session locking
- [ ] 2.4 Make existing iOS examples platform-neutral where possible (e.g., Device Lifecycle checklist should apply to all platforms, with platform-specific boot/shutdown commands in sub-bullets)

## 3. Update environment.md template

- [ ] 3.1 Update Android Build & Install section: add references to SDK CLI tools (`sdkmanager` for packages, `avdmanager` for AVDs), note `ANDROID_HOME` and PATH prerequisites, note `yes | sdkmanager --licenses` for non-interactive license acceptance

## 4. Update SKILL.md

- [ ] 4.1 Remove all iosef references from SKILL.md — replace with generic "interaction tool" language and direction to read `knowledge/interaction`
- [ ] 4.2 Update device pool creation section: add Android emulator pool creation guidance alongside iOS (avdmanager + sdkmanager commands, Pixel device profiles, form factor variety), add web browser session note (no pool needed, use logical identifier)
- [ ] 4.3 Replace `xcrun simctl list runtimes` with platform-agnostic guidance — e.g., "check the latest OS version for your platform" with iOS and Android examples

## 5. Update specs

- [ ] 5.1 Update `openspec/specs/knowledge-templates/spec.md`: apply the delta spec changes (new tool recommendations, skill-only pattern, Android emulator lifecycle, web browser sessions)
- [ ] 5.2 Update `openspec/specs/agent-skill/spec.md`: apply the delta spec changes (platform-agnostic interaction references, multi-platform device pool guidance)
