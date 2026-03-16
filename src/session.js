import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';

export function generateSessionId() {
  const now = new Date();
  const date = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${date}-${rand}`;
}

export function getSessionDir(evidenceDir, sessionId) {
  return resolve(evidenceDir, sessionId);
}

export function createSessionDir(evidenceDir, sessionId) {
  const sessionDir = getSessionDir(evidenceDir, sessionId);
  mkdirSync(resolve(sessionDir, 'screenshots'), { recursive: true });
  return sessionDir;
}

export function saveSessionState(sessionDir, state) {
  writeFileSync(resolve(sessionDir, 'state.json'), JSON.stringify(state, null, 2));
}

export function loadSessionState(sessionDir) {
  const statePath = resolve(sessionDir, 'state.json');
  if (!existsSync(statePath)) return null;
  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return null; // Corrupted state file
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

function cleanupStaleLocks(state, projectRoot) {
  if (!projectRoot) return;
  const lockDir = resolve(projectRoot, '.proofrun', 'locks');
  if (state.simulator?.slot !== undefined) {
    const p = resolve(lockDir, `sim-${state.simulator.slot}.lock.held`);
    try { unlinkSync(p); } catch { /* already gone */ }
  }
  if (state.port?.number !== undefined) {
    const p = resolve(lockDir, `port-${state.port.number}.lock.held`);
    try { unlinkSync(p); } catch { /* already gone */ }
  }
}

export function findActiveSession(evidenceDir, projectRoot) {
  if (!existsSync(evidenceDir)) return null;
  const dirs = readdirSync(evidenceDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()
    .reverse();

  const recoveredSessions = [];

  for (const dir of dirs) {
    const sessionDir = resolve(evidenceDir, dir);
    const state = loadSessionState(sessionDir);
    if (state && state.status === 'active') {
      // Check if dev server is still alive
      const pid = state.dev_server?.pid;
      if (!pid || !isProcessAlive(pid)) {
        // Stale session — auto-recover
        state.status = 'crashed';
        state.stopped_at = new Date().toISOString();
        saveSessionState(sessionDir, state);
        cleanupStaleLocks(state, projectRoot);
        recoveredSessions.push(dir);
        continue;
      }
      return { sessionId: dir, sessionDir, state, recoveredSessions };
    }
  }
  // No active session found, but we may have recovered stale ones
  return recoveredSessions.length > 0
    ? { sessionId: null, sessionDir: null, state: null, recoveredSessions }
    : null;
}

export function initEvidence(sessionDir, sessionId, changeName, simulator, port) {
  const evidence = {
    session_id: sessionId,
    change_name: changeName,
    started_at: new Date().toISOString(),
    simulator: simulator || {},
    port: port || null,
    entries: [],
  };
  writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
  return evidence;
}

export function loadEvidence(sessionDir) {
  const evidencePath = resolve(sessionDir, 'evidence.json');
  if (!existsSync(evidencePath)) return null;
  try {
    return JSON.parse(readFileSync(evidencePath, 'utf8'));
  } catch {
    return null; // Corrupted evidence file
  }
}

export function appendEvidence(sessionDir, entry) {
  const evidence = loadEvidence(sessionDir);
  if (!evidence) throw new Error('No evidence.json found in session directory');
  entry.id = evidence.entries.length + 1;
  entry.timestamp = new Date().toISOString();
  evidence.entries.push(entry);
  writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence, null, 2));
  return entry;
}
