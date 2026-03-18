## Context

Currently each `proofrun report` generates an independent HTML file for a single session. When the agent re-verifies after feedback, it creates a "v2" report that has no link to the first. Approved criteria are lost, the reviewer re-reviews everything, and the "what changed" narrative is invisible. The feedback workflow is also manual: export JSON from browser, tell agent the file path.

## Goals / Non-Goals

**Goals:**
- Multi-run reports: one HTML report per change name, with tabs for each run
- Criteria carryover: previously approved criteria carry forward, re-verified criteria are highlighted
- `carry` command for explicit carry-forward with audit trail
- `serve` command for live feedback loop (HTTP server, POST feedback, agent notification)
- Top-level reviewer comment box
- LGTM quick-approval flow
- `serve --stop` to kill a running server

**Non-Goals:**
- Real-time WebSocket updates (simple request-response is sufficient)
- Multi-reviewer support (single reviewer per feedback round)
- Persistent feedback database (file-based JSON per session)

## Decisions

### 1. Multi-run report data model

`proofrun report --change <name>` finds all sessions where `state.change_name === name`, ordered chronologically. Each session becomes a "run".

Report data structure:
```json
{
  "change_name": "ai-feedback-sound-detail",
  "runs": [
    {
      "run_number": 1,
      "session_id": "20260317024438-ciieof",
      "reason": null,
      "started_at": "...",
      "criteria": [...],
      "prerequisites": [...],
      "general_entries": []
    },
    {
      "run_number": 2,
      "session_id": "20260317041442-avau67",
      "reason": "fix card-tap-opens-respell",
      "started_at": "...",
      "criteria": [...],
      "prerequisites": [...],
      "general_entries": []
    }
  ],
  "latest_run": 2,
  "generated_at": "..."
}
```

Each run's criteria array includes both re-verified criteria (with fresh evidence) and carried criteria (with a `carry` evidence entry referencing the prior run).

For backward compatibility with single-session reports, if only one session exists for the change, the report still works (one tab, no carry logic).

The `--change` flag becomes the primary way to generate reports. The `--session` flag still works for single-session reports.

### 2. `--reason` flag on session start

```bash
proofrun session start --change <name> --device <id> [--reason <text>]
```

The `--reason` is stored in `state.json` as `reason: "fix card-tap-opens-respell"`. It's used as the tab label in the multi-run report. For the first run, `reason` is `null` and the tab shows "Run #1 (Initial)".

Implementation in `src/commands/session.js`: add optional `--reason` to the start command, store in session state.

### 3. `proofrun carry` command

```bash
proofrun carry --criterion <name> --reason <text>
```

Records a `type: "carry"` evidence entry:
```json
{
  "type": "carry",
  "criterion": "chevron-visible",
  "reason": "No code changes affect chevron rendering",
  "carried_from_session": "20260317024438-ciieof",
  "carried_from_run": 1,
  "id": 2,
  "timestamp": "..."
}
```

The `carried_from_session` and `carried_from_run` are auto-detected: the CLI finds the most recent stopped session with the same change name and looks up that criterion's judgment.

If the criterion doesn't exist in the prior session, error: "Criterion 'X' not found in prior run."

Implementation: `src/commands/carry.js`. Requires active session. Looks up prior sessions by change name.

### 4. Carryover + approval logic in report

For the latest run tab, each criterion is classified:

| State | Badge | Approval |
|-------|-------|----------|
| Re-verified (new evidence in this run) | "Re-verified" blue badge | Empty (needs review) |
| Carried (carry entry in this run) | "Carried from Run #N" gray badge + reason | Inherits prior approval |
| New (first appearance) | "New" purple badge | Empty (needs review) |

If a criterion was carried AND was approved in the prior run's feedback, the approval auto-carries. If it was rejected or pending, it stays empty.

The prior run's feedback is read from `feedback.json` in that session's directory (written by the serve command).

### 5. `proofrun serve` command

```bash
proofrun serve --change <name> [--port <port>] [--timeout <minutes>]
```

Implementation in `src/commands/serve.js` using `node:http`:

**Routes:**
- `GET /` — serves the report HTML (generated dynamically from sessions)
- `GET /report-data.js` — serves `const REPORT_DATA = {...};` as JS (easier than template injection for serve mode)
- `POST /feedback` — receives feedback JSON body, writes to latest session's `feedback.json`, responds 200, sets a shutdown flag
- `POST /lgtm` — shorthand: writes feedback with all criteria accepted, responds 200, sets shutdown flag

**Lifecycle:**
1. Starts HTTP server on specified or random available port
2. Prints `Serving report at http://localhost:PORT`
3. Writes PID to `.proofrun/serve.pid`
4. Blocks (stays running) until:
   - POST /feedback or POST /lgtm received → write feedback, print summary, exit 0
   - Timeout reached → print timeout message, exit 1
   - SIGTERM received → clean exit
5. On exit: removes `.proofrun/serve.pid`

**Serve mode detection in report HTML:**
The report HTML checks if `SERVE_MODE` is defined (injected by serve). In serve mode:
- "Submit Feedback" button POSTs to `/feedback`
- "LGTM" button POSTs to `/lgtm`
- After submission: buttons disable, show "Feedback Submitted" / "LGTM-ed"
- Confirmation text: "Agent has been notified and will begin addressing your feedback."

When not in serve mode (static file), feedback buttons are hidden entirely.

### 6. `proofrun serve --stop`

Reads `.proofrun/serve.pid`, sends SIGTERM to the process, removes the PID file. If no serve process is running, prints a message and exits cleanly.

### 7. Top-level comment box

The report has a textarea above the criteria list for general reviewer comments (e.g., "must re-verify everything", "looks good overall but check performance"). This is included in the feedback JSON as `top_level_comment`.

### 8. Button state machine

```
State: INITIAL (serve mode, no feedback actions taken)
  [LGTM] enabled
  [Submit Feedback] enabled

State: HAS_REJECTIONS (any criterion rejected or has non-approval comment)
  [LGTM] disabled — tooltip: "Resolve rejections or submit feedback with comments"
  [Submit Feedback] enabled

State: ALL_APPROVED (all criteria accepted/carried, no rejection comments)
  [LGTM] enabled
  [Submit Feedback] enabled (equivalent to LGTM)

State: SUBMITTED
  [LGTM-ed] or [Feedback Submitted] — both disabled
  Confirmation message shown
  Page stays visible (static read-only)

State: STATIC (file:/// mode)
  No feedback buttons shown
```

### 9. Feedback JSON format

```json
{
  "session_id": "20260317041442-avau67",
  "run_number": 2,
  "change_name": "ai-feedback-sound-detail",
  "reviewed_at": "2026-03-17T05:00:00Z",
  "top_level_comment": "Looks good, just fix the animation",
  "lgtm": false,
  "criteria": [
    {
      "criterion": "chevron-visible",
      "source": "carried",
      "review_status": "accepted",
      "comment": null
    },
    {
      "criterion": "card-tap-opens-respell",
      "source": "re-verified",
      "review_status": "rejected",
      "comment": "animation is janky"
    }
  ],
  "summary": {
    "accepted": 4,
    "rejected": 1,
    "pending": 0
  }
}
```

For LGTM: `lgtm: true` and all criteria have `review_status: "accepted"`.

## Risks / Trade-offs

**Report HTML complexity increases significantly**: The multi-run tab UI, carry badges, button state machine, and serve mode detection add substantial JS. Mitigated by keeping the code in a single file (no build step) and using simple vanilla JS patterns.

**Session lookup by change name could be slow**: If many sessions exist, scanning all of them is O(n). Acceptable for expected usage (dozens of sessions, not thousands).

**Port conflicts**: Random port selection could fail. Mitigated by retrying a few times or letting the user specify `--port`.

**Orphan serve process**: If agent crashes, serve process stays running. Mitigated by timeout (default 30 min) and `serve --stop`.
