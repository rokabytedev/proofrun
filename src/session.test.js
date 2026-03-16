import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  generateSessionId, createSessionDir, saveSessionState,
  loadSessionState, findActiveSession, initEvidence,
  loadEvidence, appendEvidence,
} from './session.js';

describe('generateSessionId', () => {
  it('returns a string with date prefix and random suffix', () => {
    const id = generateSessionId();
    assert.match(id, /^\d{14}-[a-z0-9]+$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) ids.add(generateSessionId());
    assert.equal(ids.size, 100);
  });
});

describe('appendEvidence', () => {
  let tmpDir, sessionDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-session-test-'));
    sessionDir = resolve(tmpDir, 'test-session');
    mkdirSync(resolve(sessionDir, 'screenshots'), { recursive: true });
    initEvidence(sessionDir, 'test-session', 'test-change', {}, 8090);
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('increments entry IDs sequentially', () => {
    const e1 = appendEvidence(sessionDir, { type: 'step', description: 'first' });
    const e2 = appendEvidence(sessionDir, { type: 'step', description: 'second' });
    const e3 = appendEvidence(sessionDir, { type: 'note', text: 'third' });
    assert.equal(e1.id, 1);
    assert.equal(e2.id, 2);
    assert.equal(e3.id, 3);
  });

  it('sets timestamps on entries', () => {
    const entry = appendEvidence(sessionDir, { type: 'step', description: 'test' });
    assert.ok(entry.timestamp);
    assert.ok(new Date(entry.timestamp).getTime() > 0);
  });

  it('persists entries to evidence.json', () => {
    appendEvidence(sessionDir, { type: 'step', description: 'first' });
    appendEvidence(sessionDir, { type: 'note', text: 'second' });
    const evidence = loadEvidence(sessionDir);
    assert.equal(evidence.entries.length, 2);
    assert.equal(evidence.entries[0].description, 'first');
    assert.equal(evidence.entries[1].text, 'second');
  });
});

describe('loadEvidence', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-evidence-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null for missing file', () => {
    assert.equal(loadEvidence(tmpDir), null);
  });

  it('returns null for corrupted JSON', () => {
    writeFileSync(resolve(tmpDir, 'evidence.json'), '{not valid json');
    assert.equal(loadEvidence(tmpDir), null);
  });
});

describe('loadSessionState', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-state-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null for missing file', () => {
    assert.equal(loadSessionState(tmpDir), null);
  });

  it('returns null for corrupted JSON', () => {
    writeFileSync(resolve(tmpDir, 'state.json'), 'garbage');
    assert.equal(loadSessionState(tmpDir), null);
  });
});

describe('findActiveSession', () => {
  let tmpDir, evidenceDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-find-test-'));
    evidenceDir = resolve(tmpDir, 'sessions');
    mkdirSync(evidenceDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns null when no sessions exist', () => {
    assert.equal(findActiveSession(evidenceDir, tmpDir), null);
  });

  it('returns null for non-existent evidence dir', () => {
    assert.equal(findActiveSession(resolve(tmpDir, 'nonexistent'), tmpDir), null);
  });

  it('picks the newest active session', () => {
    // Create two sessions — second is newer (sorted reverse)
    const s1Dir = resolve(evidenceDir, '20260101-aaaaaa');
    const s2Dir = resolve(evidenceDir, '20260102-bbbbbb');
    mkdirSync(s1Dir, { recursive: true });
    mkdirSync(s2Dir, { recursive: true });

    // s1 is stopped, s2 is active with current PID (alive)
    saveSessionState(s1Dir, { session_id: 's1', status: 'stopped' });
    saveSessionState(s2Dir, { session_id: 's2', status: 'active', dev_server: { pid: process.pid } });

    const result = findActiveSession(evidenceDir, tmpDir);
    assert.equal(result.sessionId, '20260102-bbbbbb');
  });

  it('detects stale session with dead PID and marks it crashed', () => {
    const sDir = resolve(evidenceDir, '20260101-stale1');
    mkdirSync(sDir, { recursive: true });
    saveSessionState(sDir, {
      session_id: 'stale1', status: 'active',
      dev_server: { pid: 999999 }, // Dead PID
      simulator: { slot: 0 },
      port: { number: 8090 },
    });

    const result = findActiveSession(evidenceDir, tmpDir);
    // Should have recovered but no active session
    assert.ok(!result || !result.sessionId);

    // Verify session was marked crashed
    const state = loadSessionState(sDir);
    assert.equal(state.status, 'crashed');
    assert.ok(state.stopped_at);
  });

  it('detects stale session without PID and marks it crashed', () => {
    const sDir = resolve(evidenceDir, '20260101-nopid1');
    mkdirSync(sDir, { recursive: true });
    saveSessionState(sDir, { session_id: 'nopid1', status: 'active' });

    const result = findActiveSession(evidenceDir, tmpDir);
    assert.ok(!result || !result.sessionId);

    const state = loadSessionState(sDir);
    assert.equal(state.status, 'crashed');
  });
});
