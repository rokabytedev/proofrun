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

function setupActiveSession(tmpDir, { withKnowledge = false, knowledgeFiles = {} } = {}) {
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

  if (withKnowledge) {
    const knowledgeDir = resolve(proofrunDir, 'knowledge');
    mkdirSync(knowledgeDir, { recursive: true });
    for (const [filename, content] of Object.entries(knowledgeFiles)) {
      writeFileSync(resolve(knowledgeDir, filename), content);
    }
  }

  return { projectDir, sessionDir };
}

describe('session stop — knowledge placeholder warnings', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-session-stop-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('warns about files with unfilled placeholders', () => {
    const { projectDir } = setupActiveSession(tmpDir, {
      withKnowledge: true,
      knowledgeFiles: {
        'interaction.md': '# Interaction\n<!-- Agent: fill in testID patterns -->\n',
        'environment.md': '# Environment\nBuild: npm run build\n',
      },
    });

    const result = run(['session', 'stop'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.knowledge_placeholders, ['interaction.md']);
  });

  it('no warning when all placeholders filled', () => {
    const { projectDir } = setupActiveSession(tmpDir, {
      withKnowledge: true,
      knowledgeFiles: {
        'environment.md': '# Environment\nBuild: npm run build\n',
        'devices.md': '# Devices\nPolicy: dedicated-pool\n',
      },
    });

    const result = run(['session', 'stop'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.knowledge_placeholders, []);
  });

  it('no warning when no knowledge directory', () => {
    const { projectDir } = setupActiveSession(tmpDir, { withKnowledge: false });

    const result = run(['session', 'stop'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.knowledge_placeholders, []);
  });
});

describe('session stop — plan coverage warnings', () => {
  let tmpDir;
  beforeEach(() => { tmpDir = mkdtempSync(join(tmpdir(), 'proofrun-session-stop-')); });
  afterEach(() => { rmSync(tmpDir, { recursive: true, force: true }); });

  it('warns about unverified planned criteria', () => {
    const { projectDir, sessionDir } = setupActiveSession(tmpDir);

    // Create plan with 2 criteria
    writeFileSync(resolve(sessionDir, 'plan.json'), JSON.stringify({
      criteria: [
        { criterion: 'c1', spec: 'Spec 1', cases: [], carried: false },
        { criterion: 'c2', spec: 'Spec 2', cases: [], carried: false },
      ],
      created_at: '2026-03-18T12:00:00.000Z',
    }));

    // Add judgment only for c1
    const evidence = JSON.parse(readFileSync(resolve(sessionDir, 'evidence.json'), 'utf8'));
    evidence.entries.push({ id: 1, type: 'judgment', criterion: 'c1', status: 'pass', reasoning: 'ok', timestamp: new Date().toISOString() });
    writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence));

    const result = run(['session', 'stop'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.equal(result.data.plan_gaps.length, 1);
    assert.equal(result.data.plan_gaps[0].criterion, 'c2');
  });

  it('no warning when plan fully verified', () => {
    const { projectDir, sessionDir } = setupActiveSession(tmpDir);

    writeFileSync(resolve(sessionDir, 'plan.json'), JSON.stringify({
      criteria: [
        { criterion: 'c1', spec: 'Spec 1', cases: [], carried: false },
      ],
      created_at: '2026-03-18T12:00:00.000Z',
    }));

    const evidence = JSON.parse(readFileSync(resolve(sessionDir, 'evidence.json'), 'utf8'));
    evidence.entries.push({ id: 1, type: 'judgment', criterion: 'c1', status: 'pass', reasoning: 'ok', timestamp: new Date().toISOString() });
    writeFileSync(resolve(sessionDir, 'evidence.json'), JSON.stringify(evidence));

    const result = run(['session', 'stop'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.plan_gaps, []);
  });

  it('no warning when no plan exists', () => {
    const { projectDir } = setupActiveSession(tmpDir);

    const result = run(['session', 'stop'], { cwd: projectDir });
    assert.equal(result.ok, true);
    assert.deepEqual(result.data.plan_gaps, []);
  });

  it('carried criteria count as verified', () => {
    const { projectDir, sessionDir } = setupActiveSession(tmpDir);

    writeFileSync(resolve(sessionDir, 'plan.json'), JSON.stringify({
      criteria: [
        { criterion: 'c1', spec: 'Spec 1', cases: [], carried: true },
        { criterion: 'c2', spec: 'Spec 2', cases: [], carried: false },
      ],
      created_at: '2026-03-18T12:00:00.000Z',
    }));

    const result = run(['session', 'stop'], { cwd: projectDir });
    assert.equal(result.ok, true);
    // Only c2 should be in gaps (c1 is carried)
    assert.equal(result.data.plan_gaps.length, 1);
    assert.equal(result.data.plan_gaps[0].criterion, 'c2');
  });
});
