#!/usr/bin/env node
import { createCli } from '../src/cli.js';

const program = createCli();
program.parseAsync(process.argv).catch((err) => {
  console.error(JSON.stringify({ ok: false, command: null, data: null, error: err.message }));
  process.exit(1);
});
