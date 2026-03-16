import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import toml from 'toml';

const CONFIG_FILENAME = 'config.toml';
const CONFIG_DIR = '.proofrun';
const KNOWLEDGE_DIR = 'knowledge';

export const LOCK_DIR = '.proofrun/locks';

export function findConfigPath(startDir = process.cwd()) {
  let dir = startDir;
  while (true) {
    const candidate = resolve(dir, CONFIG_DIR, CONFIG_FILENAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function loadConfig(startDir = process.cwd()) {
  const configPath = findConfigPath(startDir);
  if (!configPath) return null;

  const raw = readFileSync(configPath, 'utf8');
  let config;
  try {
    config = toml.parse(raw);
  } catch (e) {
    console.error(`Error: Failed to parse ${configPath}: ${e.message}`);
    process.exit(1);
  }
  if (!config || typeof config !== 'object') {
    console.error(`Error: Invalid config at ${configPath}: expected a TOML table`);
    process.exit(1);
  }

  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.error(`Error: Config validation failed: ${errors.join('; ')}`);
    process.exit(1);
  }

  config._path = configPath;
  config._dir = dirname(dirname(configPath)); // project root (parent of .proofrun/)
  config._knowledgeDir = resolve(config._dir, CONFIG_DIR, KNOWLEDGE_DIR);
  return config;
}

export function validateConfig(config) {
  const errors = [];
  // No required fields — all config is optional preferences
  return errors;
}

export function requireConfig(command) {
  const config = loadConfig();
  if (!config) {
    console.error('Error: No .proofrun/config.toml found. Run `proofrun init --preset <name>` first.');
    process.exit(1);
  }
  return config;
}

const DEFAULTS = {
  reports: { output_dir: '.proofrun/reports', embed_screenshots: true, open_after_generate: false },
  session: { evidence_dir: '.proofrun/sessions' },
};

export function withDefaults(config) {
  return deepMerge(DEFAULTS, config);
}

function deepMerge(defaults, overrides) {
  const result = { ...defaults };
  for (const key of Object.keys(overrides)) {
    if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])
        && defaults[key] && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }
  return result;
}
