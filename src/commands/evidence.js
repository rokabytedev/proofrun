import { copyFileSync, existsSync } from 'node:fs';
import { resolve, basename, extname } from 'node:path';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import { findActiveSession, appendEvidence, loadEvidence } from '../session.js';

function requireActiveSession(config, command) {
  const evidenceDir = resolve(config._dir, config.session.evidence_dir);
  const active = findActiveSession(evidenceDir);
  if (!active) {
    error(command, 'No active session. Run `proofrun session start --change <name>` first.');
  }
  return active;
}

export function registerEvidence(program) {
  // proofrun step
  program
    .command('step')
    .description('Record a verification step')
    .argument('<description>', 'Step description')
    .option('--ac <n>', 'Acceptance criterion number')
    .option('--command <cmd>', 'Command used for this step')
    .action(async (description, opts) => {
      const config = withDefaults(requireConfig('step'));
      const active = requireActiveSession(config, 'step');

      const entry = appendEvidence(active.sessionDir, {
        type: 'step',
        ac: opts.ac ? parseInt(opts.ac, 10) : null,
        description,
        command: opts.command || null,
      });

      const evidence = loadEvidence(active.sessionDir);
      success('step', {
        entry_id: entry.id,
        type: 'step',
        ac: entry.ac,
        description: entry.description,
        command: entry.command,
        timestamp: entry.timestamp,
        total_entries: evidence.entries.length,
      });
    });

  // proofrun screenshot
  program
    .command('screenshot')
    .description('Attach a screenshot to the evidence log')
    .argument('<file>', 'Path to screenshot image file')
    .option('--ac <n>', 'Acceptance criterion number')
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
      const ac = opts.ac ? parseInt(opts.ac, 10) : null;
      const ext = extname(file) || '.jpeg';
      const storedName = ac
        ? `${String(entryNum).padStart(3, '0')}-ac${ac}${ext}`
        : `${String(entryNum).padStart(3, '0')}${ext}`;
      const storedPath = resolve(active.sessionDir, 'screenshots', storedName);
      copyFileSync(file, storedPath);

      const { statSync } = await import('node:fs');
      const fileSize = statSync(storedPath).size;

      const entry = appendEvidence(active.sessionDir, {
        type: 'screenshot',
        ac,
        source_path: file,
        stored_path: `screenshots/${storedName}`,
        note: opts.note || null,
      });

      const updatedEvidence = loadEvidence(active.sessionDir);
      success('screenshot', {
        entry_id: entry.id,
        type: 'screenshot',
        ac: entry.ac,
        source_path: file,
        stored_path: `.proofrun/sessions/${active.sessionId}/screenshots/${storedName}`,
        note: entry.note,
        file_size_bytes: fileSize,
        timestamp: entry.timestamp,
        total_entries: updatedEvidence.entries.length,
      });
    });

  // proofrun judge
  program
    .command('judge')
    .description('Record pass/fail judgment for an acceptance criterion')
    .requiredOption('--ac <n>', 'Acceptance criterion number')
    .option('--pass <reasoning>', 'Mark AC as passed with reasoning')
    .option('--fail <reasoning>', 'Mark AC as failed with reasoning')
    .option('--human <reasoning>', 'Mark AC as requiring human verification')
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

      const ac = parseInt(opts.ac, 10);

      // Count prior judgments for this AC
      const evidence = loadEvidence(active.sessionDir);
      const priorJudgments = evidence.entries.filter(e => e.type === 'judgment' && e.ac === ac);
      const sequence = priorJudgments.length + 1;

      const entry = appendEvidence(active.sessionDir, {
        type: 'judgment',
        ac,
        status,
        reasoning,
        judgment_sequence: sequence,
      });

      const updatedEvidence = loadEvidence(active.sessionDir);
      success('judge', {
        entry_id: entry.id,
        type: 'judgment',
        ac,
        status,
        reasoning,
        judgment_sequence: sequence,
        timestamp: entry.timestamp,
        total_entries: updatedEvidence.entries.length,
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
      });
    });

  // proofrun fix
  program
    .command('fix')
    .description('Record a code fix for an acceptance criterion')
    .requiredOption('--ac <n>', 'Acceptance criterion number')
    .requiredOption('--description <text>', 'Description of the fix')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('fix'));
      const active = requireActiveSession(config, 'fix');

      const entry = appendEvidence(active.sessionDir, {
        type: 'fix',
        ac: parseInt(opts.ac, 10),
        description: opts.description,
      });

      const evidence = loadEvidence(active.sessionDir);
      success('fix', {
        entry_id: entry.id,
        type: 'fix',
        ac: entry.ac,
        description: entry.description,
        timestamp: entry.timestamp,
        total_entries: evidence.entries.length,
      });
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

      // Group by AC
      const acMap = new Map();
      let unassociatedNotes = 0;
      let unassociatedSteps = 0;

      for (const entry of entries) {
        if (entry.ac != null) {
          if (!acMap.has(entry.ac)) {
            acMap.set(entry.ac, { ac: entry.ac, latest_status: null, judgments: 0, steps: 0, screenshots: 0, fixes: 0 });
          }
          const acData = acMap.get(entry.ac);
          if (entry.type === 'judgment') {
            acData.judgments++;
            acData.latest_status = entry.status;
          } else if (entry.type === 'step') {
            acData.steps++;
          } else if (entry.type === 'screenshot') {
            acData.screenshots++;
          } else if (entry.type === 'fix') {
            acData.fixes++;
          }
        } else {
          if (entry.type === 'note') unassociatedNotes++;
          if (entry.type === 'step') unassociatedSteps++;
        }
      }

      const acs = Array.from(acMap.values()).sort((a, b) => a.ac - b.ac);

      success('evidence', {
        session_id: active.sessionId,
        acs,
        unassociated_entries: { notes: unassociatedNotes, steps: unassociatedSteps },
        total_entries: entries.length,
      });
    });
}
