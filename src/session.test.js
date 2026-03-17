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
    initEvidence(sessionDir, 'test-session', 'test-change', 'UDID-1234');
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
    assert.equal(findActiveSession(evidenceDir), null);
  });

  it('returns null for non-existent evidence dir', () => {
    assert.equal(findActiveSession(resolve(tmpDir, 'nonexistent')), null);
  });

  it('picks the newest active session', () => {
    const s1Dir = resolve(evidenceDir, '20260101-aaaaaa');
    const s2Dir = resolve(evidenceDir, '20260102-bbbbbb');
    mkdirSync(s1Dir, { recursive: true });
    mkdirSync(s2Dir, { recursive: true });

    saveSessionState(s1Dir, { session_id: 's1', status: 'stopped' });
    saveSessionState(s2Dir, { session_id: 's2', status: 'active', device: 'UDID-ABC' });

    const result = findActiveSession(evidenceDir);
    assert.equal(result.sessionId, '20260102-bbbbbb');
  });

  it('returns null when all sessions are stopped', () => {
    const sDir = resolve(evidenceDir, '20260101-stopped1');
    mkdirSync(sDir, { recursive: true });
    saveSessionState(sDir, { session_id: 'stopped1', status: 'stopped' });

    const result = findActiveSession(evidenceDir);
    assert.equal(result, null);
  });

  it('a session without PID is still active (no PID check)', () => {
    const sDir = resolve(evidenceDir, '20260101-nopid1');
    mkdirSync(sDir, { recursive: true });
    saveSessionState(sDir, { session_id: 'nopid1', status: 'active', device: 'UDID-XYZ' });

    const result = findActiveSession(evidenceDir);
    assert.equal(result.sessionId, '20260101-nopid1');
    assert.equal(result.state.status, 'active');
  });
});

describe('initEvidence', () => {
  let tmpDir, sessionDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-init-evidence-test-'));
    sessionDir = resolve(tmpDir, 'test-session');
    mkdirSync(resolve(sessionDir, 'screenshots'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('stores device identifier string', () => {
    initEvidence(sessionDir, 'test-session', 'test-change', 'B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466');
    const evidence = loadEvidence(sessionDir);
    assert.equal(evidence.device, 'B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466');
  });

  it('stores null when no device identifier provided', () => {
    initEvidence(sessionDir, 'test-session', 'test-change', null);
    const evidence = loadEvidence(sessionDir);
    assert.equal(evidence.device, null);
  });

  it('does not store port', () => {
    initEvidence(sessionDir, 'test-session', 'test-change', 'UDID-1234');
    const evidence = loadEvidence(sessionDir);
    assert.equal(evidence.port, undefined);
  });
});
