import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';
import { findActiveSession, loadEvidence } from '../session.js';

function requireActiveSession(config, command) {
  const evidenceDir = resolve(config._dir, config.session.evidence_dir);
  const active = findActiveSession(evidenceDir);
  if (!active) {
    error(command, 'No active session. Run `proofrun session start --change <name> --device <identifier>` first.');
  }
  return active;
}

function loadPlan(sessionDir) {
  const planPath = resolve(sessionDir, 'plan.json');
  if (!existsSync(planPath)) return null;
  try {
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));
    if (!plan || !Array.isArray(plan.criteria)) return null;
    return plan;
  } catch {
    return null;
  }
}

function savePlan(sessionDir, plan) {
  writeFileSync(resolve(sessionDir, 'plan.json'), JSON.stringify(plan, null, 2));
}

export function registerPlan(program) {
  const plan = program
    .command('plan')
    .description('Manage the verification plan for the active session');

  // proofrun plan add
  plan
    .command('add')
    .description('Add a criterion to the verification plan')
    .requiredOption('--criterion <name>', 'Criterion name')
    .requiredOption('--spec <text>', 'Spec or acceptance criterion text')
    .option('--cases <case>', 'Test case description (repeatable)', collect, [])
    .option('--carried', 'Mark this criterion as carried from a prior run')
    .action(async (opts) => {
      const config = withDefaults(requireConfig('plan.add'));
      const active = requireActiveSession(config, 'plan.add');

      let planData = loadPlan(active.sessionDir);
      if (!planData) {
        planData = { criteria: [], created_at: new Date().toISOString() };
      }

      // Check for duplicate
      if (planData.criteria.some(c => c.criterion === opts.criterion)) {
        error('plan.add', `Criterion '${opts.criterion}' already exists in the plan.`);
      }

      const entry = {
        criterion: opts.criterion,
        spec: opts.spec,
        cases: opts.cases,
        carried: !!opts.carried,
      };
      planData.criteria.push(entry);
      savePlan(active.sessionDir, planData);

      success('plan.add', {
        criterion: entry.criterion,
        spec: entry.spec,
        cases: entry.cases,
        carried: entry.carried,
        total_criteria: planData.criteria.length,
      }, (data) =>
        `Plan: added '${data.criterion}' (${data.cases.length} test case(s))${data.carried ? ' [carried]' : ''}\n` +
        `Total planned criteria: ${data.total_criteria}`
      );
    });

  // proofrun plan list
  plan
    .command('list')
    .description('List the verification plan with status')
    .action(async () => {
      const config = withDefaults(requireConfig('plan.list'));
      const active = requireActiveSession(config, 'plan.list');

      const planData = loadPlan(active.sessionDir);
      if (!planData) {
        success('plan.list', { criteria: [], summary: null }, () =>
          'No plan created yet. Run `proofrun plan add` to start.'
        );
        return;
      }

      const evidence = loadEvidence(active.sessionDir);
      const judgments = evidence?.entries?.filter(e => e.type === 'judgment') || [];
      const judgedCriteria = new Set(judgments.map(j => j.criterion));

      const criteria = planData.criteria.map(c => ({
        criterion: c.criterion,
        spec: c.spec,
        cases: c.cases,
        carried: c.carried,
        verified: c.carried || judgedCriteria.has(c.criterion),
      }));

      const verified = criteria.filter(c => c.verified).length;
      const total = criteria.length;

      success('plan.list', {
        criteria,
        summary: { total, verified, remaining: total - verified },
      }, (data) => {
        const lines = ['Verification Plan:', ''];
        for (const c of data.criteria) {
          const status = c.verified ? '✓' : '…';
          const tag = c.carried ? ' [carried]' : '';
          lines.push(`  ${status} ${c.criterion}${tag}: ${c.spec}`);
          for (const cs of c.cases) {
            lines.push(`      - ${cs}`);
          }
        }
        lines.push('');
        lines.push(`${data.summary.verified}/${data.summary.total} criteria verified`);
        return lines.join('\n');
      });
    });

  // proofrun plan check
  plan
    .command('check')
    .description('Check plan coverage against recorded evidence')
    .action(async () => {
      const config = withDefaults(requireConfig('plan.check'));
      const active = requireActiveSession(config, 'plan.check');

      const planData = loadPlan(active.sessionDir);
      if (!planData) {
        success('plan.check', { has_plan: false }, () =>
          'No plan created yet. Run `proofrun plan add` to start.'
        );
        return;
      }

      const evidence = loadEvidence(active.sessionDir);
      const judgments = evidence?.entries?.filter(e => e.type === 'judgment') || [];
      const judgedCriteria = new Set(judgments.map(j => j.criterion));

      const plannedNames = new Set(planData.criteria.map(c => c.criterion));

      const unverified = planData.criteria.filter(c => !c.carried && !judgedCriteria.has(c.criterion));
      const unplanned = [...judgedCriteria].filter(name => !plannedNames.has(name));
      const verified = planData.criteria.filter(c => c.carried || judgedCriteria.has(c.criterion));

      success('plan.check', {
        has_plan: true,
        total: planData.criteria.length,
        verified: verified.length,
        unverified: unverified.map(c => ({ criterion: c.criterion, spec: c.spec })),
        unplanned,
      }, (data) => {
        const lines = [];
        if (data.unverified.length === 0) {
          lines.push(`All planned criteria verified (${data.verified}/${data.total})`);
        } else {
          lines.push(`Plan coverage: ${data.verified}/${data.total} criteria verified`);
          lines.push('');
          lines.push('Unverified criteria:');
          for (const c of data.unverified) {
            lines.push(`  ✗ ${c.criterion}: ${c.spec}`);
          }
        }
        if (data.unplanned.length > 0) {
          lines.push('');
          lines.push('Unplanned criteria (in evidence but not in plan):');
          for (const name of data.unplanned) {
            lines.push(`  ? ${name}`);
          }
        }
        return lines.join('\n');
      });
    });
}

function collect(value, previous) {
  return previous.concat([value]);
}
