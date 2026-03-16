import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { acquireLock, releaseLock, listLocks } from './locking.js';

describe('acquireLock', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-lock-test-'));
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('acquires a lock for a named resource', () => {
    const lock = acquireLock(lockDir, 'sim-UDID-1234');
    assert.notEqual(lock, null);
    assert.ok(lock.heldPath.endsWith('.lock.held'));
    releaseLock(lock);
  });

  it('returns null when resource is already locked', () => {
    const lock1 = acquireLock(lockDir, 'sim-UDID-1234');
    assert.notEqual(lock1, null);

    const lock2 = acquireLock(lockDir, 'sim-UDID-1234');
    assert.equal(lock2, null);

    releaseLock(lock1);
  });

  it('can acquire same resource after release', () => {
    const lock1 = acquireLock(lockDir, 'sim-UDID-1234');
    releaseLock(lock1);

    const lock2 = acquireLock(lockDir, 'sim-UDID-1234');
    assert.notEqual(lock2, null);
    releaseLock(lock2);
  });

  it('different resources can be locked independently', () => {
    const lockA = acquireLock(lockDir, 'sim-UDID-AAAA');
    const lockB = acquireLock(lockDir, 'sim-UDID-BBBB');
    assert.notEqual(lockA, null);
    assert.notEqual(lockB, null);
    releaseLock(lockA);
    releaseLock(lockB);
  });

  it('held file can be overwritten with session ID', () => {
    const lock = acquireLock(lockDir, 'sim-UDID-5678');
    assert.notEqual(lock, null);
    writeFileSync(lock.heldPath, 'session-abc123');
    const content = readFileSync(lock.heldPath, 'utf8').trim();
    assert.equal(content, 'session-abc123');
    releaseLock(lock);
  });
});

describe('releaseLock', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-lock-test-'));
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('is a no-op on null', () => {
    assert.doesNotThrow(() => releaseLock(null));
  });

  it('releases the held file', () => {
    const lock = acquireLock(lockDir, 'sim-UDID-9999');
    assert.notEqual(lock, null);
    releaseLock(lock);

    // Should be lockable again
    const lock2 = acquireLock(lockDir, 'sim-UDID-9999');
    assert.notEqual(lock2, null);
    releaseLock(lock2);
  });
});

describe('listLocks', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-list-lock-test-'));
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('returns empty array when no locks exist', () => {
    assert.deepEqual(listLocks(lockDir), []);
  });

  it('returns empty array for non-existent directory', () => {
    assert.deepEqual(listLocks(resolve(lockDir, 'nonexistent')), []);
  });

  it('lists locked resources with session IDs', () => {
    const lock1 = acquireLock(lockDir, 'sim-UDID-AAAA');
    const lock2 = acquireLock(lockDir, 'sim-UDID-BBBB');
    writeFileSync(lock1.heldPath, 'session-111');
    writeFileSync(lock2.heldPath, 'session-222');

    const locks = listLocks(lockDir);
    assert.equal(locks.length, 2);

    const resourceNames = locks.map(l => l.resource).sort();
    assert.deepEqual(resourceNames, ['sim-UDID-AAAA', 'sim-UDID-BBBB']);

    releaseLock(lock1);
    releaseLock(lock2);
  });

  it('does not include released locks', () => {
    const lock = acquireLock(lockDir, 'sim-UDID-TTTT');
    writeFileSync(lock.heldPath, 'session-xyz');
    releaseLock(lock);

    const locks = listLocks(lockDir);
    assert.equal(locks.length, 0);
  });
});
