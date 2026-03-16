import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerDoctor } from './commands/doctor.js';
import { registerSession } from './commands/session.js';
import { registerEvidence } from './commands/evidence.js';
import { registerContext } from './commands/context.js';
import { registerReport } from './commands/report.js';

const HELP_TEXT = `
proofrun — AI agent verification CLI

Proofrun gives AI agents a structured way to verify their implementation
by interacting with a running app, capturing evidence, and generating
interactive HTML reports for human review.

SETUP COMMANDS
  proofrun init --preset <name>          Create .proofrun/config.yaml from a preset
  proofrun doctor                        Check environment readiness

SESSION COMMANDS
  proofrun session start --change <name> Start verification session (acquire resources)
    [--device <type>]                      Device type from config (default: "default")
    [--timeout <seconds>]                  Max wait for resources (default: 300)
  proofrun session stop                  Stop session, release all resources
  proofrun session status                Show active session info or pool availability

CONTEXT COMMANDS
  proofrun context                       Get project context (app knowledge, interaction, devices)
  proofrun context <change>              Get project + change-specific context
  proofrun context --list                Get discovery command for available changes

EVIDENCE COMMANDS
  proofrun step <description>            Record a verification step
    [--ac <n>]                             Associate with acceptance criterion
    [--command <cmd>]                      Command used for this step
  proofrun screenshot <file>             Attach a screenshot to evidence
    [--ac <n>]                             Associate with acceptance criterion
    [--note <text>]                        Note about the screenshot
  proofrun judge --ac <n>                Record judgment for an AC
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

  # Check environment
  proofrun doctor

  # Verify a specific change
  proofrun context add-search
  proofrun session start --change add-search

  # Free-form verification (no change artifacts needed)
  proofrun context
  proofrun session start --change "chinese-locale-audit"

  # Record evidence
  proofrun step "Navigate to Library tab" --ac 1
  proofrun screenshot /tmp/screen.jpeg --ac 1 --note "Library screen visible"
  proofrun judge --ac 1 --pass "Search bar found at expected position"

  # Generate report and clean up
  proofrun report --open
  proofrun session stop

PRESETS
  expo               Expo managed workflow (Metro bundler, iosef, testID)
  react-native-cli   React Native CLI (Metro bundler, iosef, testID)

For the agent verification workflow, install the skill:
  npx skills add rokabytedev/proofrun -g
`;

export function createCli() {
  const program = new Command();

  program
    .name('proofrun')
    .description('AI agent verification CLI — capture evidence, generate reports')
    .version('0.1.0')
    .addHelpText('after', HELP_TEXT)
    .configureOutput({
      writeErr: () => {}, // Suppress commander's default error output
    })
    .exitOverride((err) => {
      if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
        process.exit(0);
      }
      // For usage errors, output JSON
      console.log(JSON.stringify({ ok: false, command: null, data: null, error: err.message }));
      process.exit(2);
    });

  // Show help when no command is provided
  program.action(() => {
    program.outputHelp();
  });

  registerInit(program);
  registerDoctor(program);
  registerSession(program);
  registerEvidence(program);
  registerContext(program);
  registerReport(program);

  return program;
}
