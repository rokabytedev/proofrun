## Context

Proofrun's knowledge templates (`templates/knowledge/`) are the primary mechanism for guiding agents on how to interact with devices and apps during verification. Currently:

- `interaction.md` recommends iosef for iOS with inline command examples, and has TBD placeholders for Android and Web
- `devices.md` documents device lifecycle with iOS-centric examples (simctl, UDID)
- `environment.md` has blank sections for Android and Web build/install
- `SKILL.md` references iosef in device pool creation examples

Three agent-first tools have been evaluated through deep research:

| Tool | Platform | Backing | Philosophy |
|------|----------|---------|-----------|
| **agent-device** (Callstack) | iOS + Android | 15 contributors, ~1.1k stars | No AI inside, CLI + skill, @ref targeting, XCUITest runner (iOS) / uiautomator (Android) |
| **agent-browser** (Vercel) | Mobile web | 23k+ stars | No AI inside, CLI + skill, @eN ref targeting, Chromium emulation + real Safari |
| **iosef** (solo dev) | iOS only | 1 contributor, 4 stars | No AI inside, CLI + skill, host-side accessibility APIs |

agent-device replaces iosef for iOS because it provides a superset of capabilities (settings, biometrics, alerts, clipboard, pinch, diff snapshots, batch/replay), has a unified command surface covering both iOS and Android, uses token-efficient @ref element targeting, and is backed by a professional team with active multi-weekly releases.

## Goals / Non-Goals

**Goals:**
- All three platform sections in `interaction.md` have concrete tool recommendations with install commands
- All platform sections use the skill-only reference pattern (no inline command examples)
- `devices.md` covers Android emulator lifecycle (AVD creation, boot, shutdown) and web browser sessions
- `environment.md` Android section references SDK CLI tools (`sdkmanager`, `avdmanager`)
- `SKILL.md` workflow is platform-agnostic, referencing agent-device instead of iosef
- `knowledge-templates` spec reflects the new tool recommendations
- `agent-skill` spec reflects the updated SKILL.md content

**Non-Goals:**
- Adding Playwright MCP support — agent-browser covers the mobile web need
- CLI code changes — all changes are in templates, specs, and skill documentation
- Automating SDK/tool installation — the templates tell agents what to install, agents handle it
- Supporting physical devices — emulators/simulators only (matching current scope)

## Decisions

### Decision 1: Replace iosef with agent-device for iOS

**Choice:** Switch the iOS recommendation from iosef to agent-device.

**Rationale:**
- agent-device is a strict superset of iosef's capabilities for iOS
- One tool covers both iOS and Android — agents learn one command surface
- @ref element targeting is more token-efficient than iosef's selector-or-coordinates approach
- Team-backed (Callstack, 15 contributors) vs solo maintainer risk
- Ships with a comprehensive Claude Code SKILL.md

**Alternative considered:** Keep iosef for iOS, use agent-device only for Android.
- Rejected because: two tools means two skills to install, two command surfaces to learn, and iosef's solo maintainer is a bus-factor risk. The unified surface is worth the XCUITest runner setup cost.

**Alternative considered:** Keep iosef and add agent-device as an alternative.
- Rejected because: proofrun templates should recommend ONE tool per platform to avoid agent decision fatigue. The template's job is to provide a clear, opinionated default.

### Decision 2: Use agent-browser for mobile web

**Choice:** Recommend agent-browser (Vercel) for the Web section.

**Rationale:**
- Agent-first CLI with @eN ref targeting (same pattern as agent-device's @ref)
- Token-efficient snapshots (93% less context than Playwright MCP)
- Two modes: Chromium device emulation (any OS) and real Mobile Safari (-p ios, macOS only)
- Ships with Claude Code skill

**Alternative considered:** Playwright MCP (already available in many setups).
- Rejected because: token-bloated (full a11y tree per action), not CLI-native, and doesn't provide real Mobile Safari testing.

### Decision 3: Skill-only reference pattern (no inline command examples)

**Choice:** All platform sections in `interaction.md` follow the same pattern:
1. Name the recommended tool
2. Provide the skill install command
3. Say "follow the skill instructions for detailed usage"
4. Keep the agent-filled project-specific patterns section

No inline command examples (no `iosef view`, `iosef tap`, etc.).

**Rationale:**
- Inline examples duplicate the skill's own documentation
- Examples get out of date when the tool updates
- The skill is the authoritative source — it's maintained by the tool's developers
- Consistent pattern across all three platforms

**Template structure per platform:**
```markdown
## <Platform>

Recommended tool: **<tool-name>** (<one-line description>)

Install skill: `<install command>`

Follow the skill instructions for detailed usage.

<!-- Agent: Add project-specific interaction patterns below:
     - Element identifier naming conventions
     - Animation timings and wait requirements
     - Known quirks or workarounds -->
```

### Decision 4: Android emulator lifecycle in devices.md

**Choice:** Add an Android-specific section to devices.md covering AVD creation, boot, and shutdown.

The agent creates AVDs using standard Android SDK CLI tools:
- `sdkmanager --install "system-images;android-<API>;google_apis;arm64-v8a"` to download system images
- `echo "no" | avdmanager create avd --name "<name>" --package "<image>" --device "<profile>" --force` to create AVDs non-interactively
- `agent-device boot --platform android --device <avd-name>` to boot (or `emulator -avd <name> -no-window -no-audio` for headless)
- `adb emu kill` to shutdown

**Device pool naming convention:** Same pattern as iOS: `(Proofrun-only) Pixel 9 Pro` with form factor variety (large phone, small phone, tablet).

**Prerequisites:** `ANDROID_HOME` set, `cmdline-tools/latest/bin` in PATH, licenses accepted (`yes | sdkmanager --licenses`). The `environment.md` Android section will reference these.

### Decision 5: Web browser session lifecycle in devices.md

**Choice:** Add a Web section to devices.md explaining that web browser sessions are ephemeral — no persistent device to manage.

- agent-browser manages its own browser lifecycle (daemon + Chromium/Safari)
- No AVD/simulator creation needed
- The agent just runs `agent-browser open <url>` (optionally with `set device` for mobile emulation or `-p ios` for real Safari)
- Device locking still applies — the `--device` flag for `proofrun session start` uses a logical identifier like `chromium-mobile` or `safari-ios-sim`

### Decision 6: SKILL.md updates

**Choice:** Update SKILL.md to:
1. Replace the iosef reference in the device pool creation section with platform-agnostic guidance
2. Add Android emulator pool creation guidance alongside iOS simulator pool creation
3. Reference "the interaction tool" generically, with a note to check `knowledge/interaction` for the platform-specific tool
4. Keep the workflow platform-agnostic — the SKILL.md describes the proofrun workflow, not the interaction tool's commands

**Specific changes in SKILL.md:**
- Section "3. Set Up Environment > Device Management": Replace `xcrun simctl list runtimes` with platform-agnostic guidance that says "check the interaction tool's documentation for device creation commands" and gives both iOS and Android examples
- Device pool creation: Show both iOS simulator creation (using agent-device) and Android AVD creation (using avdmanager + agent-device boot) as examples
- Remove iosef from all references

## Risks / Trade-offs

**[Risk] agent-device is labeled "Experimental"** → Both agent-device and iosef are young (6-7 weeks old). agent-device has significantly more community traction and professional backing, making it the lower-risk choice despite the label.

**[Risk] XCUITest runner build step adds first-use friction** → One-time cost. Subsequent sessions reuse the built runner. The skill documentation covers this. iosef's zero-config is nicer but not worth the capability and maintainability tradeoffs.

**[Risk] Node.js 22+ dependency for agent-device** → Most Claude Code users already have Node.js. Version 22+ is current LTS. Low practical risk.

**[Risk] agent-browser requires Appium for real Safari mode** → Only needed for `-p ios` mode. Chromium device emulation works without Appium. The template should note this as optional.

**[Trade-off] Losing iosef's architectural simplicity** → iosef's single-binary, no-daemon, host-side approach is elegant. We trade this for agent-device's richer capabilities and cross-platform unification. The complexity is encapsulated in the tool — the agent's experience (install skill, follow instructions) is the same.
