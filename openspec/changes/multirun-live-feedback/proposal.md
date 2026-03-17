## Why

When verification reveals issues, the human-agent feedback loop is broken: the agent generates a new "v2" report that loses all context from the first run — previously approved criteria, reviewer comments, and the narrative of what changed. The human must re-review everything from scratch. Additionally, the feedback export workflow requires manual steps (export JSON, tell agent the file path) that slow down iteration.

A multi-run report with a live feedback server creates a tight, automated feedback loop: one persistent report accumulates verification runs, carries forward approvals, highlights what changed, and the human submits feedback directly through the browser — the agent is automatically notified and begins addressing it.

## What Changes

- **Multi-run reports**: `proofrun report --change <name>` collects ALL sessions with that change name, generates a tabbed report showing each run. Criteria carry forward with approval status from prior runs.
- **`--reason` flag**: `session start` accepts `--reason` for follow-up runs, displayed as the tab label.
- **`proofrun carry` command**: Explicitly carry forward a criterion from a prior run with a reason, creating an auditable trail.
- **`proofrun serve` command**: Lightweight HTTP server serves the report and receives feedback via POST. Blocks until feedback submitted. Agent runs it in background and is notified on completion.
- **`proofrun serve --stop`**: Kill a running serve process.
- **Report UI overhaul**: Run tabs, carried/re-verified badges, LGTM button, Submit Feedback button, top-level comment box, button state machine.

## Capabilities

### New Capabilities
- `multi-run-report`: Report generation aggregating multiple sessions by change name, with run tabs and criteria carryover logic.
- `carry-command`: CLI command to explicitly carry forward a criterion from a prior run with a justification.
- `feedback-server`: HTTP server command that serves the report and receives feedback, enabling automated agent notification.

### Modified Capabilities

## Impact

- `src/commands/session.js` — add optional `--reason` flag to `session start`
- `src/commands/report.js` — rewrite to aggregate sessions by change name, produce multi-run data
- `src/commands/serve.js` — new command: HTTP server for report + feedback
- `src/commands/carry.js` — new command: carry forward criterion
- `src/cli.js` — register new commands, update help text
- `src/session.js` — helpers to find sessions by change name, new `carry` evidence type
- `templates/report.html` — major overhaul: run tabs, carry badges, serve-mode buttons, top-level comment, LGTM flow
