import { resolve } from 'node:path';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import {
  findActiveSession, loadEvidence, appendEvidence,
  findSessionsByChangeName,
} from '../session.js';

export function registerCarry(program) {
  program
    .command('carry')
    .description('Carry forward an approved criterion from a prior run')
    .requiredOption('--criterion <name>', 'Criterion name to carry forward')
    .requiredOption('--reason <text>', 'Reason for carrying (e.g., "No code changes affect this")')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('carry'));
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);

      // Require active session
      const active = findActiveSession(evidenceDir);
      if (!active) {
        error('carry', 'No active session. Run `proofrun session start --change <name> --device <identifier>` first.');
      }

      const changeName = active.state.change_name;

      // Find all sessions for this change name
      const allSessions = findSessionsByChangeName(evidenceDir, changeName);

      // Find prior stopped sessions (exclude current active session)
      const priorSessions = allSessions.filter(
        s => s.sessionId !== active.sessionId && s.state.status === 'stopped'
      );

      if (priorSessions.length === 0) {
        error('carry', `No prior session found for change '${changeName}'. Cannot carry criteria without a prior run.`);
      }

      // Use the most recent prior stopped session
      const priorSession = priorSessions[priorSessions.length - 1];
      const priorEvidence = loadEvidence(priorSession.sessionDir);

      if (!priorEvidence) {
        error('carry', `Could not load evidence from prior session ${priorSession.sessionId}.`);
      }

      // Look up criterion in prior evidence (any judgment entry)
      const priorJudgment = priorEvidence.entries.find(
        e => e.criterion === opts.criterion && e.type === 'judgment'
      );

      if (!priorJudgment) {
        error('carry', `Criterion '${opts.criterion}' not found in prior run.`);
      }

      // Determine run number for prior session
      const priorRunNumber = allSessions.findIndex(s => s.sessionId === priorSession.sessionId) + 1;

      // Record carry evidence entry
      const entry = appendEvidence(active.sessionDir, {
        type: 'carry',
        criterion: opts.criterion,
        reason: opts.reason,
        carried_from_session: priorSession.sessionId,
        carried_from_run: priorRunNumber,
      });

      success('carry', {
        entry_id: entry.id,
        type: 'carry',
        criterion: opts.criterion,
        reason: opts.reason,
        carried_from_session: priorSession.sessionId,
        carried_from_run: priorRunNumber,
        timestamp: entry.timestamp,
      }, (data) =>
        `Carried [#${data.entry_id}] ${data.criterion} from Run #${data.carried_from_run} (${data.carried_from_session})\n` +
        `  Reason: ${data.reason}`
      );
    });
}
