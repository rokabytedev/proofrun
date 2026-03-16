---
name: Environment Setup
description: How to build, install, and run the app for verification.
  Read when setting up the test environment.
---

## Project Structure
<!-- Agent: is this a monorepo? Where is the app directory? -->

## Build & Install
<!-- Agent: what command builds and installs the app on the simulator?
     For Expo: `npx expo run:ios --device <UDID>` or `npx expo run:ios --simulator <name>`?
     Does it need to be built fresh, or can a dev build be reused? -->

## Dev Server (if applicable)
<!-- Agent: does this project use a dev server (Metro)?
     Start command: `npx expo start --port <port>`
     Ready signal: "Bundling complete" in stdout
     Typical startup: ~8 seconds cold, ~3 seconds warm
     Health check: `curl -s http://localhost:<port>` -->

## Connection
<!-- Agent: how does the app connect to the dev server?
     URL scheme? Auto-discovery? Manual entry in developer menu?
     Record the exact connection method here. -->
