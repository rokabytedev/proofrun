import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const CLI_PATH = resolve(import.meta.dirname, '../../bin/proofrun.js');

function run(args, { cwd } = {}) {
  try {
    const result = execFileSync('node', [CLI_PATH, '--json', ...args], {
      cwd: cwd || process.cwd(),
      encoding: 'utf8',
      timeout: 10000,
    });
    return JSON.parse(result.trim());
  } catch (e) {
    const output = (e.stdout || '').trim();
    if (output) {
      try { return JSON.parse(output); } catch { /* fall through */ }
    }
    throw e;
  }
}

function setupProject(tmpDir) {
  const projectDir = resolve(tmpDir, 'project');
  const proofrunDir = resolve(projectDir, '.proofrun');
  const sessionsDir = resolve(proofrunDir, 'sessions');
  const sessionId = '20260318120000-testaa';
  const sessionDir = resolve(sessionsDir, sessionId);
  mkdirSync(resolve(sessionDir, 'screenshots'), { recursive: true });

  writeFileSync(resolve(proofrunDir, 'config.toml'), `
[session]
evidence_dir = ".proofrun/sessions"

[reports]
output_dir = ".proofrun/reports"
embed_screenshots = true
`);

  writeFileSync(resolve(sessionDir, 'state.json'), JSON.stringify({
    session_id: sessionId,
    status: 'active',
    change_name: 'test-change',
    started_at: '2026-03-18T12:00:00.000Z',
    stopped_at: null,
    device: 'TEST-UDID',
  }));

  writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify({
    session_id: sessionId,
    change_name: 'test-change',
    started_at: '2026-03-18T12:00:00.000Z',
    device: 'TEST-UDID',
    entries: [],
  }));

  return { projectDir, sessionDir };
}

describe('judge screenshot warning', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-judge-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('warns when no screenshot exists for criterion', () => {
    const { projectDir } = setupProject(tmpDir);
    const result = run(['judge', '--criterion', 'no-screenshot', '--pass', 'Looks good'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.screenshot_warning, true);
  });

  it('does not warn when screenshot exists for criterion', () => {
    const { projectDir, sessionDir } = setupProject(tmpDir);

    // Add a screenshot entry for the criterion
    const evidence = JSON.parse(readFileSync(resolve(sessionDir, 'evidence.json'), 'utf8'));
    evidence.entries.push({
      id: 1,
      type: 'screenshot',
      criterion: 'has-screenshot',
      source_path: '/tmp/test.jpg',
      stored_path: 'screenshots/001-has-screenshot.jpg',
      note: null,
      timestamp: new Date().toISOString(),
    });
    writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence));

    const result = run(['judge', '--criterion', 'has-screenshot', '--pass', 'Verified'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.screenshot_warning, false);
  });
});
