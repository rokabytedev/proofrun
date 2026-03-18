import { resolve } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import {
  getGlobalLockDir, acquireLock, releaseLock, listLocks,
  readLockData, isLockStale, updateLockSessionId,
} from '../locking.js';
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
    .description('Start a new verification session — lock device by identifier')
    .requiredOption('--change <name>', 'Change name or verification label')
    .requiredOption('--device <identifier>', 'Device identifier (UDID, AVD name, etc.) to lock for this session')
    .option('--reason <text>', 'Reason for this run (e.g., "fix card-tap animation")')
    .option('--force-unlock', 'Force-unlock a device that is already locked (use for stale locks)')
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

      const lockDir = getGlobalLockDir();
      const resourceName = `dev-${opts.device}`;

      // Check if device is already locked
      const lock = acquireLock(lockDir, resourceName, { project: projectRoot, device: opts.device });
      if (!lock) {
        // Device is locked — check if force-unlock requested
        const heldPath = resolve(lockDir, `${resourceName}.lock.held`);
        const lockData = readLockData(heldPath);
        const staleInfo = lockData ? isLockStale(lockData) : { stale: true, reason: 'Lock data is corrupt' };

        if (opts.forceUnlock) {
          // Force-unlock: remove existing lock and re-acquire
          releaseLock({ heldPath });
          const newLock = acquireLock(lockDir, resourceName, { project: projectRoot, device: opts.device });
          if (!newLock) {
            error('session.start', 'Failed to acquire lock after force-unlock.');
          }
          // Continue with newLock
          startSession(newLock, opts, projectRoot, evidenceDir, config);
          return;
        }

        // Build diagnostic error message
        const parts = [`Device ${opts.device} is already locked.`];
        if (lockData) {
          if (lockData.session_id) parts.push(`Session: ${lockData.session_id}`);
          if (lockData.project) parts.push(`Project: ${lockData.project}`);
          if (lockData.pid) parts.push(`PID: ${lockData.pid}`);
          if (lockData.locked_at) parts.push(`Locked at: ${lockData.locked_at}`);
        }
        if (staleInfo.stale) {
          parts.push(`Status: STALE (${staleInfo.reason})`);
          parts.push(`Use --force-unlock to take over: proofrun session start --device ${opts.device} --change <name> --force-unlock`);
        } else {
          parts.push(`Status: ACTIVE (${staleInfo.reason})`);
          parts.push(`This device is in use by another session. Ask human for approval before using --force-unlock.`);
        }
        error('session.start', parts.join('\n'));
      }

      startSession(lock, opts, projectRoot, evidenceDir, config);
    });

  session
    .command('stop')
    .description('Stop the active verification session — release device lock')
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

      // Release device lock from global lock dir
      const lockDir = getGlobalLockDir();
      if (state.device) {
        const heldPath = resolve(lockDir, `dev-${state.device}.lock.held`);
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

      // Check for unfilled knowledge placeholders
      const knowledgePlaceholders = scanKnowledgePlaceholders(config._knowledgeDir);

      // Check for plan coverage gaps
      const planGaps = checkPlanCoverage(sessionDir, evidence);

      success('session.stop', {
        session_id: active.sessionId,
        released_device: state.device,
        evidence_entries: entryCount,
        duration_seconds: duration,
        knowledge_placeholders: knowledgePlaceholders,
        plan_gaps: planGaps,
      }, (data) => {
        const lines = [
          `Session stopped: ${data.session_id}`,
          `Released device: ${data.released_device}`,
          `Evidence entries: ${data.evidence_entries}`,
          `Duration: ${data.duration_seconds}s`,
        ];
        if (data.knowledge_placeholders.length > 0) {
          lines.push('');
          lines.push('Warning: Unfilled knowledge placeholders:');
          for (const kp of data.knowledge_placeholders) {
            lines.push(`  ${kp}`);
          }
          lines.push('Consider filling these while context is fresh.');
        }
        if (data.plan_gaps.length > 0) {
          lines.push('');
          lines.push('Warning: Unverified planned criteria:');
          for (const gap of data.plan_gaps) {
            lines.push(`  ✗ ${gap.criterion}: ${gap.spec}`);
          }
        }
        return lines.join('\n');
      });
    });

  session
    .command('status')
    .description('Show active session info or lock state')
    .action(async () => {
      const rawConfig = requireConfig('session.status');
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);
      const lockDir = getGlobalLockDir();

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
          device: state.device,
          started_at: state.started_at,
          evidence_entries: entryCount,
          locked_resources: locks,
        }, (data) =>
          `Session: ${data.session_id} (active)\n` +
          `Change: ${data.change_name}\n` +
          `Device: ${data.device}\n` +
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

function startSession(lock, opts, projectRoot, evidenceDir, config) {
  const sessionId = generateSessionId();
  const sessionDir = createSessionDir(evidenceDir, sessionId);

  const sessionState = {
    session_id: sessionId,
    status: 'active',
    change_name: opts.change,
    started_at: new Date().toISOString(),
    stopped_at: null,
    device: opts.device,
    reason: opts.reason || null,
  };

  saveSessionState(sessionDir, sessionState);
  initEvidence(sessionDir, sessionId, opts.change, opts.device);

  // Update lock held file with real session ID
  updateLockSessionId(lock.heldPath, sessionId);

  success('session.start', {
    session_id: sessionId,
    change_name: opts.change,
    device: opts.device,
    reason: opts.reason || null,
    session_dir: `.proofrun/sessions/${sessionId}`,
  }, (data) =>
    `Session started: ${data.session_id}\n` +
    `Change: ${data.change_name}\n` +
    `Device: ${data.device}\n` +
    (data.reason ? `Reason: ${data.reason}\n` : '') +
    `Session dir: ${data.session_dir}`
  );
}

function scanKnowledgePlaceholders(knowledgeDir) {
  if (!knowledgeDir || !existsSync(knowledgeDir)) return [];

  const results = [];
  try {
    const files = readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = readFileSync(resolve(knowledgeDir, file), 'utf8');
      if (/<!--\s*Agent:/i.test(content)) {
        results.push(file);
      }
    }
  } catch {
    // Knowledge dir unreadable — skip silently
  }
  return results;
}

function checkPlanCoverage(sessionDir, evidence) {
  const planPath = resolve(sessionDir, 'plan.json');
  if (!existsSync(planPath)) return [];

  let plan;
  try {
    plan = JSON.parse(readFileSync(planPath, 'utf8'));
  } catch {
    return [];
  }

  if (!Array.isArray(plan?.criteria)) return [];

  const judgments = evidence?.entries?.filter(e => e.type === 'judgment') || [];
  const judgedCriteria = new Set(judgments.map(j => j.criterion));

  return plan.criteria
    .filter(c => !c.carried && !judgedCriteria.has(c.criterion))
    .map(c => ({ criterion: c.criterion, spec: c.spec }));
}
