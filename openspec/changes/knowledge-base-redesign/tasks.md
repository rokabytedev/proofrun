## 1. Config Migration (YAML → TOML)

- [ ] 1.1 Replace `js-yaml` with `toml` in package.json dependencies
- [ ] 1.2 Update `src/config.js` — change `CONFIG_FILENAME` to `config.toml`, replace YAML parser with TOML parser, remove relay-only fields from validation, remove `KNOWN_TOP_LEVEL_KEYS` and `getUnknownKeys`
- [ ] 1.3 Update `src/commands/init.js` — create `config.toml` instead of `config.yaml`
- [ ] 1.4 Update `src/commands/doctor.js` — check for `config.toml`, remove interaction tool check and dev server check, remove unknown keys check
- [ ] 1.5 Update all error messages and help text that reference `config.yaml` to say `config.toml`
- [ ] 1.6 Update existing tests in `src/config.test.js` for TOML format

## 2. Presets Redesign

- [ ] 2.1 Create `presets/expo/config.toml` — slim preferences only
- [ ] 2.2 Create `presets/expo/knowledge/boundaries.md` — verification boundaries with frontmatter
- [ ] 2.3 Create `presets/expo/knowledge/dev-server.md` — Expo dev server instructions with frontmatter
- [ ] 2.4 Create `presets/expo/knowledge/interaction.md` — iosef setup, element strategy, testID patterns with frontmatter
- [ ] 2.5 Create `presets/expo/knowledge/simulators.md` — iOS simulator management with frontmatter
- [ ] 2.6 Create `presets/expo/knowledge/context.md` — OpenSpec context discovery with frontmatter
- [ ] 2.7 Create `presets/react-native-cli/` — same structure, adjusted for RN CLI
- [ ] 2.8 Remove old preset YAML files (`presets/expo.yaml`, `presets/react-native-cli.yaml`)
- [ ] 2.9 Update `src/commands/init.js` — copy preset directory (config.toml + knowledge/) instead of single YAML file

## 3. Knowledge Command

- [ ] 3.1 Create `src/commands/knowledge.js` — implement `proofrun knowledge --list` (plain text default, --json optional)
- [ ] 3.2 Implement `proofrun knowledge <topic>` — read and display file (plain text default, --json optional with frontmatter parsing)
- [ ] 3.3 Implement topic-not-found error with available topics list
- [ ] 3.4 Register knowledge command in `src/cli.js`
- [ ] 3.5 Add knowledge command to help text

## 4. Session Management Simplification

- [ ] 4.1 Update `src/commands/session.js` `start` — remove dev server spawn, ready signal wait, PID transfer. Keep: lock acquisition, session dir creation, evidence init
- [ ] 4.2 Update `src/commands/session.js` `stop` — remove dev server process kill. Keep: lock release, session state update
- [ ] 4.3 Update `src/locking.js` — change lock held files to contain session ID instead of PID, remove `transferLockPid`, update stale detection to check session age
- [ ] 4.4 Update session start output JSON — remove dev_server fields, keep session_id, port, simulator_slot
- [ ] 4.5 Update existing tests in `src/locking.test.js` and `src/session.test.js` for new lock format

## 5. Context Command Simplification

- [ ] 5.1 Rewrite `src/commands/context.js` — return config preferences + knowledge_dir path only. Remove all relay logic (buildChangeContext, buildAppKnowledge, etc.)
- [ ] 5.2 Support optional change name (echo back in response)
- [ ] 5.3 Remove `--list` flag (no longer needed — change discovery is in knowledge/context.md)

## 6. SKILL.md and Help Text

- [ ] 6.1 Rewrite `skills/proofrun/SKILL.md` — add workbook mental model, knowledge iteration workflow, update all command references
- [ ] 6.2 Update help text in `src/cli.js` — add KNOWLEDGE COMMANDS section, update CONTEXT and SESSION descriptions, remove dev server references
- [ ] 6.3 Remove `skills/proofrun/references/boundaries-template.md` (now in preset knowledge/)

## 7. Cleanup

- [ ] 7.1 Remove `js-yaml` from dependencies (replaced by `toml`)
- [ ] 7.2 Remove old `presets/expo.yaml` and `presets/react-native-cli.yaml` if not already done
- [ ] 7.3 Run all tests and fix any failures
