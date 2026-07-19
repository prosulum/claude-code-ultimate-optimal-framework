import path from 'path';
import fs from 'fs-extra';
import { slugify } from './config.js';
import {
  generateClaudeMd,
  generateContextMd,
  generateProjectRegistry,
  generateCompanyContextMd,
  generateVoiceBrand,
  generateProductsMd,
  generateDeptContextMd,
  generateProductContextMd,
  generateSystemContextMd,
  generateVpsMd,
  generateLocalServerMd,
  generateBizInitiativeTemplateMd,
  generateVaWorkflowTemplateMd,
  generateProductBuildTemplateMd,
} from './templates.js';

/**
 * Root files the scaffolder writes. If ANY of them already exists in the target
 * directory, we treat it as an existing workspace (or a directory holding files
 * we would clobber) and require confirmation / --force before writing.
 */
export const WORKSPACE_MARKERS = ['CLAUDE.md', 'CONTEXT.md', 'PROJECT-REGISTRY.md'];

/** Resolve the absolute workspace root from a config's outputDir. */
export function resolveRoot(config) {
  return config.outputDir === '.' ? process.cwd() : path.resolve(config.outputDir);
}

/** Does `dir` already contain any file the scaffolder would overwrite? */
export async function workspaceExists(dir) {
  const checks = await Promise.all(
    WORKSPACE_MARKERS.map((f) => fs.pathExists(path.join(dir, f)))
  );
  return checks.some(Boolean);
}

/**
 * Generate the workspace.
 *
 * Pure with respect to the terminal — it never prompts. Overwrite policy is the
 * caller's decision (see cli.js); this function just writes and reports.
 *
 * @param {object} config  normalized, validated config
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun=false]  compute the plan but write nothing
 * @returns {Promise<{root: string, created: string[], overwritten: string[], dirs: string[]}>}
 */
export async function scaffold(config, opts = {}) {
  const { dryRun = false } = opts;
  const root = resolveRoot(config);

  const created = [];
  const overwritten = [];
  const dirs = [];

  const write = async (relPath, content) => {
    const fullPath = path.join(root, relPath);
    const existed = await fs.pathExists(fullPath);
    if (!dryRun) {
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf8');
    }
    (existed ? overwritten : created).push(relPath);
  };

  const mkdir = async (relPath) => {
    if (!dryRun) await fs.ensureDir(path.join(root, relPath));
    dirs.push(relPath);
  };

  // ── Root files ──
  await write('CLAUDE.md', generateClaudeMd(config));
  await write('CONTEXT.md', generateContextMd(config));
  await write('PROJECT-REGISTRY.md', generateProjectRegistry(config));

  // ── company/ ──
  await write('company/CONTEXT.md', generateCompanyContextMd(config));
  await write('company/voice-brand.md', generateVoiceBrand(config));
  await write('company/products.md', generateProductsMd(config));
  await mkdir('company/sops');

  // ── departments/ ──
  for (const dept of config.departments) {
    await write(`departments/${dept}/CONTEXT.md`, generateDeptContextMd(dept, config));
    await mkdir(`departments/${dept}/assets`);
    await mkdir(`departments/${dept}/output`);
  }

  // ── products/ ──
  for (const product of config.products) {
    await write(`products/${product.slug}/CONTEXT.md`, generateProductContextMd(product, config));
    await mkdir(`products/${product.slug}/specs`);
    await mkdir(`products/${product.slug}/assets`);
    await mkdir(`products/${product.slug}/output`);
  }

  // ── projects/ ──
  await mkdir('projects');

  // ── _system/ ──
  await write('_system/CONTEXT.md', generateSystemContextMd(config));
  await mkdir('_system/infra');

  if (config.infra.hasVps) {
    await write('_system/infra/vps.md', generateVpsMd(config));
  }

  if (config.infra.hasLocalServer) {
    // slugify() restricts the path segment to [a-z0-9-]: no separators, no '..',
    // no Windows-reserved characters. Never let free text become a path.
    const slug = slugify(config.infra.localServerName) || 'local-server';
    await write(`_system/infra/${slug}.md`, generateLocalServerMd(config));
  }

  // ── _system/templates/ ──
  await write('_system/templates/biz-initiative/CONTEXT.md', generateBizInitiativeTemplateMd());
  await mkdir('_system/templates/biz-initiative/assets');
  await mkdir('_system/templates/biz-initiative/output');

  await write('_system/templates/va-workflow/CONTEXT.md', generateVaWorkflowTemplateMd());
  await mkdir('_system/templates/va-workflow/assets');
  await mkdir('_system/templates/va-workflow/output');

  await write('_system/templates/product-build/CONTEXT.md', generateProductBuildTemplateMd());
  await mkdir('_system/templates/product-build/specs');
  await mkdir('_system/templates/product-build/assets');
  await mkdir('_system/templates/product-build/output');

  return { root, created, overwritten, dirs };
}
