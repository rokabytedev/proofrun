import { success } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';

export function registerContext(program) {
  program
    .command('context [change]')
    .description('Get project config and knowledge path, optionally scoped to a change')
    .action(async (change) => {
      const config = withDefaults(requireConfig('context'));

      const data = {
        change_name: change || null,
        knowledge_dir: '.proofrun/knowledge',
        config: {
          simulator: { pool_size: config.simulator.pool_size },
          port_range: config.port_range,
        },
      };

      success('context', data);
    });
}
