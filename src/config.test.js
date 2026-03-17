import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { withDefaults, findConfigPath, validateConfig } from './config.js';

describe('withDefaults', () => {
  it('fills missing fields from defaults', () => {
    const config = withDefaults({});
    assert.equal(config.reports.embed_screenshots, true);
    assert.equal(config.reports.output_dir, '.proofrun/reports');
    assert.equal(config.session.evidence_dir, '.proofrun/sessions');
  });

  it('overrides defaults with explicit values', () => {
    const config = withDefaults({ reports: { embed_screenshots: false } });
    assert.equal(config.reports.embed_screenshots, false);
  });

  it('deep merges nested objects', () => {
    const config = withDefaults({ reports: { output_dir: '/custom/reports' } });
    assert.equal(config.reports.output_dir, '/custom/reports');
    assert.equal(config.reports.embed_screenshots, true); // default preserved
  });

  it('does not include removed fields', () => {
    const config = withDefaults({});
    assert.equal(config.simulator, undefined);
    assert.equal(config.port_range, undefined);
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
    writeFileSync(resolve(proofrunDir, 'config.toml'), '[session]\nevidence_dir = ".proofrun/sessions"\n');
    const result = findConfigPath(tmpDir);
    assert.equal(result, resolve(proofrunDir, 'config.toml'));
  });

  it('finds config in parent directory', () => {
    const proofrunDir = resolve(tmpDir, '.proofrun');
    mkdirSync(proofrunDir, { recursive: true });
    writeFileSync(resolve(proofrunDir, 'config.toml'), '[session]\nevidence_dir = ".proofrun/sessions"\n');
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
      session: { evidence_dir: '.proofrun/sessions' },
      reports: { output_dir: '.proofrun/reports', embed_screenshots: true, open_after_generate: false },
    };
    const errors = validateConfig(config);
    assert.equal(errors.length, 0);
  });

  it('returns no errors for empty config (all fields optional)', () => {
    const errors = validateConfig({});
    assert.equal(errors.length, 0);
  });
});
