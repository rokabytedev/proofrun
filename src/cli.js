import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerDoctor } from './commands/doctor.js';
import { registerSession } from './commands/session.js';
import { registerEvidence } from './commands/evidence.js';
import { registerContext } from './commands/context.js';
import { registerKnowledge } from './commands/knowledge.js';
import { registerReport } from './commands/report.js';

const HELP_TEXT = `
proofrun — AI agent verification CLI

Proofrun gives AI agents a structured way to verify app behavior,
capture evidence, and generate interactive HTML reports for human review.

SETUP COMMANDS
  proofrun init --preset <name>          Create .proofrun/ with config and knowledge
  proofrun doctor                        Check infrastructure readiness

SESSION COMMANDS
  proofrun session start --change <name> Acquire simulator slot and port
    [--timeout <seconds>]                  Max wait for resources (default: 300)
  proofrun session stop                  Release all locks, finalize session
  proofrun session status                Show active session or pool availability

CONTEXT COMMANDS
  proofrun context                       Get config preferences and knowledge path
  proofrun context <change>              Same, with change name echoed back

KNOWLEDGE COMMANDS
  proofrun knowledge --list              List available knowledge topics
  proofrun knowledge <topic>             Read a specific knowledge file
    [--json]                               Output as JSON instead of plain text

EVIDENCE COMMANDS
  proofrun step <description>            Record a verification step
    [--ac <n>]                             Associate with acceptance criterion
    [--command <cmd>]                      Command used for this step
  proofrun screenshot <file>             Attach a screenshot to evidence
    [--ac <n>]                             Associate with acceptance criterion
    [--note <text>]                        Note about the screenshot
  proofrun judge --ac <n>                Record judgment for a criterion
    --pass <reasoning>                     Mark as passed
    --fail <reasoning>                     Mark as failed
    --human <reasoning>                    Mark as requiring human verification
  proofrun note <text>                   Add freeform note to evidence log
  proofrun fix --ac <n>                  Record a code fix
    --description <text>                   Description of the fix
  proofrun evidence                      Show evidence summary for active session

REPORT COMMANDS
  proofrun report                        Generate interactive HTML report
    [--output <path>]                      Custom output path
    [--open]                               Open in browser after generation
    [--session <id>]                       Use specific session (default: active)

EXIT CODES
  0  Success
  1  Runtime error or verification failure
  2  Bad arguments or usage error

EXAMPLES
  # Initialize for an Expo project
  proofrun init --preset expo

  # Check infrastructure
  proofrun doctor

  # Browse project knowledge
  proofrun knowledge --list
  proofrun knowledge interaction

  # Start a verification session
  proofrun session start --change add-search

  # Free-form verification
  proofrun session start --change "chinese-locale-audit"

  # Record evidence
  proofrun step "Navigate to Library tab" --ac 1
  proofrun screenshot /tmp/screen.jpeg --ac 1 --note "Library screen visible"
  proofrun judge --ac 1 --pass "Search bar found at expected position"

  # Generate report and clean up
  proofrun report --open
  proofrun session stop

PRESETS
  expo               Expo managed workflow
  react-native-cli   React Native CLI

For the agent verification workflow, install the skill:
  npx skills add rokabytedev/proofrun -g
`;

export function createCli() {
  const program = new Command();

  program
    .name('proofrun')
    .description('AI agent verification CLI — capture evidence, generate reports')
    .version('0.2.0')
    .addHelpText('after', HELP_TEXT)
    .configureOutput({
      writeErr: () => {},
    })
    .exitOverride((err) => {
      if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
        process.exit(0);
      }
      console.log(JSON.stringify({ ok: false, command: null, data: null, error: err.message }));
      process.exit(2);
    });

  program.action(() => {
    program.outputHelp();
  });

  registerInit(program);
  registerDoctor(program);
  registerSession(program);
  registerEvidence(program);
  registerContext(program);
  registerKnowledge(program);
  registerReport(program);

  return program;
}
