import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { withDefaults, findConfigPath, validateConfig } from './config.js';

describe('withDefaults', () => {
  it('fills missing fields from defaults', () => {
    const config = withDefaults({ platform: 'ios' });
    assert.equal(config.platform, 'ios');
    assert.equal(config.simulator.pool_size, 5);
    assert.equal(config.port_range.start, 8090);
    assert.equal(config.session.max_retries_per_ac, 2);
  });

  it('overrides defaults with explicit values', () => {
    const config = withDefaults({ platform: 'android', simulator: { pool_size: 3 } });
    assert.equal(config.platform, 'android');
    assert.equal(config.simulator.pool_size, 3);
  });

  it('deep merges nested objects', () => {
    const config = withDefaults({ simulator: { pool_size: 2 } });
    // Should keep default device_types even though pool_size was overridden
    assert.equal(config.simulator.pool_size, 2);
    assert.equal(config.simulator.device_types.default, 'iPhone 16 Pro');
  });

  it('does not merge arrays', () => {
    const config = withDefaults({ simulator: { device_types: { default: 'iPhone SE' } } });
    assert.equal(config.simulator.device_types.default, 'iPhone SE');
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
    writeFileSync(resolve(proofrunDir, 'config.yaml'), 'platform: ios');
    const result = findConfigPath(tmpDir);
    assert.equal(result, resolve(proofrunDir, 'config.yaml'));
  });

  it('finds config in parent directory', () => {
    const proofrunDir = resolve(tmpDir, '.proofrun');
    mkdirSync(proofrunDir, { recursive: true });
    writeFileSync(resolve(proofrunDir, 'config.yaml'), 'platform: ios');
    const nested = resolve(tmpDir, 'a', 'b', 'c');
    mkdirSync(nested, { recursive: true });
    const result = findConfigPath(nested);
    assert.equal(result, resolve(proofrunDir, 'config.yaml'));
  });

  it('returns null when no config exists', () => {
    const result = findConfigPath(tmpDir);
    assert.equal(result, null);
  });
});

describe('validateConfig', () => {
  it('returns no errors for a valid config', () => {
    const config = {
      platform: 'ios',
      app: { bundle_id: 'com.example.app' },
      dev_server: { start: 'npx expo start --port {{port}}' },
      simulator: { pool_size: 5 },
      port_range: { start: 8090, end: 8099 },
    };
    const errors = validateConfig(config);
    assert.equal(errors.length, 0);
  });

  it('detects missing platform', () => {
    const errors = validateConfig({ app: { bundle_id: 'x' }, dev_server: { start: 'cmd' } });
    assert.ok(errors.some(e => e.includes('platform')));
  });

  it('detects missing app.bundle_id', () => {
    const errors = validateConfig({ platform: 'ios', dev_server: { start: 'cmd' } });
    assert.ok(errors.some(e => e.includes('app.bundle_id')));
  });

  it('detects empty app.bundle_id', () => {
    const errors = validateConfig({ platform: 'ios', app: { bundle_id: '' }, dev_server: { start: 'cmd' } });
    assert.ok(errors.some(e => e.includes('app.bundle_id')));
  });

  it('detects missing dev_server.start', () => {
    const errors = validateConfig({ platform: 'ios', app: { bundle_id: 'x' } });
    assert.ok(errors.some(e => e.includes('dev_server.start')));
  });

  it('detects non-integer pool_size', () => {
    const errors = validateConfig({
      platform: 'ios', app: { bundle_id: 'x' }, dev_server: { start: 'cmd' },
      simulator: { pool_size: 'five' },
    });
    assert.ok(errors.some(e => e.includes('pool_size')));
  });

  it('detects non-integer port_range.start', () => {
    const errors = validateConfig({
      platform: 'ios', app: { bundle_id: 'x' }, dev_server: { start: 'cmd' },
      port_range: { start: 'abc', end: 8099 },
    });
    assert.ok(errors.some(e => e.includes('port_range.start')));
  });

  it('detects non-integer port_range.end', () => {
    const errors = validateConfig({
      platform: 'ios', app: { bundle_id: 'x' }, dev_server: { start: 'cmd' },
      port_range: { start: 8090, end: 80.5 },
    });
    assert.ok(errors.some(e => e.includes('port_range.end')));
  });

  it('detects non-positive startup_timeout', () => {
    const errors = validateConfig({
      platform: 'ios', app: { bundle_id: 'x' },
      dev_server: { start: 'cmd', startup_timeout: 0 },
    });
    assert.ok(errors.some(e => e.includes('startup_timeout')));
  });
});
