import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { success } from '../output.js';
import { loadConfig, withDefaults } from '../config.js';
import { findActiveSession } from '../session.js';
import { getGlobalLockDir, listLocks } from '../locking.js';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {} };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      meta[key] = value;
    }
  }
  return { meta };
}

function getVersion() {
  try {
    const pkgPath = new URL('../../package.json', import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    return pkg.version || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function registerInfo(program) {
  program
    .command('info')
    .description('Project readiness: config, knowledge topics, session state, diagnostics')
    .action(async () => {
      const version = getVersion();
      const checks = [];

      // 1. Config check
      const rawConfig = loadConfig();
      if (!rawConfig) {
        checks.push({ name: 'config', status: 'fail', detail: '.proofrun/config.toml not found. Run `proofrun init`.' });
        success('info', {
          version,
          config: null,
          knowledge: null,
          session: null,
          locks: [],
          diagnostics: checks,
        }, formatInfo);
        return;
      }

      checks.push({ name: 'config', status: 'pass', detail: '.proofrun/config.toml found and valid' });
      const config = withDefaults(rawConfig);
      const projectRoot = config._dir;

      // 2. Knowledge check
      const knowledgeDir = config._knowledgeDir;
      let knowledgeTopics = [];
      if (existsSync(knowledgeDir)) {
        const files = readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
        knowledgeTopics = files.map(f => {
          const content = readFileSync(resolve(knowledgeDir, f), 'utf8');
          const { meta } = parseFrontmatter(content);
          const topic = f.replace(/\.md$/, '');
          return { topic, name: meta.name || topic, description: meta.description || '' };
        }).sort((a, b) => a.topic.localeCompare(b.topic));
        checks.push({ name: 'knowledge', status: 'pass', detail: `${files.length} topic(s): ${knowledgeTopics.map(t => t.topic).join(', ')}` });
      } else {
        checks.push({ name: 'knowledge', status: 'fail', detail: '.proofrun/knowledge/ not found. Run `proofrun init`.' });
      }

      // 3. Global lock dir check
      const lockDir = getGlobalLockDir();
      if (existsSync(lockDir)) {
        checks.push({ name: 'lock_dir', status: 'pass', detail: `~/.proofrun/locks/ exists (global device locks)` });
      } else {
        checks.push({ name: 'lock_dir', status: 'pass', detail: `~/.proofrun/locks/ will be created on first session start` });
      }

      // 4. Active session
      const evidenceDir = resolve(projectRoot, config.session.evidence_dir);
      const activeSession = findActiveSession(evidenceDir);

      // 5. Locks
      const locks = listLocks(lockDir);

      const data = {
        version,
        config: {
          path: rawConfig._path,
          session: { evidence_dir: config.session.evidence_dir },
          reports: config.reports,
        },
        knowledge: {
          dir: '.proofrun/knowledge',
          topics: knowledgeTopics,
        },
        session: activeSession
          ? {
              session_id: activeSession.sessionId,
              change_name: activeSession.state.change_name,
              device: activeSession.state.device,
              started_at: activeSession.state.started_at,
            }
          : null,
        locks,
        diagnostics: checks,
      };

      success('info', data, formatInfo);
    });
}

function formatInfo(data) {
  const lines = [];
  lines.push(`proofrun v${data.version}`);
  lines.push('');

  if (data.config) {
    lines.push(`Config: ${data.config.path}`);
  } else {
    lines.push('Config: not found');
  }

  if (data.knowledge) {
    const topics = data.knowledge.topics.map(t => t.topic);
    const topicStr = topics.length > 0 ? `${topics.length} topics (${topics.join(', ')})` : 'no topics';
    lines.push(`Knowledge: ${topicStr}`);
  } else {
    lines.push('Knowledge: not found');
  }

  lines.push('');

  if (data.session) {
    lines.push(`Session: ${data.session.session_id} (active)`);
    lines.push(`  Change: ${data.session.change_name}`);
    lines.push(`  Device: ${data.session.device}`);
  } else {
    lines.push('Session: none active');
  }

  lines.push(`Locks: ${data.locks.length} device(s) in use`);

  lines.push('');
  lines.push('Diagnostics:');
  for (const check of data.diagnostics) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗';
    lines.push(`  ${icon} ${check.detail}`);
  }

  return lines.join('\n');
}
