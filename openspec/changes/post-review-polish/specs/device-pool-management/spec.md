## ADDED Requirements

### Requirement: Device management policy in devices.md template
The `devices.md` knowledge template SHALL include a device management policy section that guides agents to ask humans for their preference on first use.

#### Scenario: First-time device policy prompt
- **WHEN** agent reads `devices.md` and no policy is recorded
- **THEN** the template SHALL instruct the agent to ask the human: (1) Create a dedicated proofrun device pool (recommended), or (2) Use whatever device is available each time (with race condition warning)

#### Scenario: Policy is recorded
- **WHEN** a prior agent has recorded a policy choice in `devices.md`
- **THEN** subsequent agents SHALL follow the recorded policy without re-asking

### Requirement: Device pool creation guidance in SKILL.md
SKILL.md SHALL instruct agents on how to create a dedicated device pool.

#### Scenario: Pool creation principles
- **WHEN** agent needs to create a dedicated pool
- **THEN** SKILL.md SHALL instruct the agent to: research the latest OS version before creating devices, start with 3 devices unless human requests otherwise, use naming format "(Proofrun-only) <Device Name>", choose form factor variety (large phone latest gen, small phone prior gen, tablet), and record created devices in `devices.md`

#### Scenario: Use-available policy
- **WHEN** device policy is "use-available"
- **THEN** SKILL.md SHALL instruct the agent to ask human approval before using any device, warning about potential conflicts with other agents or human work

### Requirement: Device lifecycle and cleanup
SKILL.md and `devices.md` SHALL include device cleanup instructions.

#### Scenario: Post-verification cleanup
- **WHEN** verification is complete (LGTM received or all criteria approved)
- **THEN** the agent SHALL shut down the simulator/emulator to free system RAM
- **AND** release the device lock via session stop (which happens before serve)

#### Scenario: Device left running warning
- **WHEN** the `devices.md` template instructs on device lifecycle
- **THEN** it SHALL include a note that devices should not be left running after verification as they consume system RAM

### Requirement: Rename simulators.md to devices.md
The knowledge template `simulators.md` SHALL be renamed to `devices.md`.

#### Scenario: Template file name
- **WHEN** `proofrun init` copies knowledge templates
- **THEN** the devices template SHALL be named `devices.md` (not `simulators.md`)

#### Scenario: No iosef reference in devices.md
- **WHEN** reading the `devices.md` template
- **THEN** there SHALL be no interaction tool references (iosef, etc.) — those belong in `interaction.md`
