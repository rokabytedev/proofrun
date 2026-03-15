# proofrun

CLI tool and agent skill for AI verification workflows. Gives AI agents a structured way to verify their implementation by interacting with a running app in a simulator, capturing screenshot evidence, and generating interactive HTML reports for human review.

## Install

```bash
# Use via npx (no install needed)
npx proofrun --help

# Or install globally
npm i -g proofrun

# Install the agent skill
npx skills add rokabytedev/proofrun -g
```

## Quick Start

```bash
# 1. Initialize in your project
npx proofrun init --preset expo

# 2. Review and fill in .proofrun/config.yaml (bundle ID, etc.)

# 3. Check environment
npx proofrun doctor

# 4. Start a verification session
npx proofrun session start --change my-feature

# 5. Record evidence (agent does this)
npx proofrun step "Navigate to Library tab" --ac 1
npx proofrun screenshot /tmp/screen.jpeg --ac 1
npx proofrun judge --ac 1 --pass "Search bar visible at expected position"

# 6. Generate report
npx proofrun report --open

# 7. Stop session (releases resources)
npx proofrun session stop
```

## How It Works

1. **Agent implements a feature** using its normal workflow
2. **Agent starts a proofrun session** — acquires a simulator slot and dev server port
3. **Agent explores the app** using a simulator interaction tool (e.g., iosef)
4. **Agent records clean evidence** — steps, screenshots, pass/fail judgments per acceptance criterion
5. **proofrun generates an interactive HTML report** with embedded screenshots
6. **Human reviews the report** — accepts/rejects each AC, adds comments
7. **Agent reads feedback** and addresses rejections

## Commands

| Command | Description |
|---------|-------------|
| `proofrun init --preset <name>` | Initialize config from a platform preset |
| `proofrun doctor` | Check environment readiness |
| `proofrun session start --change <name>` | Start verification session |
| `proofrun session stop` | Stop session, release resources |
| `proofrun session status` | Show active session info |
| `proofrun context <change>` | Get context instructions for a change |
| `proofrun step <desc> [--ac N]` | Record a verification step |
| `proofrun screenshot <file> [--ac N]` | Attach a screenshot |
| `proofrun judge --ac N --pass\|--fail\|--human <reason>` | Record judgment |
| `proofrun note <text>` | Add a freeform note |
| `proofrun evidence` | Show evidence summary |
| `proofrun fix --ac N --description <text>` | Record a code fix |
| `proofrun report [--open]` | Generate HTML report |

## License

MIT
