import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import {
  findActiveSession, loadEvidence, loadSessionState,
  findSessionsByChangeName,
} from '../session.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerReport(program) {
  program
    .command('report')
    .description('Generate an interactive HTML verification report')
    .option('--change <name>', 'Change name (auto-detected from active/recent session if omitted)')
    .option('--output <path>', 'Output path for the report')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('report'));
      const projectRoot = config._dir;
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);

      // Determine change name: explicit flag > active session > most recent session
      let changeName = opts.change;
      if (!changeName) {
        const active = findActiveSession(evidenceDir);
        if (active) {
          changeName = active.state.change_name;
        } else if (existsSync(evidenceDir)) {
          const dirs = readdirSync(evidenceDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name)
            .sort()
            .reverse();
          for (const dir of dirs) {
            const state = loadSessionState(resolve(evidenceDir, dir));
            if (state?.change_name) {
              changeName = state.change_name;
              break;
            }
          }
        }
        if (!changeName) {
          error('report', 'No session found. Specify --change <name>.');
        }
      }

      const reportData = buildMultiRunReportData(evidenceDir, changeName, config);

      // Load template
      const templatePath = resolve(__dirname, '../../templates/report.html');
      if (!existsSync(templatePath)) {
        error('report', 'Report template not found at templates/report.html');
      }
      let template = readFileSync(templatePath, 'utf8');

      // Inject data
      template = template.replace('/*__REPORT_DATA__*/null', JSON.stringify(reportData));

      // Write report
      const reportsDir = resolve(projectRoot, config.reports.output_dir);
      mkdirSync(reportsDir, { recursive: true });

      const date = new Date().toISOString().slice(0, 10);
      const outputPath = opts.output || resolve(reportsDir, `${date}-${changeName}.html`);
      writeFileSync(outputPath, template);

      const { statSync } = await import('node:fs');
      const reportSize = statSync(outputPath).size;

      const latestRun = reportData.runs[reportData.runs.length - 1];
      const latestSummary = latestRun.summary;
      const latestCriteria = latestRun.criteria;

      success('report', {
        report_path: outputPath,
        session_id: latestRun.session_id,
        change_name: changeName,
        runs: reportData.runs.length,
        summary: latestSummary,
        criteria: latestCriteria.map(c => ({
          criterion: c.criterion,
          status: c.latest_status,
          classification: c.classification || null,
          judgments: c.judgments.length,
          screenshots: c.screenshots.length,
          fixes: c.fixes.length,
        })),
        report_size_bytes: reportSize,
      }, (data) =>
        `Report generated: ${data.report_path}\n` +
        `Session: ${data.session_id}\n` +
        `Change: ${data.change_name}\n` +
        (data.runs > 1 ? `Runs: ${data.runs}\n` : '') +
        `Criteria: ${data.criteria.length} (${data.summary.pass} pass, ${data.summary.fail} fail, ${data.summary.human_required} human)`
      );
    });
}

export function buildMultiRunReportData(evidenceDir, changeName, config) {
  const sessions = findSessionsByChangeName(evidenceDir, changeName);

  if (sessions.length === 0) {
    error('report', `No sessions found for change '${changeName}'.`);
  }

  const runs = [];
  const priorFeedback = new Map();

  for (let i = 0; i < sessions.length; i++) {
    const { sessionId, sessionDir, state } = sessions[i];
    const evidence = loadEvidence(sessionDir);
    if (!evidence) continue;

    const runNumber = i + 1;

    // Load feedback.json for this session (used by later runs for carry approval)
    const feedbackPath = resolve(sessionDir, 'feedback.json');
    let feedback = null;
    if (existsSync(feedbackPath)) {
      try {
        feedback = JSON.parse(readFileSync(feedbackPath, 'utf8'));
        priorFeedback.set(sessionId, feedback);
      } catch { /* ignore corrupted feedback */ }
    }

    // Build single-run data
    const runData = buildReportData(evidence, state, sessionDir, config);

    // Classify criteria for runs after the first
    if (runNumber > 1) {
      for (const criterion of runData.criteria) {
        const carryEntry = evidence.entries.find(
          e => e.type === 'carry' && e.criterion === criterion.criterion
        );

        if (carryEntry) {
          criterion.classification = 'carried';
          criterion.carry_info = {
            from_session: carryEntry.carried_from_session,
            from_run: carryEntry.carried_from_run,
            reason: carryEntry.reason,
          };

          const priorFb = priorFeedback.get(carryEntry.carried_from_session);
          if (priorFb) {
            const priorCriterionFb = priorFb.criteria?.find(
              c => c.criterion === criterion.criterion
            );
            if (priorCriterionFb && priorCriterionFb.review_status === 'accepted') {
              criterion.carried_approval = 'accepted';
            } else {
              criterion.carried_approval = null;
            }
          } else {
            criterion.carried_approval = null;
          }
        } else {
          const existedInPrior = runs.some(r =>
            r.criteria.some(c => c.criterion === criterion.criterion)
          );
          criterion.classification = existedInPrior ? 're-verified' : 'new';
        }
      }
    } else {
      for (const criterion of runData.criteria) {
        criterion.classification = null;
      }
    }

    runs.push({
      run_number: runNumber,
      session_id: sessionId,
      reason: state?.reason || null,
      started_at: runData.started_at,
      device: runData.device,
      criteria: runData.criteria,
      prerequisites: runData.prerequisites,
      general_entries: runData.general_entries,
      summary: runData.summary,
    });
  }

  if (runs.length === 0) {
    error('report', `Sessions found for change '${changeName}' but none contain evidence.`);
  }

  return {
    change_name: changeName,
    runs,
    latest_run: runs.length,
    generated_at: new Date().toISOString(),
  };
}

export function buildReportData(evidence, state, sessionDir, config) {
  const entries = evidence.entries;

  const prerequisites = entries.filter(e => e.type === 'prerequisite');

  const criterionMap = new Map();
  const generalEntries = [];

  for (const entry of entries) {
    if (entry.type === 'prerequisite') continue;

    if (entry.criterion != null) {
      if (!criterionMap.has(entry.criterion)) {
        criterionMap.set(entry.criterion, {
          criterion: entry.criterion,
          steps: [],
          screenshots: [],
          judgments: [],
          fixes: [],
          notes: [],
          carries: [],
        });
      }
      const criterionData = criterionMap.get(entry.criterion);
      if (entry.type === 'step') criterionData.steps.push(entry);
      else if (entry.type === 'screenshot') criterionData.screenshots.push(embedScreenshot(entry, sessionDir, config));
      else if (entry.type === 'judgment') criterionData.judgments.push(entry);
      else if (entry.type === 'fix') criterionData.fixes.push(entry);
      else if (entry.type === 'note') criterionData.notes.push(entry);
      else if (entry.type === 'carry') criterionData.carries.push(entry);
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
    prerequisites,
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
