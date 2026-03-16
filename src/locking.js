import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

export function ensureLockDir(lockDir) {
  mkdirSync(lockDir, { recursive: true });
}

/**
 * Acquire a named resource lock.
 * Lock file: <lockDir>/<resourceName>.lock
 * Held sidecar: <lockDir>/<resourceName>.lock.held (contains sessionId)
 *
 * Returns { lockFile, heldPath } on success, null if already locked.
 */
export function acquireLock(lockDir, resourceName) {
  ensureLockDir(lockDir);
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

  // Claim the lock with process PID as placeholder (overwritten with session ID later)
  writeFileSync(heldPath, String(process.pid));

  // Verify we won the race (best-effort)
  try {
    const content = readFileSync(heldPath, 'utf8').trim();
    if (content !== String(process.pid)) return null;
  } catch {
    return null;
  }

  return { lockFile, heldPath };
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
 * Returns [{ resource, sessionId }]
 */
export function listLocks(lockDir) {
  if (!existsSync(lockDir)) return [];
  const locked = [];
  const files = readdirSync(lockDir).filter(f => f.endsWith('.lock.held'));
  for (const file of files) {
    const heldPath = resolve(lockDir, file);
    try {
      const sessionId = readFileSync(heldPath, 'utf8').trim();
      if (sessionId) {
        // resource name: strip ".lock.held"
        const resource = file.slice(0, -'.lock.held'.length);
        locked.push({ resource, sessionId });
      }
    } catch { /* stale */ }
  }
  return locked;
}
