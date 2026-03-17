---
name: Environment Setup
description: How to build, install, and run the app for verification.
  Read when setting up the test environment.
---

<!-- Agent: Investigate this project to determine the build system, dev server,
     and how to install and run the app on a simulator/emulator.
     Fill in the sections below with what you discover.
     Remove platform sections that don't apply to this project. -->

## Project Structure
<!-- Agent: Is this a monorepo? Where is the app directory?
     What is the primary language/framework? -->

## Build & Install

### iOS
<!-- Agent: What command builds and installs the app on an iOS simulator?
     Does it need to be built fresh, or can a dev build be reused? -->

### Android
<!-- Agent: What command builds and installs the app on an Android emulator?
     Gradle? Flutter? Other build tool? -->

### Web
<!-- Agent: If this project has a mobile web target, how do you build and serve it? -->

## Build Verification
<!-- Agent: How do you confirm the running app includes your latest changes?
     For JS-only changes (hot reload): verify Metro is running and connected
     For native changes: you MUST rebuild and reinstall
     Record the build timestamp or version command here.
     What command shows the current build version/timestamp? -->

## Dev Server
<!-- Agent: Does this project use a dev server (Metro, Vite, webpack, etc.)?
     Start command:
     Ready signal (what stdout text indicates it's ready):
     Health check (e.g., curl command to verify it's running):
     Typical startup time: -->

## Connection
<!-- Agent: How does the app connect to the dev server?
     Auto-discovery? URL scheme? Manual entry?
     Record the exact connection method here. -->
