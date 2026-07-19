#!/usr/bin/env node

import chalk from 'chalk';
import { main } from '../src/cli.js';

// A broken pipe (e.g. piping into `head`) should exit quietly, not crash.
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0);
});

try {
  await main(process.argv.slice(2));
} catch (err) {
  // Ctrl-C / ESC out of an interactive prompt.
  if (err && err.name === 'ExitPromptError') {
    console.log(chalk.gray('\n  Cancelled.\n'));
    process.exit(0);
  }
  console.error(chalk.red('\n  Error: ') + (err && err.message ? err.message : String(err)) + '\n');
  process.exit(1);
}
