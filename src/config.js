import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import yaml from 'js-yaml';

const CONFIG_FILENAME = 'config.yaml';
const CONFIG_DIR = '.proofrun';

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
  const config = yaml.load(raw);
  config._path = configPath;
  config._dir = dirname(dirname(configPath)); // project root (parent of .proofrun/)
  return config;
}

export function requireConfig(command) {
  const config = loadConfig();
  if (!config) {
    console.log(JSON.stringify({
      ok: false, command, data: null,
      error: 'No .proofrun/config.yaml found. Run `proofrun init --preset <name>` first.'
    }));
    process.exit(1);
  }
  return config;
}

const DEFAULTS = {
  platform: 'ios',
  dev_server: { startup_timeout: 120 },
  simulator: { pool_size: 5, device_types: { default: 'iPhone 16 Pro' } },
  port_range: { start: 8090, end: 8099 },
  interaction: { tool: 'iosef', tool_check: 'iosef --help', element_strategy: 'identifier', testid_attribute: 'testID' },
  boundaries: { path: '.proofrun/boundaries.md' },
  reports: { output_dir: '.proofrun/reports', embed_screenshots: true, open_after_generate: false },
  session: { lock_dir: '.proofrun/locks', evidence_dir: '.proofrun/sessions', max_retries_per_ac: 2 },
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
