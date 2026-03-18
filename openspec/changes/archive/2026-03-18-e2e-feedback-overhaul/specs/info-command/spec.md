## Info Command

### Requirements

1. `proofrun info` returns project readiness information: config values, knowledge topics list, lock state, active session, and diagnostic checks
2. Plain text output by default, `--json` for structured output
3. Diagnostic checks include: config valid, knowledge dir exists, lock dir exists
4. Replaces the orientation role of `context` command (which is removed)
5. `proofrun doctor` is kept as a separate focused diagnostic command
