# proofrun

AI agent verification CLI for mobile apps. Gives AI agents a structured way to verify app behavior by interacting with a running app in a simulator or emulator, capturing screenshot evidence, and generating interactive HTML reports for human review.

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
npx proofrun init

# 2. Check project readiness
npx proofrun info

# 3. Read and fill in knowledge file placeholders
npx proofrun knowledge --list

# 4. Start a verification session
npx proofrun session start --change my-feature --device <identifier>

# 5. Record evidence (agent does this)
npx proofrun step "Navigate to Library tab" --criterion library-search
npx proofrun screenshot /tmp/screen.jpeg --criterion library-search
npx proofrun judge --criterion library-search --pass "Search bar visible at expected position"

# 6. Generate report
npx proofrun report --open

# 7. Stop session (releases device lock)
npx proofrun session stop
```

## How It Works

1. **Agent implements a feature** using its normal workflow
2. **Agent starts a proofrun session** — locks a device for exclusive use
3. **Agent explores the app** using a platform interaction tool (e.g., agent-device for iOS/Android, agent-browser for web)
4. **Agent records clean evidence** — steps, screenshots, pass/fail judgments per criterion
5. **proofrun generates an interactive HTML report** with embedded screenshots
6. **Human reviews the report** — accepts/rejects each criterion, adds comments
7. **Agent reads feedback** and addresses rejections

## Commands

| Command | Description |
|---------|-------------|
| `proofrun init` | Initialize config and knowledge templates |
| `proofrun doctor` | Check environment readiness |
| `proofrun info` | Project readiness: config, knowledge, session, diagnostics |
| `proofrun session start --change <name> --device <id>` | Start verification session |
| `proofrun session stop` | Stop session, release device lock |
| `proofrun session status` | Show active session info |
| `proofrun step <desc> [--criterion <name>]` | Record a verification step |
| `proofrun screenshot <file> [--criterion <name>]` | Attach a screenshot |
| `proofrun judge --criterion <name> --pass\|--fail\|--human <reason>` | Record judgment |
| `proofrun note <text>` | Add a freeform note |
| `proofrun fix --criterion <name> --description <text>` | Record a code fix |
| `proofrun evidence` | Show evidence summary |
| `proofrun knowledge [topic]` | Read knowledge files |
| `proofrun report [--open]` | Generate HTML report |

## License

MIT
