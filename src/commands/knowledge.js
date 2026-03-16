import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { success, error } from '../output.js';
import { requireConfig, withDefaults } from '../config.js';

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const meta = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      meta[key] = value;
    }
  }
  return { meta, body: match[2] };
}

function getKnowledgeDir(config) {
  return config._knowledgeDir;
}

function listTopics(knowledgeDir) {
  if (!existsSync(knowledgeDir)) return [];
  return readdirSync(knowledgeDir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const topic = basename(f, '.md');
      const content = readFileSync(resolve(knowledgeDir, f), 'utf8');
      const { meta } = parseFrontmatter(content);
      return {
        topic,
        name: meta.name || topic,
        description: meta.description || '',
      };
    })
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export function registerKnowledge(program) {
  program
    .command('knowledge [topic]')
    .description('Read knowledge files for the current project')
    .option('--list', 'List available knowledge topics')
    .option('--json', 'Output as JSON')
    .action(async (topic, opts) => {
      const config = withDefaults(requireConfig('knowledge'));
      const knowledgeDir = getKnowledgeDir(config);

      if (opts.list || !topic) {
        const topics = listTopics(knowledgeDir);

        if (opts.json) {
          success('knowledge.list', {
            topics,
            knowledge_dir: '.proofrun/knowledge',
          });
          return;
        }

        // Plain text output
        if (topics.length === 0) {
          console.log('No knowledge files found in .proofrun/knowledge/');
          console.log('Run `proofrun init --preset <name>` to seed knowledge from a template.');
          return;
        }

        console.log('\nAvailable knowledge:\n');
        const maxTopicLen = Math.max(...topics.map(t => t.topic.length));
        for (const t of topics) {
          const padding = ' '.repeat(maxTopicLen - t.topic.length + 4);
          const desc = t.description || '(no description)';
          // Word-wrap description at ~60 chars
          const descIndent = ' '.repeat(maxTopicLen + 6);
          const words = desc.split(' ');
          let line = '';
          const lines = [];
          for (const word of words) {
            if (line.length + word.length + 1 > 60 && line.length > 0) {
              lines.push(line);
              line = word;
            } else {
              line = line ? `${line} ${word}` : word;
            }
          }
          if (line) lines.push(line);
          console.log(`  ${t.topic}${padding}${lines[0]}`);
          for (let i = 1; i < lines.length; i++) {
            console.log(`${descIndent}${lines[i]}`);
          }
          console.log();
        }
        return;
      }

      // Read specific topic
      const filePath = resolve(knowledgeDir, `${topic}.md`);
      if (!existsSync(filePath)) {
        const topics = listTopics(knowledgeDir);
        const available = topics.map(t => t.topic).join(', ');
        if (opts.json) {
          error('knowledge', `Topic "${topic}" not found. Available: ${available}`);
        } else {
          console.error(`Topic "${topic}" not found.\n\nAvailable topics: ${available}`);
          process.exit(1);
        }
        return;
      }

      const content = readFileSync(filePath, 'utf8');
      const { meta, body } = parseFrontmatter(content);

      if (opts.json) {
        success('knowledge', {
          topic,
          name: meta.name || topic,
          description: meta.description || '',
          content: body.trim(),
        });
        return;
      }

      // Plain text — print the file content as-is (readable with frontmatter)
      console.log(content);
    });
}
