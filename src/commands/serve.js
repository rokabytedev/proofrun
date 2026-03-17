import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import {
  findSessionsByChangeName,
} from '../session.js';
import { buildMultiRunReportData } from './report.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerServe(program) {
  program
    .command('serve')
    .description('Start a feedback server for a verification report')
    .option('--change <name>', 'Change name to serve report for')
    .option('--port <port>', 'Port number (default: random available)')
    .option('--timeout <minutes>', 'Server timeout in minutes (default: 30)', '30')
    .option('--stop', 'Stop a running serve process')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('serve'));
      const projectRoot = config._dir;

      if (opts.stop) {
        return handleStop(projectRoot);
      }

      if (!opts.change) {
        error('serve', 'Missing required option: --change <name>');
      }

      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);
      const sessions = findSessionsByChangeName(evidenceDir, opts.change);

      if (sessions.length === 0) {
        error('serve', `No sessions found for change '${opts.change}'.`);
      }

      // Build report data
      const reportData = buildMultiRunReportData(evidenceDir, opts.change, config);

      // Load template
      const templatePath = resolve(__dirname, '../../templates/report.html');
      if (!existsSync(templatePath)) {
        error('serve', 'Report template not found at templates/report.html');
      }
      let template = readFileSync(templatePath, 'utf8');

      // Inject SERVE_MODE before REPORT_DATA
      template = template.replace(
        'const REPORT_DATA = /*__REPORT_DATA__*/null;',
        `const SERVE_MODE = true;\nconst REPORT_DATA = ${JSON.stringify(reportData)};`
      );

      // Find the latest session dir for writing feedback
      const latestSession = sessions[sessions.length - 1];
      const latestSessionDir = latestSession.sessionDir;

      const timeoutMinutes = parseInt(opts.timeout, 10) || 30;
      const port = opts.port ? parseInt(opts.port, 10) : 0;

      const server = createServer((req, res) => {
        // CORS headers for local development
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(template);
          return;
        }

        if (req.method === 'POST' && req.url === '/feedback') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const feedback = JSON.parse(body);
              writeFeedback(latestSessionDir, feedback);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: true, message: 'Feedback received' }));
              printFeedbackSummary(feedback);
              scheduleShutdown(server, projectRoot, 0);
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, message: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (req.method === 'POST' && req.url === '/lgtm') {
          // Build LGTM feedback from report data
          const latestRun = reportData.runs[reportData.runs.length - 1];
          const lgtmFeedback = {
            session_id: latestRun.session_id,
            run_number: latestRun.run_number,
            change_name: reportData.change_name,
            reviewed_at: new Date().toISOString(),
            top_level_comment: null,
            lgtm: true,
            criteria: latestRun.criteria.map(c => ({
              criterion: c.criterion,
              source: c.classification || null,
              review_status: 'accepted',
              comment: null,
            })),
            summary: {
              accepted: latestRun.criteria.length,
              rejected: 0,
              pending: 0,
            },
          };

          // Check if POST body has additional data
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            if (body) {
              try {
                const parsed = JSON.parse(body);
                // Merge with LGTM if client sent enriched data
                if (parsed.top_level_comment) lgtmFeedback.top_level_comment = parsed.top_level_comment;
              } catch { /* ignore parse errors, use default LGTM */ }
            }

            writeFeedback(latestSessionDir, lgtmFeedback);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, message: 'LGTM received' }));
            printFeedbackSummary(lgtmFeedback);
            scheduleShutdown(server, projectRoot, 0);
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, message: 'Not found' }));
      });

      server.listen(port, () => {
        const actualPort = server.address().port;
        const pidDir = resolve(projectRoot, '.proofrun');
        mkdirSync(pidDir, { recursive: true });
        const pidPath = resolve(pidDir, 'serve.pid');
        writeFileSync(pidPath, String(process.pid));

        console.log(`Serving report at http://localhost:${actualPort}`);
        console.log(`Change: ${opts.change}`);
        console.log(`Sessions: ${sessions.length} run(s)`);
        console.log(`Timeout: ${timeoutMinutes} minutes`);
        console.log(`PID: ${process.pid}`);
        console.log('');
        console.log('Waiting for feedback...');
      });

      // Timeout
      const timeoutId = setTimeout(() => {
        console.log(`\nServe timed out after ${timeoutMinutes} minutes.`);
        cleanupPid(projectRoot);
        server.close(() => process.exit(1));
      }, timeoutMinutes * 60 * 1000);
      timeoutId.unref();

      // Handle SIGTERM
      process.on('SIGTERM', () => {
        console.log('\nServe process terminated.');
        cleanupPid(projectRoot);
        server.close(() => process.exit(0));
      });

      // Handle SIGINT
      process.on('SIGINT', () => {
        console.log('\nServe process interrupted.');
        cleanupPid(projectRoot);
        server.close(() => process.exit(0));
      });
    });
}

function writeFeedback(sessionDir, feedback) {
  const feedbackPath = resolve(sessionDir, 'feedback.json');
  writeFileSync(feedbackPath, JSON.stringify(feedback, null, 2));
}

function printFeedbackSummary(feedback) {
  console.log('');
  console.log('--- Feedback Received ---');
  if (feedback.lgtm) {
    console.log('Result: LGTM (all criteria accepted)');
  } else {
    const s = feedback.summary;
    console.log(`Result: ${s.accepted} accepted, ${s.rejected} rejected, ${s.pending} pending`);
    if (feedback.top_level_comment) {
      console.log(`Comment: ${feedback.top_level_comment}`);
    }
    // Show rejected criteria
    const rejected = feedback.criteria.filter(c => c.review_status === 'rejected');
    if (rejected.length > 0) {
      console.log('Rejected criteria:');
      for (const c of rejected) {
        console.log(`  - ${c.criterion}${c.comment ? ': ' + c.comment : ''}`);
      }
    }
  }
  console.log('');
}

function scheduleShutdown(server, projectRoot, exitCode) {
  // Give time for response to be sent
  setTimeout(() => {
    cleanupPid(projectRoot);
    server.close(() => process.exit(exitCode));
  }, 500);
}

function cleanupPid(projectRoot) {
  const pidPath = resolve(projectRoot, '.proofrun', 'serve.pid');
  try {
    if (existsSync(pidPath)) unlinkSync(pidPath);
  } catch { /* ignore */ }
}

function handleStop(projectRoot) {
  const pidPath = resolve(projectRoot, '.proofrun', 'serve.pid');

  if (!existsSync(pidPath)) {
    console.log('No serve process running.');
    return;
  }

  try {
    const pid = parseInt(readFileSync(pidPath, 'utf8').trim(), 10);
    try {
      process.kill(pid, 'SIGTERM');
      console.log(`Sent SIGTERM to serve process (PID ${pid}).`);
    } catch (e) {
      if (e.code === 'ESRCH') {
        console.log(`Serve process (PID ${pid}) is not running. Cleaning up PID file.`);
      } else {
        throw e;
      }
    }
    unlinkSync(pidPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(`Error stopping serve: ${e.message}`);
    }
  }
}
