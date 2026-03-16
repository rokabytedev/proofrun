## Session Locking

### Requirements

1. `session start` accepts `--change <name>` (required) and `--simulator <UDID>` (required)
2. CLI locks the simulator by UDID using file-based locks — lock file named `sim-<UDID>.lock`
3. If the simulator UDID is already locked by another session, `session start` fails with a clear error identifying the blocking session
4. Session state.json stores: session_id, status, change_name, started_at, stopped_at, simulator (UDID string)
5. No port allocation or tracking — agent manages ports directly
6. Session is "active" if state.json has `status: "active"` — no PID-based liveness check
7. `session stop` releases the simulator lock and sets status to "stopped"
8. File locks are automatically released by OS if the CLI process crashes (proper-lockfile behavior)
9. Remove all pool-based allocation logic (ensureSimLockFiles, ensurePortLockFiles, acquireSimulatorSlot, acquirePort)
