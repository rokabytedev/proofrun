## ADDED Requirements

### Requirement: Serve command starts feedback server
`proofrun serve --change <name>` SHALL start an HTTP server that serves the report and accepts feedback.

#### Scenario: Start server
- **WHEN** agent runs `npx proofrun serve --change ai-feedback-sound-detail`
- **THEN** an HTTP server SHALL start on a random available port
- **AND** stdout SHALL print `Serving report at http://localhost:PORT`
- **AND** `.proofrun/serve.pid` SHALL be written with the process PID
- **AND** the process SHALL block (not exit) until feedback is received or timeout

#### Scenario: Custom port
- **WHEN** agent runs `npx proofrun serve --change X --port 4000`
- **THEN** the server SHALL start on port 4000

#### Scenario: GET / serves report
- **WHEN** browser requests `GET /`
- **THEN** the server SHALL respond with the report HTML containing SERVE_MODE = true

#### Scenario: POST /feedback receives feedback
- **WHEN** browser POSTs JSON to `/feedback`
- **THEN** the server SHALL write the JSON to the latest session's `feedback.json`
- **AND** respond with 200 and `{"ok": true, "message": "Feedback received"}`
- **AND** the serve process SHALL exit with code 0

#### Scenario: POST /lgtm receives approval
- **WHEN** browser POSTs to `/lgtm`
- **THEN** the server SHALL write LGTM feedback (all criteria accepted, `lgtm: true`) to `feedback.json`
- **AND** respond with 200 and `{"ok": true, "message": "LGTM received"}`
- **AND** the serve process SHALL exit with code 0

#### Scenario: Timeout
- **WHEN** no feedback is received within the timeout (default 30 minutes)
- **THEN** the serve process SHALL exit with code 1
- **AND** print "Serve timed out after 30 minutes"

### Requirement: Serve stop command
`proofrun serve --stop` SHALL kill a running serve process.

#### Scenario: Stop running server
- **WHEN** agent runs `npx proofrun serve --stop`
- **AND** `.proofrun/serve.pid` exists with a valid PID
- **THEN** the CLI SHALL send SIGTERM to the process
- **AND** remove `.proofrun/serve.pid`

#### Scenario: No server running
- **WHEN** agent runs `npx proofrun serve --stop` and no serve.pid exists
- **THEN** the CLI SHALL print "No serve process running" and exit cleanly

### Requirement: Report UI in serve mode
When served via `proofrun serve`, the report SHALL display interactive feedback controls.

#### Scenario: Submit Feedback button
- **WHEN** the report is in serve mode
- **AND** user clicks "Submit Feedback"
- **THEN** browser SHALL POST feedback JSON to `/feedback`
- **AND** button SHALL change to "Feedback Submitted" (disabled)
- **AND** confirmation message SHALL appear: "Agent has been notified"

#### Scenario: LGTM button
- **WHEN** all criteria are accepted or carried with no rejection comments
- **THEN** the LGTM button SHALL be enabled
- **AND** clicking it SHALL POST to `/lgtm`
- **AND** button SHALL change to "LGTM-ed" (disabled)

#### Scenario: LGTM disabled when rejections exist
- **WHEN** any criterion is rejected or has a non-approval comment
- **THEN** the LGTM button SHALL be disabled
- **AND** tooltip SHALL explain: "Resolve rejections or submit feedback with comments"

#### Scenario: Static mode hides feedback controls
- **WHEN** the report is opened as a static file (not served)
- **THEN** feedback buttons SHALL NOT be shown

### Requirement: Feedback JSON includes top-level comment
Feedback JSON SHALL include a `top_level_comment` field from the top-level comment textarea.

#### Scenario: Feedback with top-level comment
- **WHEN** reviewer types "must re-verify everything" and submits
- **THEN** feedback JSON SHALL contain `"top_level_comment": "must re-verify everything"`

#### Scenario: Feedback without top-level comment
- **WHEN** reviewer submits without typing in the top-level comment box
- **THEN** feedback JSON SHALL contain `"top_level_comment": null`
