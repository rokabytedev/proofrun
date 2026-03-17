import { existsSync, readFileSync, writeFileSync, mkdirSync, appendFileSync, readdirSync, copyFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { success, error } from '../output.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerInit(program) {
  program
    .command('init')
    .description('Initialize proofrun config and knowledge templates')
    .action(async () => {
      const proofrunDir = resolve(process.cwd(), '.proofrun');
      const configPath = resolve(proofrunDir, 'config.toml');

      if (existsSync(configPath)) {
        error('init', `.proofrun/config.toml already exists. Delete it first to reinitialize.`);
      }

      const templatesDir = resolve(__dirname, '../../templates');

      // Create .proofrun/ directory
      mkdirSync(proofrunDir, { recursive: true });

      // Copy config.toml from templates
      const templateConfig = resolve(templatesDir, 'config.toml');
      if (existsSync(templateConfig)) {
        writeFileSync(configPath, readFileSync(templateConfig, 'utf8'));
      }

      // Copy knowledge/ directory from templates
      const knowledgeDir = resolve(proofrunDir, 'knowledge');
      const templateKnowledge = resolve(templatesDir, 'knowledge');
      const copiedKnowledge = [];
      if (existsSync(templateKnowledge)) {
        mkdirSync(knowledgeDir, { recursive: true });
        const files = readdirSync(templateKnowledge).filter(f => f.endsWith('.md'));
        for (const file of files) {
          copyFileSync(join(templateKnowledge, file), join(knowledgeDir, file));
          copiedKnowledge.push(file);
        }
      }

      // Add transient dirs to .gitignore
      const gitignorePath = resolve(process.cwd(), '.gitignore');
      const entriesToAdd = ['.proofrun/sessions/', '.proofrun/reports/'];
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
        config_path: '.proofrun/config.toml',
        knowledge_dir: '.proofrun/knowledge',
        knowledge_files: copiedKnowledge,
        gitignore_entries_added: newEntries,
      }, (data) => {
        const lines = [
          `Initialized proofrun`,
          `Config: ${data.config_path}`,
          `Knowledge: ${data.knowledge_dir} (${data.knowledge_files.length} file(s): ${data.knowledge_files.join(', ')})`,
        ];
        if (data.gitignore_entries_added.length > 0) {
          lines.push(`Added to .gitignore: ${data.gitignore_entries_added.join(', ')}`);
        }
        lines.push('');
        lines.push('Next steps:');
        lines.push('  1. Run `proofrun info` to verify setup');
        lines.push('  2. Read knowledge files and fill in placeholders');
        lines.push('  3. Start a session: `proofrun session start --change <name> --device <identifier>`');
        return lines.join('\n');
      });
    });
}
