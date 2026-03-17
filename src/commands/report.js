import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import { findActiveSession, loadEvidence, loadSessionState } from '../session.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerReport(program) {
  program
    .command('report')
    .description('Generate an interactive HTML verification report')
    .option('--output <path>', 'Output path for the report')
    .option('--open', 'Open report in default browser after generation')
    .option('--session <id>', 'Session ID (defaults to active or most recent)')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('report'));
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);

      // Find session
      let sessionDir, sessionId, state;
      if (opts.session) {
        sessionDir = resolve(evidenceDir, opts.session);
        sessionId = opts.session;
        state = loadSessionState(sessionDir);
      } else {
        const active = findActiveSession(evidenceDir);
        if (active) {
          sessionDir = active.sessionDir;
          sessionId = active.sessionId;
          state = active.state;
        } else {
          // Try most recent session
          const { readdirSync } = await import('node:fs');
          if (existsSync(evidenceDir)) {
            const dirs = readdirSync(evidenceDir, { withFileTypes: true })
              .filter(d => d.isDirectory())
              .map(d => d.name)
              .sort()
              .reverse();
            if (dirs.length > 0) {
              sessionId = dirs[0];
              sessionDir = resolve(evidenceDir, sessionId);
              state = loadSessionState(sessionDir);
            }
          }
          if (!sessionDir) {
            error('report', 'No session found. Run `proofrun session start` first.');
          }
        }
      }

      const evidence = loadEvidence(sessionDir);
      if (!evidence || evidence.entries.length === 0) {
        error('report', 'No evidence recorded in session. Record steps, screenshots, and judgments first.');
      }

      // Build report data
      const reportData = buildReportData(evidence, state, sessionDir, config);

      // Load template
      const templatePath = resolve(__dirname, '../../templates/report.html');
      if (!existsSync(templatePath)) {
        error('report', 'Report template not found at templates/report.html');
      }
      let template = readFileSync(templatePath, 'utf8');

      // Inject data
      template = template.replace('/*__REPORT_DATA__*/', JSON.stringify(reportData));

      // Write report
      const reportsDir = resolve(projectRoot, config.reports.output_dir);
      mkdirSync(reportsDir, { recursive: true });

      const date = new Date().toISOString().slice(0, 10);
      const changeName = state?.change_name || 'unknown';
      const outputPath = opts.output || resolve(reportsDir, `${date}-${changeName}.html`);
      writeFileSync(outputPath, template);

      const { statSync } = await import('node:fs');
      const reportSize = statSync(outputPath).size;

      // Open in browser if requested
      const shouldOpen = opts.open || config.reports.open_after_generate;
      if (shouldOpen) {
        try {
          execSync(`open "${outputPath}"`, { stdio: 'pipe' });
        } catch { /* ignore open failure */ }
      }

      success('report', {
        report_path: outputPath,
        session_id: sessionId,
        change_name: changeName,
        summary: reportData.summary,
        criteria: reportData.criteria.map(c => ({
          criterion: c.criterion,
          status: c.latest_status,
          judgments: c.judgments.length,
          screenshots: c.screenshots.length,
          fixes: c.fixes.length,
        })),
        report_size_bytes: reportSize,
        opened_in_browser: shouldOpen,
      }, (data) =>
        `Report generated: ${data.report_path}\n` +
        `Session: ${data.session_id}\n` +
        `Change: ${data.change_name}\n` +
        `Criteria: ${data.criteria.length} (${data.summary.pass} pass, ${data.summary.fail} fail, ${data.summary.human_required} human)` +
        (data.opened_in_browser ? '\nOpened in browser.' : '')
      );
    });
}

export function buildReportData(evidence, state, sessionDir, config) {
  const entries = evidence.entries;

  // Group entries by criterion name
  const criterionMap = new Map();
  const generalEntries = [];

  for (const entry of entries) {
    if (entry.criterion != null) {
      if (!criterionMap.has(entry.criterion)) {
        criterionMap.set(entry.criterion, {
          criterion: entry.criterion,
          steps: [],
          screenshots: [],
          judgments: [],
          fixes: [],
          notes: [],
        });
      }
      const criterionData = criterionMap.get(entry.criterion);
      if (entry.type === 'step') criterionData.steps.push(entry);
      else if (entry.type === 'screenshot') criterionData.screenshots.push(embedScreenshot(entry, sessionDir, config));
      else if (entry.type === 'judgment') criterionData.judgments.push(entry);
      else if (entry.type === 'fix') criterionData.fixes.push(entry);
      else if (entry.type === 'note') criterionData.notes.push(entry);
    } else {
      generalEntries.push(entry);
    }
  }

  const criteria = Array.from(criterionMap.values());
  for (const c of criteria) {
    const lastJudgment = c.judgments[c.judgments.length - 1];
    c.latest_status = lastJudgment?.status || 'pending';
  }

  const summary = {
    total_criteria: criteria.length,
    pass: criteria.filter(c => c.latest_status === 'pass').length,
    fail: criteria.filter(c => c.latest_status === 'fail').length,
    human_required: criteria.filter(c => c.latest_status === 'human_required').length,
    pending: criteria.filter(c => c.latest_status === 'pending').length,
    total_steps: entries.filter(e => e.type === 'step').length,
    total_screenshots: entries.filter(e => e.type === 'screenshot').length,
    total_fixes: entries.filter(e => e.type === 'fix').length,
  };

  return {
    session_id: evidence.session_id,
    change_name: evidence.change_name,
    started_at: evidence.started_at,
    device: evidence.device,
    summary,
    criteria,
    general_entries: generalEntries,
    generated_at: new Date().toISOString(),
  };
}

function embedScreenshot(entry, sessionDir, config) {
  if (!config.reports.embed_screenshots) return entry;

  const imagePath = resolve(sessionDir, entry.stored_path);
  if (existsSync(imagePath)) {
    try {
      const imageData = readFileSync(imagePath);
      const base64 = imageData.toString('base64');
      const ext = entry.stored_path.split('.').pop().toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      return { ...entry, data_uri: `data:${mime};base64,${base64}` };
    } catch {
      return entry;
    }
  }
  return entry;
}
