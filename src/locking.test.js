import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, rmSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import {
  acquireLock, releaseLock, listLocks,
  getGlobalLockDir, readLockData, isLockStale, updateLockSessionId,
} from './locking.js';

describe('getGlobalLockDir', () => {
  it('returns ~/.proofrun/locks/', () => {
    const dir = getGlobalLockDir();
    assert.equal(dir, join(homedir(), '.proofrun', 'locks'));
  });

  it('creates directory if it does not exist', () => {
    const dir = getGlobalLockDir();
    assert.ok(existsSync(dir));
  });
});

describe('acquireLock', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-lock-test-'));
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('acquires a lock for a named resource', () => {
    const lock = acquireLock(lockDir, 'dev-UDID-1234');
    assert.notEqual(lock, null);
    assert.ok(lock.heldPath.endsWith('.lock.held'));
    releaseLock(lock);
  });

  it('writes JSON metadata to held file', () => {
    const lock = acquireLock(lockDir, 'dev-UDID-1234', { project: '/test/project', device: 'UDID-1234' });
    assert.notEqual(lock, null);
    const data = JSON.parse(readFileSync(lock.heldPath, 'utf8'));
    assert.ok(data.session_id.startsWith('pending-'));
    assert.equal(data.project, '/test/project');
    assert.equal(data.device, 'UDID-1234');
    assert.equal(data.pid, process.pid);
    assert.ok(data.locked_at);
    releaseLock(lock);
  });

  it('returns null when resource is already locked', () => {
    const lock1 = acquireLock(lockDir, 'dev-UDID-1234');
    assert.notEqual(lock1, null);
    const lock2 = acquireLock(lockDir, 'dev-UDID-1234');
    assert.equal(lock2, null);
    releaseLock(lock1);
  });

  it('can acquire same resource after release', () => {
    const lock1 = acquireLock(lockDir, 'dev-UDID-1234');
    releaseLock(lock1);
    const lock2 = acquireLock(lockDir, 'dev-UDID-1234');
    assert.notEqual(lock2, null);
    releaseLock(lock2);
  });

  it('different resources can be locked independently', () => {
    const lockA = acquireLock(lockDir, 'dev-UDID-AAAA');
    const lockB = acquireLock(lockDir, 'dev-UDID-BBBB');
    assert.notEqual(lockA, null);
    assert.notEqual(lockB, null);
    releaseLock(lockA);
    releaseLock(lockB);
  });
});

describe('readLockData', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-lockdata-test-'));
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('reads JSON lock data', () => {
    const lock = acquireLock(lockDir, 'dev-UDID-1234', { project: '/test', device: 'UDID-1234' });
    const data = readLockData(lock.heldPath);
    assert.equal(data.project, '/test');
    assert.equal(data.device, 'UDID-1234');
    assert.equal(data.pid, process.pid);
    releaseLock(lock);
  });

  it('returns null for non-existent file', () => {
    const data = readLockData(resolve(lockDir, 'nonexistent.lock.held'));
    assert.equal(data, null);
  });

  it('handles legacy plain-text format', () => {
    const heldPath = resolve(lockDir, 'dev-old.lock.held');
    writeFileSync(heldPath, 'session-legacy-123');
    const data = readLockData(heldPath);
    assert.equal(data.session_id, 'session-legacy-123');
    assert.equal(data.pid, null);
  });
});

describe('updateLockSessionId', () => {
  let lockDir;

  beforeEach(() => {
    lockDir = mkdtempSync(join(tmpdir(), 'proofrun-update-test-'));
  });

  afterEach(() => {
    rmSync(lockDir, { recursive: true, force: true });
  });

  it('updates session_id in lock held file', () => {
    const lock = acquireLock(lockDir, 'dev-UDID-5678');
    updateLockSessionId(lock.heldPath, 'real-session-abc');
    const data = JSON.parse(readFileSync(lock.heldPath, 'utf8'));
    assert.equal(data.session_id, 'real-session-abc');
    releaseLock(lock);
  });
});

describe('isLockStale', () => {
  it('returns stale when lock data is null', () => {
    const result = isLockStale(null);
    assert.equal(result.stale, true);
  });

  it('returns not stale for current process PID', () => {
    const result = isLockStale({ pid: process.pid, session_id: 'test', project: null });
    assert.equal(result.stale, false);
  });

  it('returns stale for a dead PID', () => {
    // PID 99999999 is almost certainly not running
    const result = isLockStale({ pid: 99999999, session_id: 'test', project: null });
    assert.equal(result.stale, true);
    assert.ok(result.reason.includes('not running'));
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
    const lock = acquireLock(lockDir, 'dev-UDID-9999');
    assert.notEqual(lock, null);
    releaseLock(lock);
    const lock2 = acquireLock(lockDir, 'dev-UDID-9999');
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

  it('lists locked resources with session IDs and stale info', () => {
    const lock1 = acquireLock(lockDir, 'dev-UDID-AAAA');
    const lock2 = acquireLock(lockDir, 'dev-UDID-BBBB');

    const locks = listLocks(lockDir);
    assert.equal(locks.length, 2);

    const resourceNames = locks.map(l => l.resource).sort();
    assert.deepEqual(resourceNames, ['dev-UDID-AAAA', 'dev-UDID-BBBB']);

    // Each lock should have lockData and staleInfo
    for (const l of locks) {
      assert.ok(l.lockData);
      assert.ok(l.staleInfo);
      assert.equal(l.staleInfo.stale, false); // current process PID
    }

    releaseLock(lock1);
    releaseLock(lock2);
  });

  it('does not include released locks', () => {
    const lock = acquireLock(lockDir, 'dev-UDID-TTTT');
    releaseLock(lock);
    const locks = listLocks(lockDir);
    assert.equal(locks.length, 0);
  });
});
