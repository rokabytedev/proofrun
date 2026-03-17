import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Returns the system-global lock directory: ~/.proofrun/locks/
 * Creates it on first call.
 */
export function getGlobalLockDir() {
  const lockDir = join(homedir(), '.proofrun', 'locks');
  mkdirSync(lockDir, { recursive: true });
  return lockDir;
}

/**
 * Acquire a named resource lock in the global lock directory.
 * Held sidecar: <lockDir>/<resourceName>.lock.held (contains JSON metadata)
 *
 * Returns { lockFile, heldPath } on success, null if already locked.
 */
export function acquireLock(lockDir, resourceName, { project = process.cwd(), device = null } = {}) {
  mkdirSync(lockDir, { recursive: true });
  const lockFile = resolve(lockDir, `${resourceName}.lock`);
  const heldPath = lockFile + '.held';

  if (existsSync(heldPath)) {
    try {
      const content = readFileSync(heldPath, 'utf8').trim();
      if (content) return null; // Already locked
    } catch {
      // Corrupt held file — proceed to claim
    }
  }

  // Claim the lock with initial metadata
  const lockData = {
    session_id: `pending-${process.pid}`,
    project,
    device: device || resourceName.replace(/^dev-/, ''),
    locked_at: new Date().toISOString(),
    pid: process.pid,
  };
  writeFileSync(heldPath, JSON.stringify(lockData, null, 2));

  // Verify we won the race (best-effort)
  try {
    const written = JSON.parse(readFileSync(heldPath, 'utf8'));
    if (written.pid !== process.pid) return null;
  } catch {
    return null;
  }

  return { lockFile, heldPath };
}

/**
 * Update the session ID in a lock held file after session creation.
 */
export function updateLockSessionId(heldPath, sessionId) {
  try {
    const data = JSON.parse(readFileSync(heldPath, 'utf8'));
    data.session_id = sessionId;
    writeFileSync(heldPath, JSON.stringify(data, null, 2));
  } catch { /* ignore if lock was already released */ }
}

/**
 * Read and parse a lock held file. Returns the parsed object or null.
 */
export function readLockData(heldPath) {
  if (!existsSync(heldPath)) return null;
  try {
    const content = readFileSync(heldPath, 'utf8').trim();
    if (!content) return null;
    // Handle legacy format (plain session ID string)
    if (!content.startsWith('{')) {
      return { session_id: content, project: null, device: null, locked_at: null, pid: null };
    }
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if a lock is stale by verifying PID liveness and session state.
 * Returns { stale: boolean, reason: string }
 */
export function isLockStale(lockData) {
  if (!lockData) return { stale: true, reason: 'Lock data is missing or corrupt' };
  if (!lockData.pid) return { stale: false, reason: 'No PID recorded — cannot determine' };

  // Check if PID is alive
  try {
    process.kill(lockData.pid, 0); // Signal 0 tests existence without killing
  } catch {
    return { stale: true, reason: `PID ${lockData.pid} is not running` };
  }

  // PID is alive — check session state if we can
  if (lockData.project && lockData.session_id && !lockData.session_id.startsWith('pending-')) {
    try {
      const statePath = resolve(lockData.project, '.proofrun', 'sessions', lockData.session_id, 'state.json');
      if (existsSync(statePath)) {
        const state = JSON.parse(readFileSync(statePath, 'utf8'));
        if (state.status === 'stopped') {
          return { stale: true, reason: `Session ${lockData.session_id} is stopped but lock was not released` };
        }
      }
    } catch { /* can't read state — assume active */ }
  }

  return { stale: false, reason: 'PID is alive and session is active' };
}

/**
 * Release a lock by removing its held sidecar file.
 */
export function releaseLock(lock) {
  if (!lock) return;
  if (lock.heldPath) {
    try { unlinkSync(lock.heldPath); } catch { /* already released */ }
  }
}

/**
 * List all locked resources in lockDir.
 * Returns [{ resource, sessionId, lockData, staleInfo }]
 */
export function listLocks(lockDir) {
  if (!existsSync(lockDir)) return [];
  const locked = [];
  const files = readdirSync(lockDir).filter(f => f.endsWith('.lock.held'));
  for (const file of files) {
    const heldPath = resolve(lockDir, file);
    const lockData = readLockData(heldPath);
    if (lockData) {
      const resource = file.slice(0, -'.lock.held'.length);
      const staleInfo = isLockStale(lockData);
      locked.push({
        resource,
        sessionId: lockData.session_id,
        lockData,
        staleInfo,
      });
    }
  }
  return locked;
}
