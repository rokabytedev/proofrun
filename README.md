[![npm version](https://img.shields.io/npm/v/proofrun)](https://www.npmjs.com/package/proofrun)
[![CI](https://github.com/rokabytedev/proofrun/actions/workflows/ci.yml/badge.svg)](https://github.com/rokabytedev/proofrun/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)

# proofrun

Teach your coding agent to prove its own work.

Works with agent tools:

[![iOS](https://img.shields.io/badge/iOS-Simulator-000000?logo=apple)](https://github.com/callstackincubator/agent-device) [![Android](https://img.shields.io/badge/Android-Emulator-3DDC84?logo=android&logoColor=white)](https://github.com/callstackincubator/agent-device) [![Web](https://img.shields.io/badge/Web-Browser-4285F4?logo=googlechrome&logoColor=white)](https://github.com/vercel-labs/agent-browser)

## The Problem

Your coding agent says "implementation complete, all tests passing." You open the app — and it's not what you expected. The search bar is in the wrong place. The button doesn't do anything. The screen is half-translated.

The agent wasn't lying. It just never looked. It wrote the code, ran the tests, and called it done — without ever seeing the app running.

Proofrun replaces guesswork with evidence. The agent actually opens your app, navigates to each screen, takes screenshots, and makes pass/fail judgments against acceptance criteria. Bugs get found and fixed before you even review. What you see is higher quality work with proof attached.

## How It Works

> **The agent is smart, the tool is dumb.** Proofrun doesn't know how to navigate your app, find bugs, or decide what "correct" looks like. Your AI agent does. Proofrun just gives the agent a structured way to capture evidence and present it for human review.

```
 You: "proofrun my changes"
  │
  ▼
 Agent locks a device ────► iOS Simulator, Android Emulator, or Browser
  │
  ▼
 Agent interacts with app ─► Navigate, tap, scroll, type
  │
  ▼
 Agent captures evidence ──► Screenshots, steps, pass/fail judgments
  │
  ▼
 Report generated ─────────► Interactive HTML with embedded screenshots
  │
  ▼
 Agent serves the report ──► Opens in your browser
  │
  ▼
 You review ───────────────► Accept/reject each criterion, leave comments, hit Submit
  │
  ▼
 Agent notified ───────────► Reads feedback, fixes rejections, re-verifies
```

The agent drives the entire workflow. Proofrun is just the evidence locker.

## Install

```bash
npx skills add rokabytedev/proofrun/skills
```

That's it. The skill teaches the agent the entire verification workflow — when to trigger, how to capture evidence, how to handle feedback. You don't need to learn the CLI commands; the agent already knows them.

## Example Usage

```bash
# Verify your current change
"proofrun my changes"

# Verify a specific feature
"proofrun the search autocomplete feature"

# Verify an OpenSpec change by name
"proofrun openspec change add-dark-mode"

# Free-form verification query
"proofrun Spanish locale has no missing translations"
```

### Integrates with spec-driven development

Proofrun pairs naturally with spec-driven workflows like [OpenSpec](https://github.com/fission-ai/openspec). After implementing a change, the agent already has the acceptance criteria from your specs and tasks — proofrun turns those criteria into verified evidence with screenshots before you archive.

To wire proofrun into your OpenSpec workflow, add this rule to the `tasks` section of your `openspec/config.yaml`:

```yaml
rules:
  tasks:
    # ... your existing task rules ...
    # Proofrun verification
    - >-
      Add a single verification task: run proofrun after all implementation
      tasks pass, using every spec scenario from this change's specs artifact
      as an individual verification criterion. Do not enumerate the scenarios
      in the task itself — just include the instruction for proofrun to do so.
```

## What the Agent Does

When triggered, the agent:

1. **Orients** — checks project readiness, reads knowledge files about your app
2. **Identifies criteria** — extracts acceptance criteria from change artifacts or specs, or breaks a free-form query into verifiable items
3. **Sets up** — boots a simulator/emulator/browser, locks the device for exclusive use
4. **Verifies each criterion** — navigates to the relevant screen, captures screenshots, records steps, makes a pass/fail judgment with reasoning
5. **Generates a report** — interactive HTML with embedded screenshots, organized by criterion
6. **Serves for feedback** — opens the report in your browser and waits for your input
7. **Addresses feedback** — gets notified automatically when you submit, reads rejections, fixes issues, re-verifies

The agent handles all of this autonomously. You just review the report.

## The Report

The agent serves the report locally and gets notified automatically when you submit feedback — no need to copy-paste comments back to the agent. Just review, leave comments, and hit Submit or LGTM.

The report includes:

- Each verification criterion listed with pass/fail status
- Embedded screenshots as evidence
- Step-by-step narrative of what the agent did
- Accept/reject buttons and comment fields for each criterion
- A submit button that notifies the agent to continue

<!-- TODO: Add screenshot of a real report and link to hosted demo -->

## CLI Reference

Under the hood, the skill uses these CLI commands. You rarely need to run them directly — the agent handles it.

| Command | Description |
|---------|-------------|
| `proofrun init` | Initialize config and knowledge templates |
| `proofrun info` | Project readiness: config, knowledge, session, diagnostics |
| `proofrun doctor` | Check environment readiness |
| `proofrun session start --change <name> --device <id>` | Start verification session |
| `proofrun session stop` | Stop session, release device lock |
| `proofrun session status` | Show active session info |
| `proofrun device status` | Check device lock status |
| `proofrun step <desc> [--criterion <name>]` | Record a verification step |
| `proofrun screenshot <file> [--criterion <name>]` | Attach a screenshot |
| `proofrun judge --criterion <name> --pass\|--fail\|--human <reason>` | Record judgment |
| `proofrun note <text>` | Add a freeform note |
| `proofrun fix --criterion <name> --description <text>` | Record a code fix |
| `proofrun prerequisite <text>` | Record a prerequisite step |
| `proofrun carry --criterion <name> --reason <text>` | Carry forward unchanged criteria |
| `proofrun plan add\|list\|check` | Manage verification plan |
| `proofrun evidence` | Show evidence summary |
| `proofrun knowledge [topic]` | Read knowledge files |
| `proofrun report [--change <name>]` | Generate HTML report |
| `proofrun serve --change <name>` | Serve report for feedback |

All commands output structured JSON (`{ok, command, data, error}`) for agent consumption, with human-friendly plain text as default.

## Philosophy

**The agent is smart, the tool is dumb.** This is a deliberate design choice.

Traditional test tools are smart — they know how to wait for elements, retry flaky assertions, generate reports from code. They have to be smart because the scripts driving them are dumb.

Proofrun inverts this. The AI agent already knows how to navigate your app, understand what "correct" looks like, and make judgment calls. It doesn't need a smart tool — it needs a *faithful* tool. One that honestly records what happened and presents it for human review.

What proofrun does:
- Manages device locks so agents don't collide
- Captures evidence (steps, screenshots, judgments) in a structured session
- Generates interactive HTML reports
- Serves reports and notifies the agent when feedback is submitted
- Carries forward unchanged criteria across verification runs

What proofrun does NOT do:
- Navigate your app
- Decide what to verify
- Make pass/fail judgments
- Retry failed checks
- Understand your UI

That's the agent's job.

## Acknowledgements

Proofrun is heavily inspired by [showboat](https://github.com/simonw/showboat) by Simon Willison — executable demo documents that prove an agent's work. Showboat showed that agents can produce reproducible proof, not just claims. Proofrun takes that idea into the world of app verification and closes the feedback loop between agent and human.

## License

[MIT](LICENSE)
