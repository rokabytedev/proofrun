import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  ensureSimLockFiles, ensurePortLockFiles,
  acquireSimulatorSlot, acquirePort,
  isPortInUse, releaseLock,
} from './locking.js';

describe('acquireSimulatorSlot', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-lock-test-'));
    ensureSimLockFiles(lockDir, 5);
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('acquires slot 0 first', () => {
    const result = acquireSimulatorSlot(lockDir, 5);
    assert.notEqual(result, null);
    assert.equal(result.slot, 0);
    releaseLock(result.lock);
  });

  it('sequential acquires return different slots', () => {
    const r1 = acquireSimulatorSlot(lockDir, 5);
    const r2 = acquireSimulatorSlot(lockDir, 5);
    assert.notEqual(r1, null);
    assert.notEqual(r2, null);
    assert.notEqual(r1.slot, r2.slot);
    releaseLock(r1.lock);
    releaseLock(r2.lock);
  });

  it('returns null when all slots locked', () => {
    const locks = [];
    for (let i = 0; i < 3; i++) {
      locks.push(acquireSimulatorSlot(lockDir, 3));
    }
    const result = acquireSimulatorSlot(lockDir, 3);
    assert.equal(result, null);
    locks.forEach(l => releaseLock(l?.lock));
  });
});

describe('acquirePort', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-port-test-'));
    ensurePortLockFiles(lockDir, 19090, 19092);
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('acquires first available port', () => {
    const result = acquirePort(lockDir, 19090, 19092);
    assert.notEqual(result, null);
    assert.equal(result.port, 19090);
    releaseLock(result.lock);
  });

  it('sequential acquires return different ports', () => {
    const r1 = acquirePort(lockDir, 19090, 19092);
    const r2 = acquirePort(lockDir, 19090, 19092);
    assert.notEqual(r1, null);
    assert.notEqual(r2, null);
    assert.notEqual(r1.port, r2.port);
    releaseLock(r1.lock);
    releaseLock(r2.lock);
  });
});

describe('isPortInUse', () => {
  it('throws on non-integer port', () => {
    assert.throws(() => isPortInUse('abc'), /Invalid port number/);
  });

  it('throws on out-of-range port', () => {
    assert.throws(() => isPortInUse(99999), /Invalid port number/);
  });

  it('throws on negative port', () => {
    assert.throws(() => isPortInUse(-1), /Invalid port number/);
  });

  it('returns boolean for valid port', () => {
    const result = isPortInUse(19999);
    assert.equal(typeof result, 'boolean');
  });
});

describe('sessionBoundLocks', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-session-lock-test-'));
    ensureSimLockFiles(lockDir, 1);
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('lock held file can be overwritten with session ID', () => {
    const result = acquireSimulatorSlot(lockDir, 1);
    assert.notEqual(result, null);
    // Overwrite with session ID (as session start does)
    writeFileSync(result.lock.heldPath, 'session-abc123');
    const content = readFileSync(result.lock.heldPath, 'utf8').trim();
    assert.equal(content, 'session-abc123');
    releaseLock(result.lock);
  });
});
