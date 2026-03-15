## 1. Project Scaffolding

- [ ] 1.1 Set up package.json with `bin` field pointing to `bin/proofrun.js`, set name/version/description/license/keywords
- [ ] 1.2 Create `bin/proofrun.js` with `#!/usr/bin/env node` shebang and basic command routing (using a lightweight CLI framework like `commander` or `yargs`)
- [ ] 1.3 Create `skills/proofrun/SKILL.md` with frontmatter (name, description) and placeholder workflow
- [ ] 1.4 Create `skills/proofrun/references/boundaries-template.md` with default can/cannot verify tables
- [ ] 1.5 Create `.gitignore` (node_modules, .proofrun/, dist/)
- [ ] 1.6 Create README.md with project overview, install instructions, and quick start
- [ ] 1.7 Create LICENSE (MIT)

## 2. Config & Init System

- [ ] 2.1 Define `proofrun.config.yaml` schema — all fields with types, defaults, and descriptions
- [ ] 2.2 Create preset templates: `presets/expo.yaml`, `presets/react-native-cli.yaml`
- [ ] 2.3 Implement `proofrun init --preset <name>` — copy preset, auto-detect bundle ID from project files (app.json, app.config.js), prompt for missing values
- [ ] 2.4 Implement config loading — search current dir and parents for `proofrun.config.yaml`, parse and validate
- [ ] 2.5 Implement `proofrun doctor` — check for config, simulator tool (iosef), flock availability, dev server command

## 3. Session Management & Locking

- [ ] 3.1 Implement `.proofrun/locks/` directory initialization — create lock files for configured simulator pool and port range
- [ ] 3.2 Implement flock-based simulator lock acquisition — iterate slots, try exclusive flock, return first available. Fall back to `proper-lockfile` npm package if flock not available.
- [ ] 3.3 Implement flock-based port lock acquisition — iterate port range, check `lsof`, flock the lock file
- [ ] 3.4 Implement `proofrun session start --change <name>` — acquire simulator + port, start dev server (spawn with stdout piped to log file), wait for ready signal, save session state to `.proofrun/sessions/<id>/state.json`
- [ ] 3.5 Implement `proofrun session stop` — kill dev server process, release all flock locks, update session state
- [ ] 3.6 Implement `proofrun session status` — show active session info or pool availability

## 4. Evidence Capture

- [ ] 4.1 Implement `proofrun step <description> [--ac <n>]` — append step entry to `.proofrun/sessions/<id>/evidence.json`
- [ ] 4.2 Implement `proofrun screenshot <file> [--ac <n>] [--note <text>]` — copy image to session screenshots dir, append reference to evidence log
- [ ] 4.3 Implement `proofrun judge --ac <n> --pass|--fail|--human <reasoning>` — record judgment in evidence log, replace previous judgment for same AC
- [ ] 4.4 Implement `proofrun note <text>` — append freeform note to evidence log
- [ ] 4.5 Implement `proofrun criteria <change-name>` — read change artifacts from configured source, output numbered AC list (MVP: OpenSpec adapter reads proposal + tasks + specs)

## 5. Report Generation

- [ ] 5.1 Create HTML report template (`templates/report.html`) — vanilla HTML/CSS/JS, responsive layout, no build step
- [ ] 5.2 Implement summary section — change name, date, device, AC counts by status
- [ ] 5.3 Implement per-AC sections — criterion text, status badge, reasoning, screenshots (base64 inline), steps, commands
- [ ] 5.4 Implement interactive controls — accept/reject buttons per AC, comment textarea, visual state feedback
- [ ] 5.5 Implement screenshot viewer — click to zoom, basic pan
- [ ] 5.6 Implement feedback export — "Export Feedback" button generates JSON download with per-AC status/comments
- [ ] 5.7 Implement localStorage persistence — save feedback state, restore on re-open
- [ ] 5.8 Implement `proofrun report [--output <path>] [--open]` — read evidence.json, render HTML template with data, write to `.proofrun/reports/`, optionally open in browser

## 6. Help System

- [ ] 6.1 Implement `proofrun --help` with full command reference following Showboat pattern — overview, getting started, all subcommands with syntax, exit codes, examples
- [ ] 6.2 Implement per-command `--help` (e.g., `proofrun session start --help`) with detailed argument descriptions

## 7. Agent Skill

- [ ] 7.1 Write SKILL.md — verification workflow instructions: trigger conditions, AC extraction, app knowledge discovery (spec scanning), explore-then-document pattern, evidence recording, report generation, human feedback handling, prerequisite checking
- [ ] 7.2 Write boundaries-template.md — default tables for agent-verifiable (element visibility, navigation, text, forms, gestures, state persistence) and human-required (audio, haptics, performance, real-device, VoiceOver) with classification guidelines

## 8. Validation

- [ ] 8.1 Test `proofrun init --preset expo` against a real Expo project (the Accent app) — verify config is generated correctly with auto-detected bundle ID
- [ ] 8.2 Test `proofrun session start` — verify simulator lock acquired, port locked, dev server started, session state saved
- [ ] 8.3 Test evidence capture flow — `step`, `screenshot`, `judge` commands produce valid evidence.json
- [ ] 8.4 Test `proofrun report` — verify HTML is generated, screenshots embedded, report opens in browser
- [ ] 8.5 Test `proofrun session stop` — verify locks released, dev server stopped
- [ ] 8.6 Test concurrent sessions — two agents acquiring different simulator slots simultaneously
- [ ] 8.7 Publish to npm (`npm publish`) and verify `npx proofrun --help` works
- [ ] 8.8 Publish skill and verify `npx skills add proofrun/proofrun -g` installs correctly
