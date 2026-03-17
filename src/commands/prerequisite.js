import { execSync } from 'node:child_process';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import { findActiveSession, appendEvidence, loadEvidence } from '../session.js';
import { resolve } from 'node:path';

export function registerPrerequisite(program) {
  program
    .command('prerequisite')
    .description('Record an environment prerequisite')
    .argument('<description>', 'Prerequisite description')
    .option('--check <command>', 'Command to verify the prerequisite')
    .action(async (description, opts) => {
      const config = withDefaults(requireConfig('prerequisite'));
      const evidenceDir = resolve(config._dir, config.session.evidence_dir);
      const active = findActiveSession(evidenceDir);
      if (!active) {
        error('prerequisite', 'No active session. Run `proofrun session start --change <name> --device <identifier>` first.');
      }

      const entryData = {
        type: 'prerequisite',
        description,
      };

      if (opts.check) {
        entryData.check_command = opts.check;
        try {
          const output = execSync(opts.check, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
          entryData.check_output = output.trim();
          entryData.check_passed = true;
        } catch (err) {
          entryData.check_output = (err.stdout || err.stderr || '').trim();
          entryData.check_passed = false;
        }
      }

      const entry = appendEvidence(active.sessionDir, entryData);

      const evidence = loadEvidence(active.sessionDir);
      const checkInfo = opts.check
        ? ` [check: ${entry.check_passed ? 'passed' : 'FAILED'}]`
        : '';

      success('prerequisite', {
        entry_id: entry.id,
        type: 'prerequisite',
        description: entry.description,
        check_command: entry.check_command || null,
        check_output: entry.check_output || null,
        check_passed: entry.check_passed != null ? entry.check_passed : null,
        timestamp: entry.timestamp,
        total_entries: evidence.entries.length,
      }, (data) =>
        `Prerequisite recorded [#${data.entry_id}]${checkInfo}: ${data.description}`
      );
    });
}
