## ADDED Requirements

### Requirement: Generic multi-platform knowledge templates
All knowledge template files SHALL be platform-agnostic at the top level, with pre-created per-platform sections (iOS, Android, Web) that agents fill in based on what the project targets.

#### Scenario: Template file structure
- **WHEN** `proofrun init` copies knowledge templates
- **THEN** each template file has a frontmatter header (name, description)
- **AND** contains agent discovery instructions explaining what to investigate
- **AND** contains pre-created sections for iOS, Android, and Web platforms
- **AND** each platform section has `<!-- Agent: ... -->` placeholders for the agent to fill in

### Requirement: Simulators knowledge template
The `devices.md` template SHALL have separate sections for iOS Simulator, Android Emulator, and Web Browser, each with platform-specific device lifecycle guidance.

#### Scenario: iOS section content
- **WHEN** the agent reads the iOS Simulator section
- **THEN** it finds guidance on creating simulators using the recommended interaction tool or `xcrun simctl`
- **AND** the device pool naming convention `(Proofrun-only) <Device Name>` with form factor variety
- **AND** placeholder instructions to fill in device identifiers (UDID, OS version)

#### Scenario: Android section content
- **WHEN** the agent reads the Android Emulator section
- **THEN** it finds guidance on creating AVDs using `avdmanager` CLI
- **AND** the command to download system images via `sdkmanager`
- **AND** the non-interactive AVD creation command (`echo "no" | avdmanager create avd ...`)
- **AND** boot commands (via the recommended interaction tool or `emulator` CLI)
- **AND** shutdown commands (`adb emu kill`)
- **AND** the device pool naming convention `(Proofrun-only) <Device Name>` with form factor variety (large phone, small phone, tablet)
- **AND** placeholder instructions to fill in AVD names, API levels, and device profiles

#### Scenario: Web section content
- **WHEN** the agent reads the Web Browser section
- **THEN** it finds a note that web browser sessions are ephemeral and managed by the interaction tool
- **AND** guidance on using a logical device identifier (e.g., `chromium-mobile`, `safari-ios-sim`) for proofrun session locking
- **AND** no AVD/simulator creation steps (the browser is managed by the tool)

### Requirement: Interaction knowledge template
The `interaction.md` template SHALL have per-platform sections using a skill-only reference pattern.

#### Scenario: Skill-only reference pattern
- **WHEN** the agent reads any platform section in `interaction.md`
- **THEN** it finds the recommended tool name
- **AND** the skill install command (`npx skills add ...`)
- **AND** the instruction "Follow the skill instructions for detailed usage"
- **AND** it does NOT find inline command examples (no tool-specific commands like `view`, `tap`, `tree`, etc.)

#### Scenario: iOS section content
- **WHEN** the agent reads the iOS section
- **THEN** it finds the recommended tool is `agent-device` (agent-first iOS + Android interaction)
- **AND** the install command for the agent-device skill

#### Scenario: Android section content
- **WHEN** the agent reads the Android section
- **THEN** it finds the recommended tool is `agent-device` (same tool as iOS)
- **AND** the install command for the agent-device skill (same as iOS — one install covers both)

#### Scenario: Web section content
- **WHEN** the agent reads the Web section
- **THEN** it finds the recommended tool is `agent-browser` (agent-first browser interaction)
- **AND** the install command for the agent-browser skill
- **AND** a note that Chromium device emulation works on any OS, while real Mobile Safari requires macOS + iOS Simulator + Appium

#### Scenario: Project-specific patterns placeholder
- **WHEN** the agent reads any platform section
- **THEN** it finds `<!-- Agent: ... -->` placeholder instructions for project-specific patterns
- **AND** the placeholders mention element identifier conventions, animation timings, and known quirks

### Requirement: Environment knowledge template
The `environment.md` template SHALL guide the agent to discover the project's build system, dev server, and connection method without assuming any specific framework.

#### Scenario: No framework assumptions
- **WHEN** the agent reads `environment.md`
- **THEN** the template does not mention Expo, React Native, Flutter, or any specific framework
- **AND** it instructs the agent to investigate the project to determine the build system
- **AND** it has sections for: Project Structure, Build & Install, Dev Server, Connection

#### Scenario: Android build section references SDK tools
- **WHEN** the agent reads the Android Build & Install section of `environment.md`
- **THEN** it finds references to `sdkmanager` for installing SDK packages
- **AND** references to `avdmanager` for creating AVDs
- **AND** a note about `ANDROID_HOME` and PATH prerequisites
- **AND** a note about accepting licenses non-interactively (`yes | sdkmanager --licenses`)

### Requirement: Boundaries knowledge template
The `boundaries.md` template SHALL describe agent-verifiable vs human-required categories in platform-agnostic terms.

#### Scenario: Generic verification boundaries
- **WHEN** the agent reads `boundaries.md`
- **THEN** the agent-verifiable table uses generic terms (e.g., "interaction tool" not any specific tool name)
- **AND** the human-required table applies to any mobile platform

### Requirement: Context knowledge template
The `context.md` template SHALL describe how to discover what to verify, without assuming any specific project management tool.

#### Scenario: Generic context discovery
- **WHEN** the agent reads `context.md`
- **THEN** it finds guidance for OpenSpec projects, GitHub-based projects, and free-form verification
- **AND** no framework-specific content

### Requirement: Multi-platform knowledge structure
When a project targets multiple platforms (e.g., iOS + Android), the knowledge files SHALL contain filled-in sections for each targeted platform. The template instructions SHALL make this clear.

#### Scenario: Agent fills multiple platform sections
- **WHEN** the agent discovers the project targets both iOS and Android
- **THEN** the agent fills in both the iOS and Android sections in `devices.md` and `interaction.md`
- **AND** leaves the Web section as placeholder (or removes it if not relevant)
