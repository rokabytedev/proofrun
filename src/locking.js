import { openSync, existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync, closeSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

let flockAvailable = null;

function checkFlock() {
  if (flockAvailable !== null) return flockAvailable;
  try {
    execSync('which flock', { stdio: 'pipe' });
    flockAvailable = true;
  } catch {
    flockAvailable = false;
  }
  return flockAvailable;
}

export function getLockMechanism() {
  return checkFlock() ? 'flock' : 'pid-file';
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

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function tryAcquirePidLock(lockFilePath) {
  const heldPath = lockFilePath + '.held';
  if (existsSync(heldPath)) {
    try {
      const pid = parseInt(readFileSync(heldPath, 'utf8').trim(), 10);
      if (pid && isProcessAlive(pid)) {
        return null; // Lock held by live process
      }
    } catch {
      // Stale or corrupt — proceed to claim
    }
  }
  writeFileSync(heldPath, String(process.pid));
  // Verify we won the race
  try {
    const content = readFileSync(heldPath, 'utf8').trim();
    if (content !== String(process.pid)) return null;
  } catch {
    return null;
  }
  return { lockFile: lockFilePath, heldPath, pid: process.pid };
}

export function releaseLock(lock) {
  if (!lock) return;
  if (lock.heldPath) {
    try { unlinkSync(lock.heldPath); } catch { /* already released */ }
  }
}

export function isPortInUse(port) {
  try {
    execSync(`lsof -i :${port}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function acquireSimulatorSlot(lockDir, poolSize) {
  for (let i = 0; i < poolSize; i++) {
    const lockFile = resolve(lockDir, `sim-${i}.lock`);
    const lock = tryAcquirePidLock(lockFile);
    if (lock) return { slot: i, lock };
  }
  return null;
}

export function acquirePort(lockDir, start, end) {
  for (let port = start; port <= end; port++) {
    if (isPortInUse(port)) continue;
    const lockFile = resolve(lockDir, `port-${port}.lock`);
    const lock = tryAcquirePidLock(lockFile);
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
        const pid = parseInt(readFileSync(heldPath, 'utf8').trim(), 10);
        if (pid && isProcessAlive(pid)) {
          locked.push(i);
        }
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
        const pid = parseInt(readFileSync(heldPath, 'utf8').trim(), 10);
        if (pid && isProcessAlive(pid)) {
          locked.push(port);
        }
      } catch { /* stale */ }
    }
  }
  return locked;
}
