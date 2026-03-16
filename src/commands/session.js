import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';
import { success, error } from '../output.js';
import { requireConfig, withDefaults, LOCK_DIR } from '../config.js';
import { acquireLock, releaseLock, listLocks } from '../locking.js';
import {
  generateSessionId, createSessionDir, saveSessionState,
  findActiveSession, loadEvidence, initEvidence,
} from '../session.js';

export function registerSession(program) {
  const session = program
    .command('session')
    .description('Manage verification sessions');

  session
    .command('start')
    .description('Start a new verification session — lock simulator by UDID')
    .requiredOption('--change <name>', 'Change name or verification label')
    .requiredOption('--simulator <UDID>', 'Simulator UDID to lock for this session')
    .action(async (opts) => {
      const rawConfig = requireConfig('session.start');
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;

      // Check no active session
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);
      const existing = findActiveSession(evidenceDir);
      if (existing) {
        error('session.start', `Active session already exists: ${existing.sessionId}. Run \`proofrun session stop\` first.`);
      }

      const lockDir = resolve(projectRoot, LOCK_DIR);
      const resourceName = `sim-${opts.simulator}`;

      // Check if simulator is already locked by another session
      const lock = acquireLock(lockDir, resourceName);
      if (!lock) {
        // Find which session holds it
        const locks = listLocks(lockDir);
        const held = locks.find(l => l.resource === resourceName);
        const holder = held ? ` (held by session ${held.sessionId})` : '';
        error('session.start', `Simulator ${opts.simulator} is already in use${holder}.`);
      }

      // Create session
      const sessionId = generateSessionId();
      const sessionDir = createSessionDir(evidenceDir, sessionId);

      const sessionState = {
        session_id: sessionId,
        status: 'active',
        change_name: opts.change,
        started_at: new Date().toISOString(),
        stopped_at: null,
        simulator: opts.simulator,
      };

      saveSessionState(sessionDir, sessionState);
      initEvidence(sessionDir, sessionId, opts.change, opts.simulator);

      // Write session ID to lock held file (replaces PID placeholder)
      writeFileSync(lock.heldPath, sessionId);

      success('session.start', {
        session_id: sessionId,
        change_name: opts.change,
        simulator: opts.simulator,
        session_dir: `.proofrun/sessions/${sessionId}`,
      }, (data) =>
        `Session started: ${data.session_id}\n` +
        `Change: ${data.change_name}\n` +
        `Simulator: ${data.simulator}\n` +
        `Session dir: ${data.session_dir}`
      );
    });

  session
    .command('stop')
    .description('Stop the active verification session — release simulator lock')
    .action(async () => {
      const rawConfig = requireConfig('session.stop');
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);

      const active = findActiveSession(evidenceDir);
      if (!active) {
        error('session.stop', 'No active session found.');
      }

      const { sessionDir, state } = active;

      // Release simulator lock
      const lockDir = resolve(projectRoot, LOCK_DIR);
      if (state.simulator) {
        const heldPath = resolve(lockDir, `sim-${state.simulator}.lock.held`);
        releaseLock({ heldPath });
      }

      // Update session state
      const stoppedAt = new Date().toISOString();
      state.status = 'stopped';
      state.stopped_at = stoppedAt;
      saveSessionState(sessionDir, state);

      // Count evidence
      const evidence = loadEvidence(sessionDir);
      const entryCount = evidence?.entries?.length || 0;
      const duration = Math.round((new Date(stoppedAt) - new Date(state.started_at)) / 1000);

      success('session.stop', {
        session_id: active.sessionId,
        released_simulator: state.simulator,
        evidence_entries: entryCount,
        duration_seconds: duration,
      }, (data) =>
        `Session stopped: ${data.session_id}\n` +
        `Released simulator: ${data.released_simulator}\n` +
        `Evidence entries: ${data.evidence_entries}\n` +
        `Duration: ${data.duration_seconds}s`
      );
    });

  session
    .command('status')
    .description('Show active session info or lock state')
    .action(async () => {
      const rawConfig = requireConfig('session.status');
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);
      const lockDir = resolve(projectRoot, LOCK_DIR);

      const active = findActiveSession(evidenceDir);
      const locks = listLocks(lockDir);

      if (active) {
        const { state } = active;
        const evidence = loadEvidence(active.sessionDir);
        const entryCount = evidence?.entries?.length || 0;

        success('session.status', {
          active: true,
          session_id: active.sessionId,
          change_name: state.change_name,
          simulator: state.simulator,
          started_at: state.started_at,
          evidence_entries: entryCount,
          locked_resources: locks,
        }, (data) =>
          `Session: ${data.session_id} (active)\n` +
          `Change: ${data.change_name}\n` +
          `Simulator: ${data.simulator}\n` +
          `Started: ${data.started_at}\n` +
          `Evidence entries: ${data.evidence_entries}\n` +
          `Locks: ${data.locked_resources.length} held`
        );
      } else {
        success('session.status', {
          active: false,
          locked_resources: locks,
        }, (data) =>
          `Session: none active\n` +
          `Locks: ${data.locked_resources.length} held`
        );
      }
    });
}
