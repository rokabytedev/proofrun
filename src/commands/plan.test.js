import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const CLI_PATH = resolve(import.meta.dirname, '../../bin/proofrun.js');

function run(args, { cwd, env } = {}) {
  try {
    const result = execFileSync('node', [CLI_PATH, '--json', ...args], {
      cwd: cwd || process.cwd(),
      env: { ...process.env, ...env },
      encoding: 'utf8',
      timeout: 10000,
    });
    return JSON.parse(result.trim());
  } catch (e) {
    // Parse JSON from stdout even on non-zero exit
    const output = (e.stdout || '').trim();
    if (output) {
      try { return JSON.parse(output); } catch { /* fall through */ }
    }
    throw e;
  }
}

function setupProject(tmpDir, { withSession = true, withKnowledge = false } = {}) {
  const projectDir = resolve(tmpDir, 'project');
  const proofrunDir = resolve(projectDir, '.proofrun');
  const sessionsDir = resolve(proofrunDir, 'sessions');
  mkdirSync(sessionsDir, { recursive: true });

  // Config
  writeFileSync(resolve(proofrunDir, 'config.toml'), `
[session]
evidence_dir = ".proofrun/sessions"

[reports]
output_dir = ".proofrun/reports"
embed_screenshots = true
`);

  if (withKnowledge) {
    const knowledgeDir = resolve(proofrunDir, 'knowledge');
    mkdirSync(knowledgeDir, { recursive: true });
    return { projectDir, proofrunDir, sessionsDir, knowledgeDir };
  }

  let sessionDir = null;
  if (withSession) {
    const sessionId = '20260318120000-testaa';
    sessionDir = resolve(sessionsDir, sessionId);
    mkdirSync(resolve(sessionDir, 'screenshots'), { recursive: true });
    writeFileSync(resolve(sessionDir, 'state.json'), JSON.stringify({
      session_id: sessionId,
      status: 'active',
      change_name: 'test-change',
      started_at: '2026-03-18T12:00:00.000Z',
      stopped_at: null,
      device: 'TEST-UDID-1234',
    }));
    writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify({
      session_id: sessionId,
      change_name: 'test-change',
      started_at: '2026-03-18T12:00:00.000Z',
      device: 'TEST-UDID-1234',
      entries: [],
    }));
  }

  return { projectDir, proofrunDir, sessionsDir, sessionDir };
}

describe('plan add', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-plan-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('creates plan.json with criterion', () => {
    const { projectDir, sessionDir } = setupProject(tmpDir);
    const result = run(['plan', 'add', '--criterion', 'test-crit', '--spec', 'Test spec text'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.criterion, 'test-crit');
    assert.equal(result.data.spec, 'Test spec text');
    assert.equal(result.data.total_criteria, 1);

    const plan = JSON.parse(readFileSync(resolve(sessionDir, 'plan.json'), 'utf8'));
    assert.equal(plan.criteria.length, 1);
    assert.equal(plan.criteria[0].criterion, 'test-crit');
  });

  it('supports multiple --cases', () => {
    const { projectDir } = setupProject(tmpDir);
    const result = run(['plan', 'add', '--criterion', 'c1', '--spec', 'S1',
      '--cases', 'Case one', '--cases', 'Case two'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.cases, ['Case one', 'Case two']);
  });

  it('errors on duplicate criterion', () => {
    const { projectDir } = setupProject(tmpDir);
    run(['plan', 'add', '--criterion', 'dup', '--spec', 'First'], { cwd: projectDir });
    const result = run(['plan', 'add', '--criterion', 'dup', '--spec', 'Second'], { cwd: projectDir });
    assert.equal(result.ok, false);
    assert.match(result.error, /already exists/);
  });

  it('supports --carried flag', () => {
    const { projectDir } = setupProject(tmpDir);
    const result = run(['plan', 'add', '--criterion', 'carried-crit', '--spec', 'S', '--carried'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.carried, true);
  });

  it('errors with no active session', () => {
    const { projectDir } = setupProject(tmpDir, { withSession: false });
    const result = run(['plan', 'add', '--criterion', 'c', '--spec', 's'], { cwd: projectDir });
    assert.equal(result.ok, false);
    assert.match(result.error, /No active session/);
  });
});

describe('plan list', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-plan-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('shows no plan message when no plan exists', () => {
    const { projectDir } = setupProject(tmpDir);
    const result = run(['plan', 'list'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.criteria, []);
  });

  it('shows criteria with verification status', () => {
    const { projectDir, sessionDir } = setupProject(tmpDir);

    // Add two criteria
    run(['plan', 'add', '--criterion', 'c1', '--spec', 'Spec 1'], { cwd: projectDir });
    run(['plan', 'add', '--criterion', 'c2', '--spec', 'Spec 2'], { cwd: projectDir });

    // Add a judgment for c1
    const evidence = JSON.parse(readFileSync(resolve(sessionDir, 'evidence.json'), 'utf8'));
    evidence.entries.push({ id: 1, type: 'judgment', criterion: 'c1', status: 'pass', reasoning: 'ok', timestamp: new Date().toISOString() });
    writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence));

    const result = run(['plan', 'list'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.criteria.length, 2);

    const c1 = result.data.criteria.find(c => c.criterion === 'c1');
    const c2 = result.data.criteria.find(c => c.criterion === 'c2');
    assert.equal(c1.verified, true);
    assert.equal(c2.verified, false);
    assert.equal(result.data.summary.verified, 1);
    assert.equal(result.data.summary.remaining, 1);
  });

  it('marks carried criteria as verified', () => {
    const { projectDir } = setupProject(tmpDir);
    run(['plan', 'add', '--criterion', 'carried-c', '--spec', 'S', '--carried'], { cwd: projectDir });

    const result = run(['plan', 'list'], { cwd: projectDir });
    assert.equal(result.data.criteria[0].verified, true);
    assert.equal(result.data.summary.verified, 1);
  });
});

describe('plan check', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-plan-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('reports all verified when complete', () => {
    const { projectDir, sessionDir } = setupProject(tmpDir);
    run(['plan', 'add', '--criterion', 'c1', '--spec', 'S1'], { cwd: projectDir });

    // Add judgment
    const evidence = JSON.parse(readFileSync(resolve(sessionDir, 'evidence.json'), 'utf8'));
    evidence.entries.push({ id: 1, type: 'judgment', criterion: 'c1', status: 'pass', reasoning: 'ok', timestamp: new Date().toISOString() });
    writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence));

    const result = run(['plan', 'check'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.unverified.length, 0);
    assert.equal(result.data.verified, 1);
  });

  it('reports unverified criteria', () => {
    const { projectDir } = setupProject(tmpDir);
    run(['plan', 'add', '--criterion', 'c1', '--spec', 'S1'], { cwd: projectDir });
    run(['plan', 'add', '--criterion', 'c2', '--spec', 'S2'], { cwd: projectDir });

    const result = run(['plan', 'check'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.unverified.length, 2);
  });

  it('reports unplanned criteria', () => {
    const { projectDir, sessionDir } = setupProject(tmpDir);
    run(['plan', 'add', '--criterion', 'c1', '--spec', 'S1'], { cwd: projectDir });

    // Add judgment for an unplanned criterion
    const evidence = JSON.parse(readFileSync(resolve(sessionDir, 'evidence.json'), 'utf8'));
    evidence.entries.push({ id: 1, type: 'judgment', criterion: 'c1', status: 'pass', reasoning: 'ok', timestamp: new Date().toISOString() });
    evidence.entries.push({ id: 2, type: 'judgment', criterion: 'surprise-crit', status: 'pass', reasoning: 'ok', timestamp: new Date().toISOString() });
    writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence));

    const result = run(['plan', 'check'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.unplanned, ['surprise-crit']);
  });

  it('shows no plan message', () => {
    const { projectDir } = setupProject(tmpDir);
    const result = run(['plan', 'check'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.has_plan, false);
  });
});
