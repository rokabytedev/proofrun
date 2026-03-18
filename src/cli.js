import { Command } from 'commander';
import { registerInit } from './commands/init.js';
import { registerDoctor } from './commands/doctor.js';
import { registerSession } from './commands/session.js';
import { registerEvidence } from './commands/evidence.js';
import { registerInfo } from './commands/info.js';
import { registerKnowledge } from './commands/knowledge.js';
import { registerPrerequisite } from './commands/prerequisite.js';
import { registerReport } from './commands/report.js';
import { registerCarry } from './commands/carry.js';
import { registerServe } from './commands/serve.js';
import { registerDevice } from './commands/device.js';
import { registerPlan } from './commands/plan.js';
import { setJsonMode } from './output.js';

const HELP_TEXT = `
proofrun — AI agent verification CLI

Proofrun gives AI agents a structured way to verify app behavior,
capture evidence, and generate interactive HTML reports for human review.

SETUP COMMANDS
  proofrun init                          Create .proofrun/ with config and knowledge
  proofrun doctor                        Check infrastructure readiness
  proofrun info                          Project readiness: config, knowledge, session, diagnostics

SESSION COMMANDS
  proofrun session start                 Start a verification session
    --change <name>                        Change name or verification label (required)
    --device <identifier>                  Device identifier to lock (required)
    [--reason <text>]                      Reason for this run (follow-up runs)
    [--force-unlock]                       Force-unlock a device that is already locked
  proofrun session stop                  Release device lock, finalize session
  proofrun session status                Show active session or lock state

DEVICE COMMANDS
  proofrun device status                 Show device lock status (global)
    [--device <id>]                        Check a specific device

KNOWLEDGE COMMANDS
  proofrun knowledge --list              List available knowledge topics
  proofrun knowledge <topic>             Read a specific knowledge file

PLAN COMMANDS
  proofrun plan add                      Add a criterion to the verification plan
    --criterion <name>                     Criterion name (required)
    --spec <text>                          Spec text (required)
    [--cases <case>]                       Test case (repeatable)
    [--carried]                            Mark as carried from prior run
  proofrun plan list                     List the verification plan with status
  proofrun plan check                    Check plan coverage against evidence

EVIDENCE COMMANDS
  proofrun prerequisite <description>    Record an environment prerequisite
    [--check <command>]                    Command to verify the prerequisite
  proofrun step <description>            Record a verification step
    [--criterion <name>]                   Associate with named criterion
    [--command <cmd>]                      Command used for this step
  proofrun screenshot <file>             Attach a screenshot to evidence
    [--criterion <name>]                   Associate with named criterion
    [--note <text>]                        Note about the screenshot
  proofrun judge                         Record judgment for a criterion
    --criterion <name>                     Criterion name (required)
    --pass <reasoning>                     Mark as passed
    --fail <reasoning>                     Mark as failed
    --human <reasoning>                    Mark as requiring human verification
  proofrun note <text>                   Add freeform note to evidence log
  proofrun fix                           Record a code fix
    --criterion <name>                     Criterion name (required)
    --description <text>                   Description of the fix (required)
  proofrun carry                         Carry forward a criterion from a prior run
    --criterion <name>                     Criterion name to carry (required)
    --reason <text>                        Reason for carrying (required)
  proofrun evidence                      Show evidence summary for active session

REPORT COMMANDS
  proofrun report                        Generate interactive HTML report
    [--change <name>]                      Change name (auto-detected if omitted)
    [--output <path>]                      Custom output path
  proofrun serve                         Start feedback server for a report
    --change <name>                        Change name (required)
    [--port <port>]                        Port number (default: random)
    [--timeout <minutes>]                  Server timeout (default: 30)
    [--stop]                               Stop a running serve process

GLOBAL FLAGS
  --json                                 Output in JSON format (default: plain text)

EXIT CODES
  0  Success
  1  Runtime error or verification failure
  2  Bad arguments or usage error

EXAMPLES
  # Initialize proofrun in your project
  proofrun init

  # Check project readiness
  proofrun info

  # Check infrastructure
  proofrun doctor

  # Browse project knowledge
  proofrun knowledge --list
  proofrun knowledge interaction

  # Start a verification session (agent provides device identifier)
  proofrun session start --change chinese-locale-audit --device B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466

  # Record evidence
  proofrun step "Navigate to Settings tab" --criterion settings-translated
  proofrun screenshot /tmp/screen.jpeg --criterion settings-translated --note "Settings screen visible"
  proofrun judge --criterion settings-translated --pass "All labels translated correctly"

  # Stop session and generate report
  proofrun session stop
  proofrun report --change chinese-locale-audit

For the agent verification workflow, install the skill:
  npx skills add rokabytedev/proofrun -g
`;

export function createCli() {
  const program = new Command();

  program
    .name('proofrun')
    .description('AI agent verification CLI — capture evidence, generate reports')
    .version('0.2.0')
    .option('--json', 'Output in JSON format')
    .addHelpText('after', HELP_TEXT)
    .configureOutput({
      writeErr: () => {},
    })
    .exitOverride((err) => {
      if (err.code === 'commander.helpDisplayed' || err.code === 'commander.version') {
        process.exit(0);
      }
      console.error(`Error: ${err.message}`);
      process.exit(2);
    });

  program.hook('preAction', (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    setJsonMode(!!opts.json);
  });

  program.action(() => {
    program.outputHelp();
  });

  registerInit(program);
  registerDoctor(program);
  registerSession(program);
  registerPrerequisite(program);
  registerEvidence(program);
  registerInfo(program);
  registerKnowledge(program);
  registerReport(program);
  registerCarry(program);
  registerServe(program);
  registerDevice(program);
  registerPlan(program);

  return program;
}
