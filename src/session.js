import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

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

export function findActiveSession(evidenceDir) {
  if (!existsSync(evidenceDir)) return null;
  const dirs = readdirSync(evidenceDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort()
    .reverse();

  for (const dir of dirs) {
    const sessionDir = resolve(evidenceDir, dir);
    const state = loadSessionState(sessionDir);
    if (state && state.status === 'active') {
      return { sessionId: dir, sessionDir, state };
    }
  }
  return null;
}

export function initEvidence(sessionDir, sessionId, changeName, deviceId) {
  const evidence = {
    session_id: sessionId,
    change_name: changeName,
    started_at: new Date().toISOString(),
    device: deviceId || null,
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
