import { parseArgs } from 'node:util';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';

import { gatherConfig } from './prompts.js';
import { normalizeConfig, validateConfig, loadConfigFile, exampleConfig } from './config.js';
import { scaffold, resolveRoot, workspaceExists } from './scaffold.js';
import { printResult, printDryRun } from './report.js';
import { HELP, getVersion } from './help.js';
import { S } from './symbols.js';

const OPTIONS = {
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
  output: { type: 'string', short: 'o' },
  config: { type: 'string' },
  'dry-run': { type: 'boolean' },
  force: { type: 'boolean', short: 'f' },
  yes: { type: 'boolean', short: 'y' },
  'example-config': { type: 'boolean' },
};

const KNOWN_COMMANDS = new Set(['init']);

/**
 * Parse argv. Rethrows unknown-option / bad-value errors as a friendly Error.
 */
function parse(args) {
  try {
    return parseArgs({ args, options: OPTIONS, allowPositionals: true });
  } catch (err) {
    throw new Error(`${err.message}\n  Run with --help to see available options.`);
  }
}

/**
 * Decide what to do when the target directory already holds workspace files.
 * Pure — exists so every branch of the data-loss gate is unit-testable.
 *
 * scripted = the user passed --config: never prompt, even on a TTY, so CI jobs
 * with an allocated TTY cannot hang on a hidden confirm.
 *
 * @returns {'proceed'|'confirm'|'refuse'}
 */
export function overwritePolicy({ exists, force, assumeYes, interactive, scripted }) {
  if (!exists) return 'proceed';
  if (force || assumeYes) return 'proceed';
  if (interactive && !scripted) return 'confirm';
  return 'refuse';
}

/**
 * Main CLI entry. Resolves on success (or for --help/--version/cancel), throws
 * on failure. The bin wrapper maps outcomes to process exit codes.
 *
 * @param {string[]} args  process.argv.slice(2)
 */
export async function main(args) {
  const { values, positionals } = parse(args);

  if (values.help) {
    console.log(HELP);
    return;
  }
  if (values.version) {
    console.log(await getVersion());
    return;
  }
  if (values['example-config']) {
    console.log(JSON.stringify(exampleConfig(), null, 2));
    return;
  }

  const unknown = positionals.filter((p) => !KNOWN_COMMANDS.has(p));
  if (unknown.length) {
    throw new Error(
      `Unknown command: ${unknown.join(', ')}\n  Run with --help to see available commands.`
    );
  }

  const dryRun = Boolean(values['dry-run']);
  const force = Boolean(values.force);
  const assumeYes = Boolean(values.yes);
  const interactive = Boolean(process.stdin.isTTY);

  // ── Resolve config (from file or interactive prompts) ──
  let config;
  if (values.config) {
    config = await loadConfigFile(values.config);
    if (values.output) config.outputDir = values.output;
  } else {
    if (!interactive) {
      throw new Error(
        'Interactive setup needs a terminal (TTY).\n' +
        '  For non-interactive use, pass a config file:\n' +
        '    ccuof --example-config > workspace.json   # then edit it\n' +
        '    ccuof --config workspace.json --output ./my-workspace'
      );
    }
    const raw = await gatherConfig({ outputDir: values.output });
    config = normalizeConfig(raw);
    const errors = validateConfig(config);
    if (errors.length) {
      throw new Error(`Invalid input:\n  - ${errors.join('\n  - ')}`);
    }
  }

  // ── Overwrite safety ──
  const root = resolveRoot(config);
  if (!dryRun) {
    const action = overwritePolicy({
      exists: await workspaceExists(root),
      force,
      assumeYes,
      interactive,
      scripted: Boolean(values.config),
    });

    if (action === 'confirm') {
      console.log(
        chalk.yellow(
          `\n  ${S.cross} Workspace files already exist at ${chalk.cyan(root)}.`
        )
      );
      const ok = await confirm({
        message: 'Overwrite existing workspace files? Your edits to those files will be lost.',
        default: false,
      });
      if (!ok) {
        console.log(chalk.gray('\n  Cancelled. Nothing was written.\n'));
        return;
      }
    } else if (action === 'refuse') {
      throw new Error(
        `Refusing to overwrite existing workspace files at ${root}.\n` +
        '  Re-run with --force to overwrite, or --dry-run to preview.'
      );
    }
  }

  // ── Build ──
  if (!dryRun) console.log(chalk.bold.cyan('\n  Building workspace...\n'));
  const manifest = await scaffold(config, { dryRun });

  if (dryRun) printDryRun(manifest, config);
  else printResult(manifest, config);
}
