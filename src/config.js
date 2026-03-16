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
  let config;
  try {
    config = yaml.load(raw);
  } catch (e) {
    console.log(JSON.stringify({
      ok: false, command: null, data: null,
      error: `Failed to parse ${configPath}: ${e.message}`
    }));
    process.exit(1);
  }
  if (!config || typeof config !== 'object') {
    console.log(JSON.stringify({
      ok: false, command: null, data: null,
      error: `Invalid config at ${configPath}: expected a YAML mapping`
    }));
    process.exit(1);
  }
  // Validate required fields and types
  const errors = validateConfig(config);
  if (errors.length > 0) {
    console.log(JSON.stringify({
      ok: false, command: null, data: null,
      error: `Config validation failed: ${errors.join('; ')}`
    }));
    process.exit(1);
  }

  config._path = configPath;
  config._dir = dirname(dirname(configPath)); // project root (parent of .proofrun/)
  return config;
}

export const KNOWN_TOP_LEVEL_KEYS = [
  'platform', 'app', 'dev_server', 'simulator', 'port_range',
  'interaction', 'change_context', 'app_knowledge', 'boundaries',
  'reports', 'session',
];

export function validateConfig(config) {
  const errors = [];

  // Required fields
  if (!config.platform) errors.push('missing required field: platform');
  if (!config.app?.bundle_id) errors.push('missing required field: app.bundle_id');
  if (!config.dev_server?.start) errors.push('missing required field: dev_server.start');

  // Type checks on numeric fields
  if (config.simulator?.pool_size !== undefined && (!Number.isInteger(config.simulator.pool_size) || config.simulator.pool_size < 1)) {
    errors.push('simulator.pool_size must be a positive integer');
  }
  if (config.port_range?.start !== undefined && !Number.isInteger(config.port_range.start)) {
    errors.push('port_range.start must be an integer');
  }
  if (config.port_range?.end !== undefined && !Number.isInteger(config.port_range.end)) {
    errors.push('port_range.end must be an integer');
  }
  if (config.dev_server?.startup_timeout !== undefined && (!Number.isInteger(config.dev_server.startup_timeout) || config.dev_server.startup_timeout < 1)) {
    errors.push('dev_server.startup_timeout must be a positive integer');
  }

  return errors;
}

export function getUnknownKeys(config) {
  return Object.keys(config)
    .filter(k => !k.startsWith('_'))
    .filter(k => !KNOWN_TOP_LEVEL_KEYS.includes(k));
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
