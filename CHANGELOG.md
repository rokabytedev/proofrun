# Changelog

## [0.3.1](https://github.com/rokabytedev/proofrun/compare/proofrun-v0.3.0...proofrun-v0.3.1) (2026-03-20)


### Bug Fixes

* scope skills install path to avoid discovering internal skills ([7645f1b](https://github.com/rokabytedev/proofrun/commit/7645f1be8f83badbc7bda0313566b78a5579b350))

## [0.3.0](https://github.com/rokabytedev/proofrun/compare/proofrun-v0.2.0...proofrun-v0.3.0) (2026-03-19)


### Features

* add CLI output protocol, config schema, and context command design ([3c6b447](https://github.com/rokabytedev/proofrun/commit/3c6b447404f5a041f03db9f5661c5e2df44b486f))
* config validation, crash recovery, and automated test suite ([2fd87ae](https://github.com/rokabytedev/proofrun/commit/2fd87aecf65d54ca968c6e5200ef0ad1e492a176))
* global device locking, device status command, skill workflow polish ([642629b](https://github.com/rokabytedev/proofrun/commit/642629b71dae8c73fb788c895cf892c9734071ca))
* implement proofrun CLI with all core commands ([a24f34c](https://github.com/rokabytedev/proofrun/commit/a24f34c772ca76ad3733a9a07124427dd6787af2))
* info command, environment knowledge, SKILL.md rewrite ([c067758](https://github.com/rokabytedev/proofrun/commit/c0677580ca1fa3cc61ff13d9bede6c3138977aa6))
* knowledge base redesign — separate config from agent knowledge ([c99bc16](https://github.com/rokabytedev/proofrun/commit/c99bc16cb3783c61a8330e80657adc942f728987))
* multi-run reports, carry command, and live feedback server ([e631e7b](https://github.com/rokabytedev/proofrun/commit/e631e7b73c21fbd26d6d148de328e2f89d2833a8))
* prerequisite command, skill hardening, knowledge template improvements ([1b0a7e6](https://github.com/rokabytedev/proofrun/commit/1b0a7e6d5273f0d6819721276b1fb11124abb976))
* replace iosef with agent-device/agent-browser for multi-platform interaction ([47c143c](https://github.com/rokabytedev/proofrun/commit/47c143cae399cd6d925220c31f2f162e551103cc))
* support free-form verification without change artifacts ([9371f8c](https://github.com/rokabytedev/proofrun/commit/9371f8c4a387ed78724add88f83d0d1e5e848c07))
* verification plan command and CLI guardrails ([a7968d6](https://github.com/rokabytedev/proofrun/commit/a7968d6e2a638df37b429b681977714ae00889dc))


### Bug Fixes

* address code review findings — input validation and simulator polling ([6e355d4](https://github.com/rokabytedev/proofrun/commit/6e355d489ba56ee9bb1e0651e8bd7ac22a6bbfa0))
* process group kill, lock ownership transfer, error handling ([7a7f2a7](https://github.com/rokabytedev/proofrun/commit/7a7f2a7ac51193da613659fe5a0169bf81454d08))
* report template renders empty due to stray null in REPORT_DATA ([51ba72e](https://github.com/rokabytedev/proofrun/commit/51ba72e3edb5c825578486ffdf9613df861e5a39))
* resolve session crash and report template bugs ([3dfa9c3](https://github.com/rokabytedev/proofrun/commit/3dfa9c3ebb364d1bc590290065da5798a3ead343))

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
