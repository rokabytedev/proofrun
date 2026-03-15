## ADDED Requirements

### Requirement: Session start acquires resources
`proofrun session start` MUST acquire a simulator and port from the configured pools, start the dev server, and verify the app is ready.

#### Scenario: Successful session start
- **WHEN** `proofrun session start --change "add-search"` is run
- **THEN** it MUST acquire an available simulator from the pool (flock-based lock)
- **AND** acquire an available port from the configured range
- **AND** start the dev server using the config's `dev_server.start` command with the acquired port
- **AND** wait for the `dev_server.ready_signal` pattern in stdout
- **AND** save session state to `.proofrun/sessions/<session-id>/state.json`
- **AND** output the session ID, simulator name, and port number

#### Scenario: All simulators locked
- **WHEN** all simulator slots are locked by other processes
- **THEN** the CLI MUST poll every 10 seconds with a status message
- **AND** acquire the first slot that becomes available
- **AND** support a `--timeout` flag to limit wait time (default: 300s)

#### Scenario: All ports in use
- **WHEN** all ports in the configured range are locked
- **THEN** the CLI MUST exit with an error suggesting expanding the port range

### Requirement: Simulator pool management
The CLI MUST manage a pool of simulator slots using flock-based kernel locks.

#### Scenario: Lock acquisition
- **WHEN** a simulator slot is acquired
- **THEN** the CLI MUST open the lock file at `.proofrun/locks/sim-<n>.lock` and hold an exclusive flock
- **AND** the flock MUST be held for the entire session duration
- **AND** if the process dies, the kernel MUST auto-release the flock

#### Scenario: Lock directory initialization
- **WHEN** `.proofrun/locks/` does not exist
- **THEN** `proofrun session start` MUST create it and create empty lock files for all configured slots

### Requirement: Port pool management
The CLI MUST manage a pool of network ports using flock-based locks.

#### Scenario: Port lock acquisition
- **WHEN** a port is acquired from the configured range
- **THEN** the CLI MUST verify the port is not in use (`lsof -i :<port>`)
- **AND** hold an exclusive flock on `.proofrun/locks/port-<n>.lock`

### Requirement: Dev server lifecycle
The CLI MUST start and stop the dev server as part of session lifecycle.

#### Scenario: Dev server start
- **WHEN** a session starts
- **THEN** the CLI MUST spawn the dev server command from config with the acquired port
- **AND** pipe stdout/stderr to `.proofrun/sessions/<session-id>/server.log`
- **AND** wait for the `ready_signal` regex to match in stdout before declaring ready

#### Scenario: Dev server stop
- **WHEN** `proofrun session stop` is run
- **THEN** the CLI MUST terminate the dev server process
- **AND** release all flock locks (simulators and ports)

### Requirement: Session stop releases all resources
`proofrun session stop` MUST release all resources acquired during the session.

#### Scenario: Clean teardown
- **WHEN** `proofrun session stop` is run
- **THEN** the dev server process MUST be terminated
- **AND** all simulator flock locks MUST be released
- **AND** all port flock locks MUST be released
- **AND** session state file MUST be updated with `status: "stopped"`

### Requirement: Session status
`proofrun session status` MUST show the current session state.

#### Scenario: Active session
- **WHEN** `proofrun session status` is run during an active session
- **THEN** it MUST display: session ID, change name, simulator name, port, dev server status, lock count

#### Scenario: No active session
- **WHEN** `proofrun session status` is run with no active session
- **THEN** it MUST display "No active session" and show lock pool status (available/locked counts)
