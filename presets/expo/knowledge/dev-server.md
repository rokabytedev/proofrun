---
name: Dev Server
description: How to start, monitor, and stop the Expo dev server. Read when starting a verification session.
---

## How to Start

Run the Expo dev server with the allocated port:
```
npx expo start --port <port>
```

Run in background and capture output. Watch stdout/stderr for the ready signal.

## Ready Signal

The server is ready when you see **"Bundling complete"** in the output.
Typical startup: ~8 seconds cold, ~3 seconds warm.

## How to Monitor

Watch the process output for errors. Common issues:
- "Port already in use" — the allocated port is occupied, session start should have prevented this
- "Unable to resolve module" — build error, likely a code issue
- Metro crash — restart the server

Health check: `curl -s http://localhost:<port>` should respond when server is ready.

## How to Stop

Kill the process (SIGTERM). Expo's Metro bundler shuts down cleanly.

<!-- Agent: add project-specific dev server notes below -->
