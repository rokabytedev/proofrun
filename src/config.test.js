import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { withDefaults, findConfigPath, validateConfig } from './config.js';

describe('withDefaults', () => {
  it('fills missing fields from defaults', () => {
    const config = withDefaults({});
    assert.equal(config.simulator.pool_size, 5);
    assert.equal(config.port_range.start, 8090);
    assert.equal(config.reports.embed_screenshots, true);
  });

  it('overrides defaults with explicit values', () => {
    const config = withDefaults({ simulator: { pool_size: 3 } });
    assert.equal(config.simulator.pool_size, 3);
  });

  it('deep merges nested objects', () => {
    const config = withDefaults({ port_range: { start: 9000 } });
    assert.equal(config.port_range.start, 9000);
    assert.equal(config.port_range.end, 8099);
  });

  it('does not merge arrays', () => {
    const config = withDefaults({ session: { lock_dir: '/custom/locks' } });
    assert.equal(config.session.lock_dir, '/custom/locks');
  });
});

describe('findConfigPath', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-test-'));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('finds config in current directory', () => {
    const proofrunDir = resolve(tmpDir, '.proofrun');
    mkdirSync(proofrunDir, { recursive: true });
    writeFileSync(resolve(proofrunDir, 'config.toml'), '[simulator]\npool_size = 5\n');
    const result = findConfigPath(tmpDir);
    assert.equal(result, resolve(proofrunDir, 'config.toml'));
  });

  it('finds config in parent directory', () => {
    const proofrunDir = resolve(tmpDir, '.proofrun');
    mkdirSync(proofrunDir, { recursive: true });
    writeFileSync(resolve(proofrunDir, 'config.toml'), '[simulator]\npool_size = 5\n');
    const nested = resolve(tmpDir, 'a', 'b', 'c');
    mkdirSync(nested, { recursive: true });
    const result = findConfigPath(nested);
    assert.equal(result, resolve(proofrunDir, 'config.toml'));
  });

  it('returns null when no config exists', () => {
    const result = findConfigPath(tmpDir);
    assert.equal(result, null);
  });
});

describe('validateConfig', () => {
  it('returns no errors for a valid config', () => {
    const config = {
      simulator: { pool_size: 5 },
      port_range: { start: 8090, end: 8099 },
    };
    const errors = validateConfig(config);
    assert.equal(errors.length, 0);
  });

  it('returns no errors for empty config (preferences are optional)', () => {
    const errors = validateConfig({});
    assert.equal(errors.length, 0);
  });

  it('detects non-integer pool_size', () => {
    const errors = validateConfig({ simulator: { pool_size: 'five' } });
    assert.ok(errors.some(e => e.includes('pool_size')));
  });

  it('detects non-integer port_range.start', () => {
    const errors = validateConfig({ port_range: { start: 'abc', end: 8099 } });
    assert.ok(errors.some(e => e.includes('port_range.start')));
  });

  it('detects non-integer port_range.end', () => {
    const errors = validateConfig({ port_range: { start: 8090, end: 80.5 } });
    assert.ok(errors.some(e => e.includes('port_range.end')));
  });
});
