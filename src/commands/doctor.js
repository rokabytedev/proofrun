import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { success } from '../output.js';
import { loadConfig, withDefaults } from '../config.js';
import { getLockMechanism, getLockedSlots } from '../locking.js';

export function registerDoctor(program) {
  program
    .command('doctor')
    .description('Check environment readiness for proofrun')
    .action(async () => {
      const checks = [];

      // Check 1: Config
      const rawConfig = loadConfig();
      if (rawConfig) {
        checks.push({ name: 'config', status: 'pass', detail: '.proofrun/config.yaml found and valid' });
      } else {
        checks.push({ name: 'config', status: 'fail', detail: '.proofrun/config.yaml not found. Run `proofrun init --preset <name>`.' });
        success('doctor', { all_passed: false, checks });
        return;
      }

      const config = withDefaults(rawConfig);

      // Check 2: Interaction tool
      const toolCheck = config.interaction?.tool_check || `${config.interaction?.tool} --help`;
      try {
        execSync(toolCheck, { stdio: 'pipe', timeout: 10000 });
        checks.push({
          name: 'interaction_tool',
          status: 'pass',
          detail: `${config.interaction.tool} available`,
          check_command: toolCheck,
        });
      } catch {
        checks.push({
          name: 'interaction_tool',
          status: 'fail',
          detail: `${config.interaction.tool} not found`,
          check_command: toolCheck,
          install_hint: config.interaction?.tool_install_hint || `Install ${config.interaction.tool}`,
        });
      }

      // Check 3: Locking mechanism
      const mechanism = getLockMechanism();
      if (mechanism === 'flock') {
        checks.push({ name: 'locking', status: 'pass', detail: 'Using flock (kernel-level locks)', mechanism: 'flock' });
      } else {
        checks.push({ name: 'locking', status: 'warn', detail: 'flock not found. Using PID-file locks.', mechanism: 'pid-file', install_hint: 'brew install flock' });
      }

      // Check 4: Dev server command
      const devCmd = config.dev_server?.start?.split(' ')[0];
      if (devCmd) {
        // Validate command name contains only safe characters (alphanumeric, hyphens, dots, slashes)
        if (/^[a-zA-Z0-9._\-/]+$/.test(devCmd)) {
          try {
            execSync(`which ${devCmd}`, { stdio: 'pipe' });
            checks.push({ name: 'dev_server', status: 'pass', detail: `${devCmd} found in PATH` });
          } catch {
            checks.push({ name: 'dev_server', status: 'fail', detail: `${devCmd} not found in PATH` });
          }
        } else {
          checks.push({ name: 'dev_server', status: 'fail', detail: `dev_server.start command name contains invalid characters: ${devCmd}` });
        }
      } else {
        checks.push({ name: 'dev_server', status: 'fail', detail: 'dev_server.start not configured' });
      }

      // Check 5: Simulator slots
      const lockDir = resolve(config._dir, config.session.lock_dir);
      const poolSize = config.simulator.pool_size;
      const lockedSlots = existsSync(lockDir) ? getLockedSlots(lockDir, poolSize) : [];
      const available = poolSize - lockedSlots.length;
      checks.push({
        name: 'simulator',
        status: available > 0 ? 'pass' : 'warn',
        detail: `${available} of ${poolSize} simulator slots available`,
        available_slots: available,
        total_slots: poolSize,
      });

      const allPassed = checks.every(c => c.status === 'pass');
      success('doctor', { all_passed: allPassed, checks });
    });
}
