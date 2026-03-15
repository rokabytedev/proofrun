import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';

export function registerContext(program) {
  program
    .command('context [change]')
    .description('Get context instructions for a change, or list available changes')
    .option('--list', 'List available changes via discovery command')
    .action(async (change, opts) => {
      const config = withDefaults(requireConfig('context'));

      if (opts.list || !change) {
        // Return discovery instructions
        const cc = config.change_context || {};
        success('context.list', {
          source: cc.source || 'manual',
          discovery_command: cc.discovery_command || null,
          instructions: cc.discovery_command
            ? 'Run the discovery_command to see available changes. Pick the one to verify.'
            : 'No discovery command configured. Ask the user which change to verify.',
        });
        return;
      }

      // Build context instructions for a specific change
      const cc = config.change_context || {};
      const ak = config.app_knowledge || {};
      const interaction = config.interaction || {};
      const boundaries = config.boundaries || {};
      const session = config.session || {};
      const simulator = config.simulator || {};

      const replacePlaceholder = (str) => str ? str.replace(/\{\{change\}\}/g, change) : str;

      const data = {
        change_context: buildChangeContext(cc, change, replacePlaceholder),
        app_knowledge: buildAppKnowledge(ak),
        interaction: {
          tool: interaction.tool || 'iosef',
          element_strategy: interaction.element_strategy || 'identifier',
          testid_attribute: interaction.testid_attribute || 'testID',
        },
        simulator: {
          device_types: simulator.device_types || { default: 'iPhone 16 Pro' },
        },
        boundaries: {
          path: boundaries.path || '.proofrun/boundaries.md',
          fallback: 'Use the default boundaries-template.md from the proofrun skill if the file does not exist.',
        },
        session: {
          max_retries_per_ac: session.max_retries_per_ac || 2,
        },
      };

      success('context', data);
    });
}

function buildChangeContext(cc, change, replacePlaceholder) {
  const source = cc.source || 'manual';

  if (source === 'manual') {
    return {
      source: 'manual',
      change_name: change,
      instructions: 'No structured spec source configured. To understand what to verify: check recent git commits (git log --oneline -20), read changed files (git diff main --name-only), and ask the user for acceptance criteria if unclear.',
    };
  }

  const result = {
    source,
    change_name: change,
  };

  if (cc.context_command) {
    result.context_command = replacePlaceholder(cc.context_command);
  }

  return result;
}

function buildAppKnowledge(ak) {
  const source = ak.source || 'none';

  if (source === 'none') {
    return {
      source: 'none',
      instructions: 'No structured app knowledge source. Read README.md and any docs/ directory. Use the simulator interaction tool to explore the app\'s navigation and discover screens.',
    };
  }

  const result = { source };
  if (ak.discovery_command) result.discovery_command = ak.discovery_command;
  if (ak.tips) result.tips = ak.tips;
  return result;
}
