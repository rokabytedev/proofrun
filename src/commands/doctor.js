import { existsSync, readdirSync } from 'node:fs';
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
        checks.push({ name: 'config', status: 'pass', detail: '.proofrun/config.toml found and valid' });
      } else {
        checks.push({ name: 'config', status: 'fail', detail: '.proofrun/config.toml not found. Run `proofrun init --preset <name>`.' });
        success('doctor', { all_passed: false, checks });
        return;
      }

      const config = withDefaults(rawConfig);

      // Check 2: Knowledge directory
      const knowledgeDir = config._knowledgeDir;
      if (existsSync(knowledgeDir)) {
        const files = readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
        if (files.length > 0) {
          checks.push({ name: 'knowledge', status: 'pass', detail: `${files.length} knowledge file(s) in .proofrun/knowledge/` });
        } else {
          checks.push({ name: 'knowledge', status: 'warn', detail: '.proofrun/knowledge/ exists but has no .md files' });
        }
      } else {
        checks.push({ name: 'knowledge', status: 'fail', detail: '.proofrun/knowledge/ not found. Run `proofrun init --preset <name>` to seed knowledge.' });
      }

      // Check 3: Locking mechanism
      const mechanism = getLockMechanism();
      checks.push({ name: 'locking', status: 'pass', detail: `Using ${mechanism} locks`, mechanism });

      // Check 4: Simulator slots
      const lockDir = resolve(config._dir, config.session.lock_dir);
      const poolSize = config.simulator.pool_size;
      const lockedSlots = existsSync(lockDir) ? getLockedSlots(lockDir, poolSize) : [];
      const available = poolSize - lockedSlots.length;
      checks.push({
        name: 'simulator_pool',
        status: available > 0 ? 'pass' : 'warn',
        detail: `${available} of ${poolSize} simulator slots available`,
        available_slots: available,
        total_slots: poolSize,
      });

      const allPassed = checks.every(c => c.status === 'pass');
      success('doctor', { all_passed: allPassed, checks });
    });
}
