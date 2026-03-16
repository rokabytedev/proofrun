import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
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
      const presetDir = resolve(presetsDir, presetName);

      if (!existsSync(presetDir)) {
        error('init', `Unknown preset "${presetName}". Available: expo, react-native-cli`);
      }

      const proofrunDir = resolve(process.cwd(), '.proofrun');
      const configPath = resolve(proofrunDir, 'config.toml');

      if (existsSync(configPath)) {
        error('init', `.proofrun/config.toml already exists. Delete it first to reinitialize.`);
      }

      // Create .proofrun/ directory
      mkdirSync(proofrunDir, { recursive: true });

      // Copy config.toml from preset
      const presetConfig = resolve(presetDir, 'config.toml');
      if (existsSync(presetConfig)) {
        writeFileSync(configPath, readFileSync(presetConfig, 'utf8'));
      }

      // Copy knowledge/ directory from preset
      const knowledgeDir = resolve(proofrunDir, 'knowledge');
      const presetKnowledge = resolve(presetDir, 'knowledge');
      const copiedKnowledge = [];
      if (existsSync(presetKnowledge)) {
        mkdirSync(knowledgeDir, { recursive: true });
        const files = readdirSync(presetKnowledge).filter(f => f.endsWith('.md'));
        for (const file of files) {
          copyFileSync(join(presetKnowledge, file), join(knowledgeDir, file));
          copiedKnowledge.push(file);
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

      success('init', {
        preset: presetName,
        config_path: '.proofrun/config.toml',
        knowledge_dir: '.proofrun/knowledge',
        knowledge_files: copiedKnowledge,
        gitignore_entries_added: newEntries,
      }, (data) => {
        const lines = [
          `Initialized proofrun with preset: ${data.preset}`,
          `Config: ${data.config_path}`,
          `Knowledge: ${data.knowledge_dir} (${data.knowledge_files.length} file(s): ${data.knowledge_files.join(', ')})`,
        ];
        if (data.gitignore_entries_added.length > 0) {
          lines.push(`Added to .gitignore: ${data.gitignore_entries_added.join(', ')}`);
        }
        lines.push('');
        lines.push('Next steps:');
        lines.push('  1. Run `proofrun info` to verify setup');
        lines.push('  2. Read environment.md knowledge and fill in placeholders');
        lines.push('  3. Start a session: `proofrun session start --change <name> --simulator <UDID>`');
        return lines.join('\n');
      });
    });
}
