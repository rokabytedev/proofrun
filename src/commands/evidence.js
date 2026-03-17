import { copyFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import { findActiveSession, appendEvidence, loadEvidence, hasPrerequisites } from '../session.js';

function requireActiveSession(config, command) {
  const evidenceDir = resolve(config._dir, config.session.evidence_dir);
  const active = findActiveSession(evidenceDir);
  if (!active) {
    error(command, 'No active session. Run `proofrun session start --change <name> --device <identifier>` first.');
  }

  const evidence = loadEvidence(active.sessionDir);
  if (!hasPrerequisites(evidence)) {
    console.error('Warning: No prerequisites recorded. Run `proofrun prerequisite` to record environment state first.');
  }

  return active;
}

export function registerEvidence(program) {
  // proofrun step
  program
    .command('step')
    .description('Record a verification step')
    .argument('<description>', 'Step description')
    .option('--criterion <name>', 'Criterion name to associate with')
    .option('--command <cmd>', 'Command used for this step')
    .action(async (description, opts) => {
      const config = withDefaults(requireConfig('step'));
      const active = requireActiveSession(config, 'step');

      const entry = appendEvidence(active.sessionDir, {
        type: 'step',
        criterion: opts.criterion || null,
        description,
        command: opts.command || null,
      });

      const evidence = loadEvidence(active.sessionDir);
      success('step', {
        entry_id: entry.id,
        type: 'step',
        criterion: entry.criterion,
        description: entry.description,
        command: entry.command,
        timestamp: entry.timestamp,
        total_entries: evidence.entries.length,
      }, (data) =>
        `Step recorded [#${data.entry_id}]${data.criterion ? ` (${data.criterion})` : ''}: ${data.description}`
      );
    });

  // proofrun screenshot
  program
    .command('screenshot')
    .description('Attach a screenshot to the evidence log')
    .argument('<file>', 'Path to screenshot image file')
    .option('--criterion <name>', 'Criterion name to associate with')
    .option('--note <text>', 'Note about the screenshot')
    .action(async (file, opts) => {
      const config = withDefaults(requireConfig('screenshot'));
      const active = requireActiveSession(config, 'screenshot');

      if (!existsSync(file)) {
        error('screenshot', `File not found: ${file}`);
      }

      // Copy to session screenshots dir
      const evidence = loadEvidence(active.sessionDir);
      const entryNum = evidence.entries.length + 1;
      const criterion = opts.criterion || null;
      const ext = extname(file) || '.jpeg';
      const storedName = criterion
        ? `${String(entryNum).padStart(3, '0')}-${criterion}${ext}`
        : `${String(entryNum).padStart(3, '0')}${ext}`;
      const storedPath = resolve(active.sessionDir, 'screenshots', storedName);
      copyFileSync(file, storedPath);

      const { statSync } = await import('node:fs');
      const fileSize = statSync(storedPath).size;

      const entry = appendEvidence(active.sessionDir, {
        type: 'screenshot',
        criterion,
        source_path: file,
        stored_path: `screenshots/${storedName}`,
        note: opts.note || null,
      });

      const updatedEvidence = loadEvidence(active.sessionDir);
      success('screenshot', {
        entry_id: entry.id,
        type: 'screenshot',
        criterion: entry.criterion,
        source_path: file,
        stored_path: `.proofrun/sessions/${active.sessionId}/screenshots/${storedName}`,
        note: entry.note,
        file_size_bytes: fileSize,
        timestamp: entry.timestamp,
        total_entries: updatedEvidence.entries.length,
      }, (data) =>
        `Screenshot recorded [#${data.entry_id}]${data.criterion ? ` (${data.criterion})` : ''}: ${data.stored_path}` +
        (data.note ? ` — ${data.note}` : '')
      );
    });

  // proofrun judge
  program
    .command('judge')
    .description('Record pass/fail judgment for a criterion')
    .requiredOption('--criterion <name>', 'Criterion name')
    .option('--pass <reasoning>', 'Mark as passed with reasoning')
    .option('--fail <reasoning>', 'Mark as failed with reasoning')
    .option('--human <reasoning>', 'Mark as requiring human verification')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('judge'));
      const active = requireActiveSession(config, 'judge');

      let status, reasoning;
      if (opts.pass) { status = 'pass'; reasoning = opts.pass; }
      else if (opts.fail) { status = 'fail'; reasoning = opts.fail; }
      else if (opts.human) { status = 'human_required'; reasoning = opts.human; }
      else {
        error('judge', 'Must specify one of --pass, --fail, or --human with reasoning text.', 2);
      }

      // Count prior judgments for this criterion
      const evidence = loadEvidence(active.sessionDir);
      const priorJudgments = evidence.entries.filter(e => e.type === 'judgment' && e.criterion === opts.criterion);
      const sequence = priorJudgments.length + 1;

      const entry = appendEvidence(active.sessionDir, {
        type: 'judgment',
        criterion: opts.criterion,
        status,
        reasoning,
        judgment_sequence: sequence,
      });

      const updatedEvidence = loadEvidence(active.sessionDir);
      success('judge', {
        entry_id: entry.id,
        type: 'judgment',
        criterion: opts.criterion,
        status,
        reasoning,
        judgment_sequence: sequence,
        timestamp: entry.timestamp,
        total_entries: updatedEvidence.entries.length,
      }, (data) => {
        const statusSymbol = data.status === 'pass' ? '✓' : data.status === 'fail' ? '✗' : '?';
        return `Judgment [#${data.entry_id}] ${statusSymbol} ${data.criterion}: ${data.status}\n  ${data.reasoning}`;
      });
    });

  // proofrun note
  program
    .command('note')
    .description('Add a freeform note to the evidence log')
    .argument('<text>', 'Note text')
    .action(async (text) => {
      const config = withDefaults(requireConfig('note'));
      const active = requireActiveSession(config, 'note');

      const entry = appendEvidence(active.sessionDir, {
        type: 'note',
        text,
      });

      const evidence = loadEvidence(active.sessionDir);
      success('note', {
        entry_id: entry.id,
        type: 'note',
        text,
        timestamp: entry.timestamp,
        total_entries: evidence.entries.length,
      }, (data) => `Note recorded [#${data.entry_id}]: ${data.text}`);
    });

  // proofrun fix
  program
    .command('fix')
    .description('Record a code fix for a criterion')
    .requiredOption('--criterion <name>', 'Criterion name')
    .requiredOption('--description <text>', 'Description of the fix')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('fix'));
      const active = requireActiveSession(config, 'fix');

      const entry = appendEvidence(active.sessionDir, {
        type: 'fix',
        criterion: opts.criterion,
        description: opts.description,
      });

      const evidence = loadEvidence(active.sessionDir);
      success('fix', {
        entry_id: entry.id,
        type: 'fix',
        criterion: entry.criterion,
        description: entry.description,
        timestamp: entry.timestamp,
        total_entries: evidence.entries.length,
      }, (data) => `Fix recorded [#${data.entry_id}] (${data.criterion}): ${data.description}`);
    });

  // proofrun evidence
  program
    .command('evidence')
    .description('Show evidence summary for the active session')
    .action(async () => {
      const config = withDefaults(requireConfig('evidence'));
      const active = requireActiveSession(config, 'evidence');

      const evidence = loadEvidence(active.sessionDir);
      const entries = evidence.entries;

      // Group by criterion name
      const criterionMap = new Map();
      let unassociatedNotes = 0;
      let unassociatedSteps = 0;

      for (const entry of entries) {
        if (entry.criterion != null) {
          if (!criterionMap.has(entry.criterion)) {
            criterionMap.set(entry.criterion, {
              criterion: entry.criterion,
              latest_status: null,
              judgments: 0,
              steps: 0,
              screenshots: 0,
              fixes: 0,
            });
          }
          const criterionData = criterionMap.get(entry.criterion);
          if (entry.type === 'judgment') {
            criterionData.judgments++;
            criterionData.latest_status = entry.status;
          } else if (entry.type === 'step') {
            criterionData.steps++;
          } else if (entry.type === 'screenshot') {
            criterionData.screenshots++;
          } else if (entry.type === 'fix') {
            criterionData.fixes++;
          }
        } else {
          if (entry.type === 'note') unassociatedNotes++;
          if (entry.type === 'step') unassociatedSteps++;
        }
      }

      const criteria = Array.from(criterionMap.values());

      success('evidence', {
        session_id: active.sessionId,
        criteria,
        unassociated_entries: { notes: unassociatedNotes, steps: unassociatedSteps },
        total_entries: entries.length,
      }, (data) => {
        const lines = [`Session: ${data.session_id}`, `Total entries: ${data.total_entries}`, ''];
        if (data.criteria.length === 0) {
          lines.push('No criteria recorded yet.');
        } else {
          lines.push('Criteria:');
          for (const c of data.criteria) {
            const statusSymbol = c.latest_status === 'pass' ? '✓'
              : c.latest_status === 'fail' ? '✗'
              : c.latest_status === 'human_required' ? '?'
              : '…';
            lines.push(`  ${statusSymbol} ${c.criterion}: ${c.latest_status || 'pending'} (${c.steps} steps, ${c.screenshots} screenshots, ${c.judgments} judgments)`);
          }
        }
        if (data.unassociated_entries.notes > 0 || data.unassociated_entries.steps > 0) {
          lines.push('');
          lines.push(`Unassociated: ${data.unassociated_entries.notes} notes, ${data.unassociated_entries.steps} steps`);
        }
        return lines.join('\n');
      });
    });
}
