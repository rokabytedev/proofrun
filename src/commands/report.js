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
        acs: reportData.acs.map(ac => ({
          ac: ac.ac,
          status: ac.latest_status,
          judgments: ac.judgments.length,
          screenshots: ac.screenshots.length,
          fixes: ac.fixes.length,
        })),
        report_size_bytes: reportSize,
        opened_in_browser: shouldOpen,
      });
    });
}

function buildReportData(evidence, state, sessionDir, config) {
  const entries = evidence.entries;

  // Group entries by AC
  const acMap = new Map();
  const generalEntries = [];

  for (const entry of entries) {
    if (entry.ac != null) {
      if (!acMap.has(entry.ac)) {
        acMap.set(entry.ac, { ac: entry.ac, steps: [], screenshots: [], judgments: [], fixes: [], notes: [] });
      }
      const acData = acMap.get(entry.ac);
      if (entry.type === 'step') acData.steps.push(entry);
      else if (entry.type === 'screenshot') acData.screenshots.push(embedScreenshot(entry, sessionDir, config));
      else if (entry.type === 'judgment') acData.judgments.push(entry);
      else if (entry.type === 'fix') acData.fixes.push(entry);
      else if (entry.type === 'note') acData.notes.push(entry);
    } else {
      generalEntries.push(entry);
    }
  }

  const acs = Array.from(acMap.values()).sort((a, b) => a.ac - b.ac);
  for (const ac of acs) {
    const lastJudgment = ac.judgments[ac.judgments.length - 1];
    ac.latest_status = lastJudgment?.status || 'pending';
  }

  const summary = {
    total_acs: acs.length,
    pass: acs.filter(a => a.latest_status === 'pass').length,
    fail: acs.filter(a => a.latest_status === 'fail').length,
    human_required: acs.filter(a => a.latest_status === 'human_required').length,
    pending: acs.filter(a => a.latest_status === 'pending').length,
    total_steps: entries.filter(e => e.type === 'step').length,
    total_screenshots: entries.filter(e => e.type === 'screenshot').length,
    total_fixes: entries.filter(e => e.type === 'fix').length,
  };

  return {
    session_id: evidence.session_id,
    change_name: evidence.change_name,
    started_at: evidence.started_at,
    simulator: evidence.simulator,
    port: evidence.port,
    summary,
    acs,
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
