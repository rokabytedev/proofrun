# Changelog

## [0.2.0](https://github.com/rokabytedev/proofrun/compare/v0.1.0...v0.2.0) (2026-03-18)

### Features

* multi-platform interaction support — replace iosef with agent-device/agent-browser
* verification plan command and CLI guardrails
* global device locking, device status command, skill workflow polish
* multi-run reports, carry command, and live feedback server
* prerequisite command, skill hardening, knowledge template improvements
* info command, environment knowledge, SKILL.md rewrite
* knowledge base redesign — separate config from agent knowledge
* free-form verification without change artifacts

### Bug Fixes

* report template renders empty due to stray null in REPORT_DATA
* resolve session crash and report template bugs

### Refactoring

* platform-agnostic redesign — remove presets, rename simulator to device
* UDID-based session locking and named criteria
* plain text default output and slim config

## [0.1.0](https://github.com/rokabytedev/proofrun/commits/v0.1.0) (2026-03-18)

### Features

* implement proofrun CLI with all core commands — session management, evidence capture, report generation
* config validation, crash recovery, and automated test suite

### Bug Fixes

* process group kill, lock ownership transfer, error handling
* input validation and simulator polling fixes
