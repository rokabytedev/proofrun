## 1. Simulator → Device Rename

- [x] 1.1 Rename `--simulator <UDID>` to `--device <identifier>` in `src/commands/session.js` (session start command definition)
- [x] 1.2 Update session state field from `simulator` to `device` in `src/commands/session.js` (start, stop, status actions)
- [x] 1.3 Update lock resource prefix from `sim-` to `dev-` in `src/commands/session.js` (start and stop actions)
- [x] 1.4 Rename `simulatorUdid` parameter to `deviceId` in `src/session.js` `initEvidence()` and update evidence JSON field from `simulator` to `device`
- [x] 1.5 Update `src/commands/info.js` — session display field from `simulator` to `device`, locks line from `simulator(s)` to `device(s)`
- [x] 1.6 Update `templates/report.html` — replace all `simulator` references with `device` in HTML/JS
- [x] 1.7 Update `src/cli.js` extended help text — replace `--simulator` with `--device` in examples
- [x] 1.8 Update `src/session.test.js` — all `simulator` field references in test fixtures and assertions
- [x] 1.9 Update `src/commands/report.test.js` — all `simulator` references in test fixtures
- [x] 1.10 Update `src/config.test.js` — no changes needed (existing `config.simulator` undefined check is a removed-fields guard, still valid)
- [x] 1.11 Run full test suite, verify all tests pass

## 2. Remove Presets, Create Generic Templates

- [x] 2.1 Create `templates/config.toml` — copy from `presets/expo/config.toml` (configs are identical), remove preset comment line
- [x] 2.2 Create `templates/knowledge/environment.md` — generic template with agent discovery instructions, no framework assumptions, sections for Project Structure, Build & Install, Dev Server, Connection
- [x] 2.3 Create `templates/knowledge/simulators.md` — three pre-created platform sections (iOS Simulator with iosef recommendation, Android Emulator with TBD note, Mobile Web with TBD note), each with agent fill-in placeholders
- [x] 2.4 Create `templates/knowledge/interaction.md` — per-platform sections (iOS/Android/Web), recommended tools per platform, placeholders for project-specific patterns
- [x] 2.5 Create `templates/knowledge/boundaries.md` — based on current content but with generic terms (no iOS-specific framing)
- [x] 2.6 Create `templates/knowledge/context.md` — based on current content (already generic)
- [x] 2.7 Delete `presets/` directory entirely

## 3. Update Init Command

- [x] 3.1 Rewrite `src/commands/init.js` — remove `--preset` flag, remove preset directory resolution, point to `templates/` directory at `resolve(__dirname, '../../templates')`, update success output to remove preset reference
- [x] 3.2 Update `requireConfig()` error message in `src/config.js` — change from `Run \`proofrun init --preset <name>\` first.` to `Run \`proofrun init\` first.`
- [x] 3.3 Update `src/cli.js` extended help text — remove `--preset` from init example, update presets section (already done in task 1.7)
- [x] 3.4 Run full test suite, verify all tests pass

## 4. Rewrite SKILL.md

- [x] 4.1 Write new `skills/proofrun/SKILL.md` following section order: (1) Identity — proof-of-work framing for mobile app verification, (2) When to Trigger, (3) Getting Started — `proofrun info` driven, no manual config checks, (4) Workflow — condensed, platform-agnostic, references knowledge files for platform specifics, (5) Principles — including knowledge update principle moved here, (6) Knowledge Management, (7) Human Feedback

## 5. Update Remaining References

- [x] 5.1 Update `README.md` — replace `--preset` and `--simulator` references, update examples
- [x] 5.2 Update `package.json` — remove `presets/` from files array, replace `simulator` keyword with `mobile`
- [x] 5.3 Update `src/commands/doctor.js` and `info.js` — replace `--preset <name>` references in error messages
- [x] 5.4 Run full test suite one final time, verify everything passes
