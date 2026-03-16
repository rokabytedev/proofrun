import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildReportData } from './report.js';

describe('buildReportData', () => {
  const baseEvidence = {
    session_id: 'test-session',
    change_name: 'test-change',
    started_at: '2026-03-15T10:00:00Z',
    simulator: { device_name: 'iPhone 16 Pro' },
    port: 8090,
    entries: [],
  };

  const baseConfig = {
    reports: { embed_screenshots: false },
  };

  it('groups entries by AC', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'step', ac: 1, description: 'Nav to lib', timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'step', ac: 2, description: 'Nav to search', timestamp: '2026-03-15T10:02:00Z' },
        { id: 3, type: 'judgment', ac: 1, status: 'pass', reasoning: 'ok', judgment_sequence: 1, timestamp: '2026-03-15T10:03:00Z' },
        { id: 4, type: 'judgment', ac: 2, status: 'fail', reasoning: 'nope', judgment_sequence: 1, timestamp: '2026-03-15T10:04:00Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.acs.length, 2);
    assert.equal(data.acs[0].ac, 1);
    assert.equal(data.acs[0].steps.length, 1);
    assert.equal(data.acs[0].judgments.length, 1);
    assert.equal(data.acs[1].ac, 2);
    assert.equal(data.acs[1].steps.length, 1);
  });

  it('computes summary counts correctly', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'judgment', ac: 1, status: 'pass', reasoning: 'ok', judgment_sequence: 1, timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'judgment', ac: 2, status: 'fail', reasoning: 'bad', judgment_sequence: 1, timestamp: '2026-03-15T10:02:00Z' },
        { id: 3, type: 'judgment', ac: 3, status: 'human_required', reasoning: 'audio', judgment_sequence: 1, timestamp: '2026-03-15T10:03:00Z' },
        { id: 4, type: 'step', ac: 1, description: 'step1', timestamp: '2026-03-15T10:00:30Z' },
        { id: 5, type: 'step', ac: 2, description: 'step2', timestamp: '2026-03-15T10:01:30Z' },
        { id: 6, type: 'fix', ac: 2, description: 'fixed it', timestamp: '2026-03-15T10:02:30Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.summary.total_acs, 3);
    assert.equal(data.summary.pass, 1);
    assert.equal(data.summary.fail, 1);
    assert.equal(data.summary.human_required, 1);
    assert.equal(data.summary.total_steps, 2);
    assert.equal(data.summary.total_fixes, 1);
  });

  it('uses latest judgment status for each AC', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'judgment', ac: 1, status: 'fail', reasoning: 'bad', judgment_sequence: 1, timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'fix', ac: 1, description: 'fixed', timestamp: '2026-03-15T10:02:00Z' },
        { id: 3, type: 'judgment', ac: 1, status: 'pass', reasoning: 'good after fix', judgment_sequence: 2, timestamp: '2026-03-15T10:03:00Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.acs[0].latest_status, 'pass');
    assert.equal(data.acs[0].judgments.length, 2);
    assert.equal(data.summary.pass, 1);
    assert.equal(data.summary.fail, 0);
  });

  it('handles empty evidence', () => {
    const data = buildReportData(baseEvidence, {}, '/tmp', baseConfig);
    assert.equal(data.acs.length, 0);
    assert.equal(data.summary.total_acs, 0);
    assert.equal(data.summary.pass, 0);
  });

  it('separates general entries from AC-specific ones', () => {
    const evidence = {
      ...baseEvidence,
      entries: [
        { id: 1, type: 'note', text: 'general note', timestamp: '2026-03-15T10:01:00Z' },
        { id: 2, type: 'step', ac: 1, description: 'ac step', timestamp: '2026-03-15T10:02:00Z' },
      ],
    };
    const data = buildReportData(evidence, {}, '/tmp', baseConfig);
    assert.equal(data.general_entries.length, 1);
    assert.equal(data.general_entries[0].type, 'note');
    assert.equal(data.acs.length, 1);
  });
});
