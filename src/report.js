import chalk from 'chalk';
import { S } from './symbols.js';

const B = S.bullet;

/** Print the post-scaffold success summary. */
export function printResult(manifest, config) {
  const { root, created, overwritten } = manifest;

  const deptList = config.departments.length
    ? config.departments.map(d => `    ${B} ${d}`).join('\n')
    : '    (none)';
  const productList = config.products.length
    ? config.products.map(p => `    ${B} ${p.name} ${S.arrow} products/${p.slug}/`).join('\n')
    : '    (none)';

  console.log(chalk.bold.green(`\n  ${S.tick} Workspace created!\n`));
  console.log(chalk.white(`  Location: ${chalk.cyan(root)}`));
  console.log(chalk.gray(`  ${created.length} file(s) created${overwritten.length ? `, ${overwritten.length} overwritten` : ''}.\n`));

  console.log(chalk.bold('  What was created:\n'));
  console.log(`  ${chalk.cyan('CLAUDE.md')}          ${S.dash} master map (always loaded)`);
  console.log(`  ${chalk.cyan('CONTEXT.md')}         ${S.dash} task router`);
  console.log(`  ${chalk.cyan('PROJECT-REGISTRY.md')} ${S.dash} project index`);
  console.log(`  ${chalk.cyan('company/')}           ${S.dash} brand, products, SOPs`);
  console.log(`  ${chalk.cyan('departments/')}       ${S.dash} ${config.departments.length} department workspace(s)`);
  console.log(deptList);
  console.log(`  ${chalk.cyan('products/')}          ${S.dash} product workspaces`);
  console.log(productList);
  console.log(`  ${chalk.cyan('projects/')}          ${S.dash} time-bounded projects (auto-created)`);
  console.log(`  ${chalk.cyan('_system/')}           ${S.dash} infra docs + project templates\n`);

  console.log(chalk.bold('  Next steps:\n'));
  console.log(`  1. Open the workspace in Claude Code:`);
  console.log(`     ${chalk.gray(`claude "${root}"`)}\n`);
  console.log(`  2. Fill in the ${chalk.cyan('[TBD]')} placeholders by pasting or speaking:`);
  console.log(`     ${chalk.gray('"Our brand voice is professional but warm..."')}`);
  console.log(`     ${chalk.gray('"Our main product is X, which does Y..."')}\n`);
  console.log(`  3. Create your first project:`);
  console.log(`     ${chalk.gray('"New project: [describe what you need]"')}\n`);

  if (config.infra.hasVps) {
    console.log(`  4. Update ${chalk.cyan('_system/infra/vps.md')} with your deployed apps.\n`);
  }

  console.log(chalk.gray(`  The workspace is self-updating ${S.dash} dump thoughts, voice notes,`));
  console.log(chalk.gray('  or brain dumps directly into Claude and it will route them.\n'));
}

/** Print the plan for a --dry-run (nothing was written). */
export function printDryRun(manifest, config) {
  const { root, created, overwritten, dirs } = manifest;

  console.log(chalk.bold.yellow(`\n  Dry run ${S.dash} nothing was written.\n`));
  console.log(chalk.white(`  Target: ${chalk.cyan(root)}\n`));

  if (overwritten.length) {
    console.log(chalk.bold.red(`  Would OVERWRITE ${overwritten.length} existing file(s):`));
    for (const f of overwritten) console.log(chalk.red(`    ${S.cross} ${f}`));
    console.log('');
  }

  console.log(chalk.bold(`  Would create ${created.length} file(s):`));
  for (const f of created) console.log(chalk.green(`    ${S.tick} ${f}`));
  console.log('');

  console.log(chalk.gray(`  ${dirs.length} director(ies) would also be ensured.\n`));
  console.log(chalk.gray(`  Re-run without --dry-run to write. Use --force to overwrite existing files.\n`));
}
