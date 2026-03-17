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
The `simulators.md` template SHALL have separate sections for iOS Simulator, Android Emulator, and Mobile Web, each recommending the best known agent-first interaction tool.

#### Scenario: iOS section content
- **WHEN** the agent reads the iOS Simulator section
- **THEN** it finds the recommended tool is `iosef`
- **AND** the install command: `npx skills add riwsky/iosef@ios-simulator-interaction -g`
- **AND** placeholder instructions to fill in device management commands, available devices, and device IDs

#### Scenario: Android section content
- **WHEN** the agent reads the Android Emulator section
- **THEN** it finds a note that no agent-first tool has been tested yet
- **AND** instructions to use context7 or web search to find suitable tools
- **AND** placeholder instructions to fill in emulator management and device IDs

#### Scenario: Web section content
- **WHEN** the agent reads the Mobile Web section
- **THEN** it finds a note that no agent-first tool has been tested yet
- **AND** instructions to investigate browser automation options
- **AND** placeholder instructions to fill in browser launch and viewport config

### Requirement: Interaction knowledge template
The `interaction.md` template SHALL have per-platform sections for interaction tool usage patterns.

#### Scenario: Per-platform interaction sections
- **WHEN** the agent reads `interaction.md`
- **THEN** it finds sections for iOS, Android, and Web
- **AND** each section states the recommended tool (or "TBD" if none tested)
- **AND** each section has placeholders for project-specific patterns (element identifiers, naming conventions, animation timings)

### Requirement: Environment knowledge template
The `environment.md` template SHALL guide the agent to discover the project's build system, dev server, and connection method without assuming any specific framework.

#### Scenario: No framework assumptions
- **WHEN** the agent reads `environment.md`
- **THEN** the template does not mention Expo, React Native, Flutter, or any specific framework
- **AND** it instructs the agent to investigate the project to determine the build system
- **AND** it has sections for: Project Structure, Build & Install, Dev Server, Connection

### Requirement: Boundaries knowledge template
The `boundaries.md` template SHALL describe agent-verifiable vs human-required categories in platform-agnostic terms.

#### Scenario: Generic verification boundaries
- **WHEN** the agent reads `boundaries.md`
- **THEN** the agent-verifiable table uses generic terms (e.g., "interaction tool" not "iosef")
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
- **THEN** the agent fills in both the iOS and Android sections in `simulators.md` and `interaction.md`
- **AND** leaves the Web section as placeholder (or removes it if not relevant)
