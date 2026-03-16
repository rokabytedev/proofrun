import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

export function getLockMechanism() {
  return 'session-bound';
}

export function ensureLockDir(lockDir) {
  mkdirSync(lockDir, { recursive: true });
}

export function ensureSimLockFiles(lockDir, poolSize) {
  ensureLockDir(lockDir);
  for (let i = 0; i < poolSize; i++) {
    const p = resolve(lockDir, `sim-${i}.lock`);
    if (!existsSync(p)) writeFileSync(p, '');
  }
}

export function ensurePortLockFiles(lockDir, start, end) {
  ensureLockDir(lockDir);
  for (let port = start; port <= end; port++) {
    const p = resolve(lockDir, `port-${port}.lock`);
    if (!existsSync(p)) writeFileSync(p, '');
  }
}

// Session-bound locking: held files contain a session ID.
// A lock is "held" if the held file exists and contains a non-empty value.
// Stale detection is done at session level (findActiveSession), not lock level.

function tryAcquireSessionLock(lockFilePath) {
  const heldPath = lockFilePath + '.held';
  if (existsSync(heldPath)) {
    try {
      const content = readFileSync(heldPath, 'utf8').trim();
      if (content) return null; // Lock held by a session
    } catch {
      // Corrupt — proceed to claim
    }
  }
  // Claim the lock with a placeholder (session start will overwrite with session ID)
  writeFileSync(heldPath, String(process.pid));
  // Verify we won the race (best-effort)
  try {
    const content = readFileSync(heldPath, 'utf8').trim();
    if (content !== String(process.pid)) return null;
  } catch {
    return null;
  }
  return { lockFile: lockFilePath, heldPath };
}

export function releaseLock(lock) {
  if (!lock) return;
  if (lock.heldPath) {
    try { unlinkSync(lock.heldPath); } catch { /* already released */ }
  }
}

export function isPortInUse(port) {
  const portNum = Number(port);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error(`Invalid port number: ${port}`);
  }
  try {
    execSync(`lsof -i :${portNum}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function acquireSimulatorSlot(lockDir, poolSize) {
  for (let i = 0; i < poolSize; i++) {
    const lockFile = resolve(lockDir, `sim-${i}.lock`);
    const lock = tryAcquireSessionLock(lockFile);
    if (lock) return { slot: i, lock };
  }
  return null;
}

export function acquirePort(lockDir, start, end) {
  for (let port = start; port <= end; port++) {
    if (isPortInUse(port)) continue;
    const lockFile = resolve(lockDir, `port-${port}.lock`);
    const lock = tryAcquireSessionLock(lockFile);
    if (lock) return { port, lock };
  }
  return null;
}

export function getLockedSlots(lockDir, poolSize) {
  const locked = [];
  for (let i = 0; i < poolSize; i++) {
    const heldPath = resolve(lockDir, `sim-${i}.lock.held`);
    if (existsSync(heldPath)) {
      try {
        const content = readFileSync(heldPath, 'utf8').trim();
        if (content) locked.push(i);
      } catch { /* stale */ }
    }
  }
  return locked;
}

export function getLockedPorts(lockDir, start, end) {
  const locked = [];
  for (let port = start; port <= end; port++) {
    const heldPath = resolve(lockDir, `port-${port}.lock.held`);
    if (existsSync(heldPath)) {
      try {
        const content = readFileSync(heldPath, 'utf8').trim();
        if (content) locked.push(port);
      } catch { /* stale */ }
    }
  }
  return locked;
}
