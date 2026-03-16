import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { success } from '../output.js';
import { loadConfig, withDefaults, LOCK_DIR } from '../config.js';
import { listLocks } from '../locking.js';

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
        success('doctor', { all_passed: false, checks }, formatDoctor);
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

      // Check 3: Lock directory
      const lockDir = resolve(config._dir, LOCK_DIR);
      if (existsSync(lockDir)) {
        const locks = listLocks(lockDir);
        checks.push({ name: 'lock_dir', status: 'pass', detail: `${LOCK_DIR} exists (${locks.length} lock(s) held)` });
      } else {
        checks.push({ name: 'lock_dir', status: 'pass', detail: `${LOCK_DIR} will be created on first session start` });
      }

      const allPassed = checks.every(c => c.status === 'pass');
      success('doctor', { all_passed: allPassed, checks }, formatDoctor);
    });
}

function formatDoctor(data) {
  const lines = [data.all_passed ? 'All checks passed.' : 'Some checks failed.', ''];
  for (const check of data.checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗';
    lines.push(`  ${icon} ${check.detail}`);
  }
  return lines.join('\n');
}
