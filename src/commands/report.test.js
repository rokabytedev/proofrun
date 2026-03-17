import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReportData } from './report.js';

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
});
