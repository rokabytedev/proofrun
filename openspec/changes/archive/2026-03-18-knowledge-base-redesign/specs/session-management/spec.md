## MODIFIED Requirements

### Requirement: Session start acquires locks only
`proofrun session start` MUST acquire simulator and port locks, create session state, and return allocated resources. It MUST NOT manage dev server lifecycle.

#### Scenario: Session start
- **WHEN** `proofrun session start --change <name>` is run
- **THEN** the CLI MUST acquire a simulator slot and port
- **AND** create session directory with evidence.json
- **AND** return session_id, allocated port, simulator slot
- **AND** it MUST NOT spawn a dev server process

#### Scenario: Session stop
- **WHEN** `proofrun session stop` is run
- **THEN** the CLI MUST release simulator and port locks
- **AND** update session state to stopped
- **AND** it MUST NOT attempt to kill any dev server process

### Requirement: Session-bound locks
Locks MUST be tied to session IDs instead of process PIDs.

#### Scenario: Lock held file content
- **WHEN** a lock is acquired during session start
- **THEN** the lock held file MUST contain the session ID
- **AND** stale detection MUST check session age, not PID liveness
