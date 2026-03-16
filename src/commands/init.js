import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { success, error } from '../output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerInit(program) {
  program
    .command('init')
    .description('Initialize proofrun config from a platform preset')
    .requiredOption('--preset <name>', 'Platform preset (expo, react-native-cli)')
    .action(async (opts) => {
      const presetName = opts.preset;
      const presetsDir = resolve(__dirname, '../../presets');
      const presetFile = resolve(presetsDir, `${presetName}.yaml`);

      if (!existsSync(presetFile)) {
        error('init', `Unknown preset "${presetName}". Available: expo, react-native-cli`);
      }

      const proofrunDir = resolve(process.cwd(), '.proofrun');
      const configPath = resolve(proofrunDir, 'config.yaml');

      if (existsSync(configPath)) {
        error('init', `.proofrun/config.yaml already exists. Delete it first to reinitialize.`);
      }

      // Create .proofrun/ directory
      mkdirSync(proofrunDir, { recursive: true });

      // Copy preset to config
      const presetContent = readFileSync(presetFile, 'utf8');
      writeFileSync(configPath, presetContent);

      // Copy boundaries template
      const boundariesDest = resolve(proofrunDir, 'boundaries.md');
      if (!existsSync(boundariesDest)) {
        const boundariesSrc = resolve(__dirname, '../../skills/proofrun/references/boundaries-template.md');
        if (existsSync(boundariesSrc)) {
          writeFileSync(boundariesDest, readFileSync(boundariesSrc, 'utf8'));
        }
      }

      // Add transient dirs to .gitignore
      const gitignorePath = resolve(process.cwd(), '.gitignore');
      const entriesToAdd = ['.proofrun/locks/', '.proofrun/sessions/', '.proofrun/reports/'];
      let gitignoreContent = '';
      if (existsSync(gitignorePath)) {
        gitignoreContent = readFileSync(gitignorePath, 'utf8');
      }
      const newEntries = entriesToAdd.filter(e => !gitignoreContent.includes(e));
      if (newEntries.length > 0) {
        const addition = '\n# proofrun transient data\n' + newEntries.join('\n') + '\n';
        appendFileSync(gitignorePath, addition);
      }

      const createdDirs = ['.proofrun/'];
      success('init', {
        preset: presetName,
        config_path: '.proofrun/config.yaml',
        created_dirs: createdDirs,
        gitignore_entries_added: newEntries,
      });
    });
}
