---
name: Dev Server
description: How to start, monitor, and stop the React Native CLI dev server. Read when starting a verification session.
---

## How to Start

Run the Metro bundler with the allocated port:
```
npx react-native start --port <port>
```

Run in background and capture output. Watch stdout/stderr for the ready signal.

## Ready Signal

The server is ready when you see **"Ready"** in the output.

## How to Monitor

Watch the process output for errors. Common issues:
- "Port already in use" — the allocated port is occupied
- Build errors in Metro output
- Metro crash — restart the server

## How to Stop

Kill the process (SIGTERM). Metro shuts down cleanly.

<!-- Agent: add project-specific dev server notes below -->
