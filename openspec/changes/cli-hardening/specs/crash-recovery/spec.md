## ADDED Requirements

### Requirement: Stale session detection
`findActiveSession` MUST detect sessions where the dev server process has died but state still shows "active".

#### Scenario: Dev server PID is dead
- **WHEN** a session has `status: "active"` and `dev_server.pid` refers to a dead process
- **THEN** `findActiveSession` MUST mark the session as `status: "crashed"`
- **AND** it MUST clean up any associated lock files
- **AND** it MUST NOT return that session as the active session

#### Scenario: Dev server PID is alive
- **WHEN** a session has `status: "active"` and `dev_server.pid` refers to a running process
- **THEN** `findActiveSession` MUST return that session as normal

#### Scenario: No dev server PID in state
- **WHEN** a session has `status: "active"` but no `dev_server.pid` field
- **THEN** `findActiveSession` MUST treat the session as stale and mark it "crashed"

### Requirement: Recovery reporting
When a stale session is auto-recovered, the next `session start` MUST report what happened.

#### Scenario: Session start after crash recovery
- **WHEN** `proofrun session start` is run and a stale session was auto-recovered
- **THEN** the response JSON MUST include `recovered_stale_session` with the recovered session ID

### Requirement: Lock cleanup on crash recovery
Stale session recovery MUST release any locks associated with the crashed session.

#### Scenario: Lock files cleaned up
- **WHEN** a stale session is detected with simulator slot 2 and port 8091
- **THEN** the lock files `sim-2.lock.held` and `port-8091.lock.held` MUST be removed
- **AND** those resources MUST be available for the next session
