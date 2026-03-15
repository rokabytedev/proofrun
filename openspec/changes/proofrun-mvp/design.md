## Context

AI agents (Claude Code, Codex, Cursor, etc.) can implement features end-to-end but have no standard way to verify their work against a running app. Existing E2E test tools (Maestro, Detox, Playwright) are designed for prescribed, scripted test flows — not for agentic, exploratory verification where the AI decides what to do next based on what it sees.

Proofrun fills this gap: a CLI + skill that gives agents a structured way to verify their work and produce evidence. It's not a test framework — it's a **verification workflow** with evidence capture and human feedback.

**Key inspiration**: Simon Willison's [Showboat](https://github.com/simonw/showboat) — which gives agents a way to prove CLI work by capturing commands + outputs in a verifiable document. Proofrun extends this concept to visual/interactive app verification.

## Goals / Non-Goals

**Goals:**
- CLI tool installable via `npm i -g proofrun` or usable via `npx proofrun`
- Agent skill installable via `npx skills add proofrun/proofrun`
- Platform presets for zero-friction onboarding (Expo, RN CLI, Next.js, Flutter)
- Resource management for concurrent agents (simulator pool, port allocation)
- Interactive HTML reports with human annotation/feedback
- Pluggable AC source adapters (OpenSpec, GitHub, markdown)
- `proofrun --help` as complete agent-readable documentation (Showboat pattern)

**Non-Goals:**
- Building a test framework (no assertions library, no test runner)
- Replacing E2E tools (Maestro, Detox, Playwright stay for regression)
- Building a simulator interaction tool (use iosef, Appium, etc.)
- Android/web support in MVP (architecture supports it, ship iOS first)
- CI/CD integration (local development only for MVP)
- Cloud/remote execution

## Decisions

### D1: Node.js CLI with `bin` field for npx support

**Choice:** Implement the CLI in Node.js with a `#!/usr/bin/env node` entry point.

**Why:** The target audience (React Native, Expo, Next.js developers) already has Node.js. npm/npx distribution is the lowest friction install path. The skill ecosystem (`npx skills add`) is also npm-based.

**Alternatives considered:**
- Go binary (like Showboat): Faster, but requires separate distribution, can't leverage npm ecosystem
- Python: Less common in the RN/Expo ecosystem
- Shell scripts: Not portable enough, hard to maintain

### D2: Two-level initialization — project init vs. session start

**Choice:** Separate `proofrun init` (once per project, creates config) from `proofrun session start` (once per verification run, acquires resources).

```
proofrun init --preset expo          # Project-level, creates proofrun.config.yaml
proofrun session start --change X    # Run-level, acquires simulator + port
```

**Why:** Project config rarely changes. Session resources are ephemeral. Mixing them creates confusion about what's persistent vs. transient.

### D3: Preset-driven config with agent scanning

**Choice:** `proofrun init --preset <name>` fills in 90%+ of config from a preset template. The agent scans the project to determine which preset to use and fills in project-specific values (bundle ID, etc.).

**Presets define:**
```yaml
# presets/expo.yaml
dev_server:
  start: "npx expo start --port {{port}}"
  ready_signal: "Bundling complete"
  health_check: "curl -s http://localhost:{{port}}"
interaction:
  tool: iosef
  element_strategy: identifier
  testid_attribute: testID
```

**Why:** A raw config YAML is adoption poison. Presets reduce "getting started" to one command. The agent handles the scanning/preset-selection — no `--auto` flag needed because the agent IS the auto.

### D4: flock-based resource locking

**Choice:** Use kernel-level `flock` for simulator and port locks. Lock files live in `.proofrun/locks/` within the project directory.

**Why flock over file-based PID locks:**
- Kernel auto-releases when process dies — no stale lock problem
- Atomic — no race conditions
- `brew install flock` on macOS (or use Node.js `fs.flock` binding)
- Timeout support via `flock --timeout`

**Lock structure:**
```
.proofrun/
├── locks/
│   ├── sim-0.lock      # flock'd by owning process
│   ├── sim-1.lock
│   ├── sim-2.lock
│   ├── sim-3.lock
│   └── sim-4.lock
│   ├── port-8090.lock
│   └── port-8091.lock
├── sessions/
│   └── <session-id>/   # Evidence for current session
└── reports/
    └── <date>-<change>.html
```

**Proactive release:** `proofrun session stop` releases all locks. The skill instructs the agent to always call this on completion. If the process crashes, flock auto-releases.

### D5: Explore-then-document evidence model

**Choice:** The agent explores freely with the simulator tool (iosef), then records the clean verification path using proofrun commands.

**Why:** Agent exploration is messy — wrong taps, dead ends, backtracking. The report should capture the **clean path** (proof), not the exploration journey. The agent calls `proofrun step/screenshot/judge` only after confirming an AC passes.

**Workflow per AC:**
```
1. Agent reads AC + relevant app specs
2. Agent uses iosef to explore (not recorded)
3. Agent finds the verification path
4. Agent records clean steps:
   proofrun step "Navigate to Library tab" --ac 1
   proofrun screenshot <path> --ac 1
   proofrun judge --ac 1 --pass "Search bar at (398,98)"
5. If AC fails, agent attempts fix (max 2 retries)
```

### D6: Interactive HTML report with feedback loop

**Choice:** Generate a self-contained HTML file with embedded base64 screenshots, per-AC controls, and annotation capability.

**Report features:**
- Summary table (verified / failed / human-required counts)
- Per-AC sections with: criterion text, agent reasoning, screenshot evidence, iosef commands used
- Interactive controls: Accept / Reject / Comment per AC
- Screenshot annotation: draw circles, arrows, text on screenshots
- Export feedback as JSON sidecar file
- Vanilla JS — no build step, no framework dependencies

**Feedback loop:**
```
Agent generates report → Human opens in browser → Human annotates/comments
→ Feedback saved as JSON → Agent reads feedback → Addresses issues → Re-verifies
```

**Why HTML over markdown:** Markdown can't do interactive annotations, accept/reject buttons, or canvas drawing. HTML is self-contained and opens in any browser.

### D7: AC source adapter architecture

**Choice:** Pluggable adapters for reading acceptance criteria from different sources.

**MVP adapters:**
- `openspec`: Reads from `openspec/changes/<name>/` (proposal, design, specs, tasks)
- `markdown`: Reads from a user-specified markdown file
- `manual`: Agent extracts ACs from conversation context (no file source)

**Future adapters:**
- `github`: Read from GitHub issues/PRs
- `linear`: Read from Linear tickets
- `jira`: Read from Jira tickets

**App knowledge (separate from ACs):**
The agent also needs to understand how the app works (navigation, screen states, element visibility). This comes from:
- OpenSpec specs: `openspec list --specs` → agent picks relevant ones → reads them
- Project docs: README, CLAUDE.md, etc.
- The skill instructs the agent to scan for app knowledge before verifying

### D8: Skill + --help division of responsibility

**Choice:** The skill teaches workflow and judgment. `--help` teaches CLI mechanics.

**Skill (SKILL.md):**
- When to trigger proofrun
- How to read ACs and app knowledge
- How to classify ACs (boundaries)
- How to explore vs. document
- How to handle human feedback
- "Run `npx proofrun --help` for command reference"

**--help:**
- Exact commands, flags, arguments
- Exit codes
- Examples
- Pure reference, no workflow guidance

**Why:** Follows Showboat's proven pattern. The skill is the "onboarding guide," --help is the "reference manual."

### D9: Repo structure — npm package + skills.sh compatible

**Choice:** Single repo that publishes as both an npm CLI package and a skills.sh skill.

```
proofrun/
├── package.json          # "bin": { "proofrun": "./bin/proofrun.js" }
├── bin/
│   └── proofrun.js       # #!/usr/bin/env node
├── src/                  # CLI implementation
├── skills/               # ← skills.sh auto-discovers this
│   └── proofrun/
│       ├── SKILL.md
│       └── references/
│           └── boundaries-template.md
├── presets/               # Platform presets
├── templates/             # HTML report template
└── examples/
```

**Install paths:**
```bash
npx skills add proofrun/proofrun -g  # Installs skill (agent learns workflow)
# Agent then uses `npx proofrun` for CLI commands (npx handles on-demand install)
```

## Risks / Trade-offs

### [flock availability on macOS] → Mitigation: ship fallback

`flock` is not built into macOS — requires `brew install flock`. **Mitigation:** Check for flock at startup. If not available, fall back to Node.js `proper-lockfile` npm package (cross-platform, handles stale locks). Document the flock recommendation in `proofrun doctor`.

### [iosef dependency] → Mitigation: adapter architecture

Proofrun doesn't bundle iosef — it's a separate install. If iosef has issues, users are blocked. **Mitigation:** The interaction tool is configurable. Future adapters could use Appium, Playwright, or raw `xcrun simctl`. The skill instructs the agent to check for the tool and install if missing.

### [HTML report complexity] → Mitigation: start simple, iterate

Interactive annotations, canvas drawing, feedback export — this is a lot of frontend. **Mitigation:** MVP report is static HTML with embedded screenshots and basic accept/reject buttons. Canvas annotation comes later. The report template is a single HTML file with vanilla JS — no build step.

### [Config drift across presets] → Mitigation: version presets

As platforms evolve (Expo SDK updates, new Metro flags), presets can drift. **Mitigation:** Version presets alongside the CLI. `proofrun doctor` checks for outdated config patterns.

## Open Questions

1. **GitHub org/user for publishing** — `proofrun/proofrun`? Or personal account initially?
2. **Minimum viable presets** — Ship with Expo only for MVP, or include React Native CLI too?
3. **Report feedback format** — JSON sidecar file vs. embedded in the HTML vs. both?
4. **Showboat interop** — Should proofrun optionally output Showboat-compatible markdown alongside HTML?
