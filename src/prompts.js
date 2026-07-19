import { input, checkbox, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { S } from './symbols.js';

const ALL_DEPARTMENTS = [
  { name: 'Marketing', value: 'marketing' },
  { name: 'Sales', value: 'sales' },
  { name: 'Operations', value: 'operations' },
  { name: 'Networking & BD', value: 'networking' },
  { name: 'HR & Recruiting', value: 'hr' },
  { name: 'Finance', value: 'finance' },
  { name: 'Customer Success', value: 'customer-success' },
  { name: 'Product', value: 'product' },
  { name: 'Engineering', value: 'engineering' },
];

/**
 * Interactively collect a raw workspace config. The returned object is passed
 * through normalizeConfig()/validateConfig() by the caller, so it does not need
 * to compute slugs or defaults itself.
 *
 * @param {object} [opts]
 * @param {string} [opts.outputDir]  when provided (via --output), skips the location prompt
 */
export async function gatherConfig(opts = {}) {
  console.log(chalk.bold.cyan('\n  Claude OS ' + S.dash + ' Workspace Setup\n'));
  console.log(chalk.gray('  This will scaffold a Claude Code workspace with routing, memory,\n  and self-updating architecture.\n'));

  // --- Company info ---
  console.log(chalk.bold('  Company Info\n'));

  const companyName = await input({
    message: 'Company name:',
    validate: v => v.trim().length > 0 || 'Required',
  });

  const companyDescription = await input({
    message: 'What does the company do? (1-2 sentences):',
    validate: v => v.trim().length > 0 || 'Required',
  });

  const companyTagline = await input({
    message: 'Tagline or value prop (optional ' + S.dash + ' press Enter to skip):',
  });

  const companyWebsite = await input({
    message: 'Website (optional):',
  });

  const industry = await input({
    message: 'Industry or niche:',
    validate: v => v.trim().length > 0 || 'Required',
  });

  // --- Departments ---
  console.log(chalk.bold('\n  Departments\n'));

  const selectedDepts = await checkbox({
    message: 'Which departments does this company have?',
    choices: ALL_DEPARTMENTS,
    instructions: `  Space to select ${S.middot} Enter to confirm`,
  });

  const customDeptInput = await input({
    message: 'Custom departments? (comma-separated, or Enter to skip):',
  });

  const customDepts = customDeptInput
    .split(',')
    .map(d => d.trim())
    .filter(Boolean);

  const departments = [...selectedDepts, ...customDepts];

  // --- Products ---
  console.log(chalk.bold('\n  Products & Services\n'));

  const addProducts = await confirm({
    message: 'Add products or services now?',
    default: true,
  });

  const products = [];
  if (addProducts) {
    let addMore = true;
    while (addMore) {
      const productName = await input({
        message: `Product/service name:`,
        validate: v => v.trim().length > 0 || 'Required',
      });
      const productDescription = await input({
        message: `Short description:`,
      });
      products.push({ name: productName, description: productDescription });

      addMore = await confirm({ message: 'Add another product/service?', default: false });
    }
  }

  // --- Infrastructure ---
  console.log(chalk.bold('\n  Infrastructure\n'));

  const hasVps = await confirm({ message: 'Do you have a VPS for app deployment?', default: false });
  let vpsHost = '';
  let vpsSshAlias = '';
  if (hasVps) {
    vpsHost = await input({ message: 'VPS IP or hostname:' });
    vpsSshAlias = await input({ message: 'SSH alias (from ~/.ssh/config):' });
  }

  const hasLocalServer = await confirm({ message: 'Do you have an always-on local machine (Mac Mini, NUC, mini PC, etc.)?', default: false });
  let localServerName = '';
  if (hasLocalServer) {
    localServerName = await input({ message: 'What is it called? (e.g. "Mac Mini"):' });
  }

  // --- Output directory ---
  let outputDir = opts.outputDir;
  if (!outputDir) {
    console.log(chalk.bold('\n  Output\n'));
    outputDir = await input({
      message: 'Where should the workspace be created? (full path or . for current directory):',
      default: '.',
    });
  }

  return {
    company: {
      name: companyName,
      description: companyDescription,
      tagline: companyTagline,
      website: companyWebsite,
      industry,
    },
    departments,
    products,
    infra: {
      hasVps,
      vpsHost,
      vpsSshAlias,
      hasLocalServer,
      localServerName,
    },
    outputDir,
  };
}
