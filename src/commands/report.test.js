import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildReportData, buildMultiRunReportData } from './report.js';

describe('buildReportData', () => {
  const baseEvidence = {
    session_id: 'test-session',
    change_name: 'test-change',
    started_at: '2026-03-15T10:00:00Z',
    device: 'B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466',
    entries: [],
  };

  const baseConfig = {
    reports: { embed_screenshots: false },
  };

  it('groups entries by criterion name', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'step', criterion: 'settings-translated', description: 'Nav to settings', timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'step', criterion: 'library-search-works', description: 'Nav to library', timestamp: '2026-03-15T10:02:00Z' },
        { id: 3, type: 'judgment', criterion: 'settings-translated', status: 'pass', reasoning: 'ok', judgment_sequence: 1, timestamp: '2026-03-15T10:03:00Z' },
        { id: 4, type: 'judgment', criterion: 'library-search-works', status: 'fail', reasoning: 'nope', judgment_sequence: 1, timestamp: '2026-03-15T10:04:00Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.criteria.length, 2);
    const settingsCriterion = data.criteria.find(c => c.criterion === 'settings-translated');
    assert.ok(settingsCriterion);
    assert.equal(settingsCriterion.steps.length, 1);
    assert.equal(settingsCriterion.judgments.length, 1);
    const libraryCriterion = data.criteria.find(c => c.criterion === 'library-search-works');
    assert.ok(libraryCriterion);
    assert.equal(libraryCriterion.steps.length, 1);
  });

  it('computes summary counts correctly', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'judgment', criterion: 'crit-1', status: 'pass', reasoning: 'ok', judgment_sequence: 1, timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'judgment', criterion: 'crit-2', status: 'fail', reasoning: 'bad', judgment_sequence: 1, timestamp: '2026-03-15T10:02:00Z' },
        { id: 3, type: 'judgment', criterion: 'crit-3', status: 'human_required', reasoning: 'audio', judgment_sequence: 1, timestamp: '2026-03-15T10:03:00Z' },
        { id: 4, type: 'step', criterion: 'crit-1', description: 'step1', timestamp: '2026-03-15T10:00:30Z' },
        { id: 5, type: 'step', criterion: 'crit-2', description: 'step2', timestamp: '2026-03-15T10:01:30Z' },
        { id: 6, type: 'fix', criterion: 'crit-2', description: 'fixed it', timestamp: '2026-03-15T10:02:30Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.summary.total_criteria, 3);
    assert.equal(data.summary.pass, 1);
    assert.equal(data.summary.fail, 1);
    assert.equal(data.summary.human_required, 1);
    assert.equal(data.summary.total_steps, 2);
    assert.equal(data.summary.total_fixes, 1);
  });

  it('uses latest judgment status for each criterion', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'judgment', criterion: 'crit-1', status: 'fail', reasoning: 'bad', judgment_sequence: 1, timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'fix', criterion: 'crit-1', description: 'fixed', timestamp: '2026-03-15T10:02:00Z' },
        { id: 3, type: 'judgment', criterion: 'crit-1', status: 'pass', reasoning: 'good after fix', judgment_sequence: 2, timestamp: '2026-03-15T10:03:00Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.criteria[0].latest_status, 'pass');
    assert.equal(data.criteria[0].judgments.length, 2);
    assert.equal(data.summary.pass, 1);
    assert.equal(data.summary.fail, 0);
  });

  it('handles empty evidence', () => {
    const data = buildReportData(baseEvidence, {}, '/tmp', baseConfig);
    assert.equal(data.criteria.length, 0);
    assert.equal(data.summary.total_criteria, 0);
    assert.equal(data.summary.pass, 0);
  });

  it('passes device identifier to report data', () => {
    const data = buildReportData(baseEvidence, {}, '/tmp', baseConfig);
    assert.equal(data.device, 'B1DBC6F9-5DB6-4DC8-9727-36EC26DDA466');
  });

  it('separates general entries from criterion-specific ones', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'note', text: 'general note', timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'step', criterion: 'crit-1', description: 'specific step', timestamp: '2026-03-15T10:02:00Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.general_entries.length, 1);
    assert.equal(data.general_entries[0].type, 'note');
    assert.equal(data.criteria.length, 1);
  });

  it('includes carry entries in criteria', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'carry', criterion: 'chevron-visible', reason: 'No code changes', carried_from_session: 'sess-1', carried_from_run: 1, timestamp: '2026-03-15T10:01:00Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.criteria.length, 1);
    assert.equal(data.criteria[0].carries.length, 1);
    assert.equal(data.criteria[0].carries[0].reason, 'No code changes');
  });
});

describe('buildMultiRunReportData', () => {
  const baseConfig = {
    reports: { embed_screenshots: false },
  };

  function createTempSessions() {
    const tmpBase = resolve(tmpdir(), `proofrun-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    const evidenceDir = resolve(tmpBase, 'sessions');
    mkdirSync(evidenceDir, { recursive: true });

    // Session 1: stopped, Run #1
    const session1Id = '20260315100000-aaaaaa';
    const session1Dir = resolve(evidenceDir, session1Id);
    mkdirSync(resolve(session1Dir, 'screenshots'), { recursive: true });
    writeFileSync(resolve(session1Dir, 'state.json'), JSON.stringify({
      session_id: session1Id,
      status: 'stopped',
      change_name: 'test-change',
      started_at: '2026-03-15T10:00:00Z',
      stopped_at: '2026-03-15T11:00:00Z',
      device: 'DEVICE-1',
      reason: null,
    }));
    writeFileSync(resolve(session1Dir, 'evidence.json'), JSON.stringify({
      session_id: session1Id,
      change_name: 'test-change',
      started_at: '2026-03-15T10:00:00Z',
      device: 'DEVICE-1',
      entries: [
        { id: 1, type: 'step', criterion: 'chevron-visible', description: 'Check chevron', timestamp: '2026-03-15T10:10:00Z' },
        { id: 2, type: 'judgment', criterion: 'chevron-visible', status: 'pass', reasoning: 'Chevron shows', judgment_sequence: 1, timestamp: '2026-03-15T10:11:00Z' },
        { id: 3, type: 'step', criterion: 'card-tap', description: 'Tap card', timestamp: '2026-03-15T10:12:00Z' },
        { id: 4, type: 'judgment', criterion: 'card-tap', status: 'fail', reasoning: 'Animation janky', judgment_sequence: 1, timestamp: '2026-03-15T10:13:00Z' },
      ],
    }));

    // Feedback for session 1 (chevron approved, card-tap rejected)
    writeFileSync(resolve(session1Dir, 'feedback.json'), JSON.stringify({
      session_id: session1Id,
      run_number: 1,
      change_name: 'test-change',
      reviewed_at: '2026-03-15T12:00:00Z',
      top_level_comment: null,
      lgtm: false,
      criteria: [
        { criterion: 'chevron-visible', source: null, review_status: 'accepted', comment: null },
        { criterion: 'card-tap', source: null, review_status: 'rejected', comment: 'Fix animation' },
      ],
      summary: { accepted: 1, rejected: 1, pending: 0 },
    }));

    // Session 2: stopped, Run #2
    const session2Id = '20260315130000-bbbbbb';
    const session2Dir = resolve(evidenceDir, session2Id);
    mkdirSync(resolve(session2Dir, 'screenshots'), { recursive: true });
    writeFileSync(resolve(session2Dir, 'state.json'), JSON.stringify({
      session_id: session2Id,
      status: 'stopped',
      change_name: 'test-change',
      started_at: '2026-03-15T13:00:00Z',
      stopped_at: '2026-03-15T14:00:00Z',
      device: 'DEVICE-1',
      reason: 'fix card-tap animation',
    }));
    writeFileSync(resolve(session2Dir, 'evidence.json'), JSON.stringify({
      session_id: session2Id,
      change_name: 'test-change',
      started_at: '2026-03-15T13:00:00Z',
      device: 'DEVICE-1',
      entries: [
        { id: 1, type: 'carry', criterion: 'chevron-visible', reason: 'No code changes affect chevron', carried_from_session: session1Id, carried_from_run: 1, timestamp: '2026-03-15T13:05:00Z' },
        { id: 2, type: 'step', criterion: 'card-tap', description: 'Re-test tap', timestamp: '2026-03-15T13:10:00Z' },
        { id: 3, type: 'judgment', criterion: 'card-tap', status: 'pass', reasoning: 'Animation smooth', judgment_sequence: 1, timestamp: '2026-03-15T13:11:00Z' },
        { id: 4, type: 'step', criterion: 'new-feature', description: 'Check new thing', timestamp: '2026-03-15T13:12:00Z' },
        { id: 5, type: 'judgment', criterion: 'new-feature', status: 'pass', reasoning: 'Works', judgment_sequence: 1, timestamp: '2026-03-15T13:13:00Z' },
      ],
    }));

    return { tmpBase, evidenceDir, session1Id, session2Id };
  }

  it('builds runs array with correct run numbers', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      assert.equal(data.runs.length, 2);
      assert.equal(data.runs[0].run_number, 1);
      assert.equal(data.runs[1].run_number, 2);
      assert.equal(data.latest_run, 2);
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('stores reason on each run', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      assert.equal(data.runs[0].reason, null);
      assert.equal(data.runs[1].reason, 'fix card-tap animation');
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('classifies carried criteria correctly', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      const run2 = data.runs[1];
      const chevron = run2.criteria.find(c => c.criterion === 'chevron-visible');
      assert.equal(chevron.classification, 'carried');
      assert.equal(chevron.carry_info.from_run, 1);
      assert.equal(chevron.carry_info.reason, 'No code changes affect chevron');
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('inherits approval for carried criteria from prior feedback', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      const run2 = data.runs[1];
      const chevron = run2.criteria.find(c => c.criterion === 'chevron-visible');
      assert.equal(chevron.carried_approval, 'accepted');
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('classifies re-verified criteria correctly', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      const run2 = data.runs[1];
      const cardTap = run2.criteria.find(c => c.criterion === 'card-tap');
      assert.equal(cardTap.classification, 're-verified');
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('classifies new criteria correctly', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      const run2 = data.runs[1];
      const newFeature = run2.criteria.find(c => c.criterion === 'new-feature');
      assert.equal(newFeature.classification, 'new');
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('first run criteria have null classification', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      const run1 = data.runs[0];
      for (const c of run1.criteria) {
        assert.equal(c.classification, null);
      }
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('includes change_name at top level', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      assert.equal(data.change_name, 'test-change');
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });

  it('does not include legacy top-level convenience fields', () => {
    const { tmpBase, evidenceDir } = createTempSessions();
    try {
      const data = buildMultiRunReportData(evidenceDir, 'test-change', baseConfig);
      assert.equal(data.session_id, undefined);
      assert.equal(data.summary, undefined);
      assert.equal(data.criteria, undefined);
      // Only change_name, runs, latest_run, generated_at at top level
      assert.ok(data.change_name);
      assert.ok(data.runs);
      assert.ok(data.latest_run);
      assert.ok(data.generated_at);
    } finally {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  });
});
