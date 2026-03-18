## ADDED Requirements

### Requirement: Device locks are system-global
Device locks SHALL be stored at `~/.proofrun/locks/` so they are visible to all agents on the machine regardless of project or git worktree.

#### Scenario: Lock is visible across worktrees
- **WHEN** agent A in worktree A runs `proofrun session start --device UDID-1 --change foo`
- **THEN** `~/.proofrun/locks/dev-UDID-1.lock.held` SHALL exist
- **AND** agent B in worktree B running `proofrun session start --device UDID-1 --change bar` SHALL fail with a lock error

#### Scenario: Lock is visible across projects
- **WHEN** agent in project X locks device UDID-1
- **THEN** agent in project Y running `proofrun session start --device UDID-1 --change baz` SHALL fail with a lock error referencing project X

#### Scenario: Lock directory created on first use
- **WHEN** `~/.proofrun/locks/` does not exist
- **AND** agent runs `proofrun session start --device UDID-1 --change foo`
- **THEN** `~/.proofrun/locks/` SHALL be created automatically
- **AND** the lock SHALL be acquired

### Requirement: Lock held files contain diagnostic metadata
Lock held files SHALL contain JSON with session, project, device, timestamp, and PID information.

#### Scenario: Lock held file format
- **WHEN** agent acquires a device lock
- **THEN** the `.lock.held` file SHALL contain JSON with fields: `session_id`, `project` (absolute project root path), `device` (device identifier), `locked_at` (ISO timestamp), `pid` (process ID)

### Requirement: Stale lock detection
The CLI SHALL detect stale locks by checking PID liveness and session state.

#### Scenario: PID is dead
- **WHEN** a lock's `pid` refers to a process that is no longer running
- **THEN** the lock SHALL be classified as stale

#### Scenario: Session is stopped but lock remains
- **WHEN** a lock's `pid` is still alive
- **AND** the session state file in the lock's project shows `status: "stopped"` for the lock's `session_id`
- **THEN** the lock SHALL be classified as stale

#### Scenario: Lock is active
- **WHEN** a lock's `pid` is alive
- **AND** the session state is `"active"`
- **THEN** the lock SHALL be classified as active

### Requirement: Force-unlock on session start
`proofrun session start --device <id> --force-unlock` SHALL remove an existing lock and acquire a new one.

#### Scenario: Device locked — error message with diagnostics
- **WHEN** agent runs `proofrun session start --device UDID-1 --change foo`
- **AND** UDID-1 is locked
- **THEN** the CLI SHALL exit with error containing: who holds the lock (session ID, project path, PID), whether the lock is stale or active, and the `--force-unlock` flag suggestion

#### Scenario: Force-unlock a stale lock
- **WHEN** agent runs `proofrun session start --device UDID-1 --change foo --force-unlock`
- **AND** UDID-1 has a stale lock
- **THEN** the existing lock SHALL be removed
- **AND** a new lock SHALL be acquired for the new session

#### Scenario: Force-unlock an active lock
- **WHEN** agent runs `proofrun session start --device UDID-1 --change foo --force-unlock`
- **AND** UDID-1 has an active lock
- **THEN** the existing lock SHALL be removed
- **AND** a new lock SHALL be acquired for the new session

### Requirement: Device status command
`proofrun device status` SHALL show the lock state of devices.

#### Scenario: List all device locks
- **WHEN** agent runs `proofrun device status`
- **THEN** output SHALL list all devices with locks in `~/.proofrun/locks/`
- **AND** each entry SHALL show: device identifier, lock status (free/locked/stale), session ID, project path

#### Scenario: Single device status
- **WHEN** agent runs `proofrun device status --device UDID-1`
- **AND** UDID-1 is locked with a stale lock
- **THEN** output SHALL show: device identifier, status "stale", session ID, project path, PID, locked_at timestamp, and a suggestion to use `--force-unlock`

#### Scenario: No locks exist
- **WHEN** agent runs `proofrun device status`
- **AND** `~/.proofrun/locks/` is empty or does not exist
- **THEN** output SHALL say "No device locks found"

#### Scenario: Works without project config
- **WHEN** agent runs `proofrun device status` outside a proofrun project
- **THEN** the command SHALL still work (reads global lock dir only)

### Requirement: LOCK_DIR constant removed
The `LOCK_DIR` project-relative constant SHALL be removed from `src/config.js`.

#### Scenario: No LOCK_DIR export
- **WHEN** code imports from `src/config.js`
- **THEN** `LOCK_DIR` SHALL NOT be available as an export
