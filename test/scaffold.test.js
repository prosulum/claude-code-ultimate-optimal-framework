import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { scaffold, workspaceExists } from '../src/scaffold.js';
import { normalizeConfig } from '../src/config.js';

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ccuof-'));
}

const base = normalizeConfig({
  company: { name: 'Acme', description: 'We build robots.', industry: 'Robotics' },
  departments: ['Marketing', 'engineering', 'Custom Lab'],
  products: [{ name: 'PickBot 3000', description: 'A robot.' }],
  infra: {
    hasVps: true,
    vpsHost: '203.0.113.9',
    vpsSshAlias: 'acme',
    hasLocalServer: true,
    localServerName: 'Mac Mini',
  },
});

test('scaffold creates the expected files', async () => {
  const dir = tmp();
  try {
    const m = await scaffold({ ...base, outputDir: dir });
    assert.equal(m.root, dir);
    const expected = [
      'CLAUDE.md',
      'CONTEXT.md',
      'PROJECT-REGISTRY.md',
      'company/CONTEXT.md',
      'company/voice-brand.md',
      'company/products.md',
      '_system/CONTEXT.md',
      '_system/infra/vps.md',
      '_system/infra/mac-mini.md',
      '_system/templates/biz-initiative/CONTEXT.md',
      'departments/custom-lab/CONTEXT.md',
      'departments/engineering/CONTEXT.md',
      'products/pickbot-3000/CONTEXT.md',
    ];
    for (const f of expected) {
      assert.ok(await fs.pathExists(path.join(dir, f)), `missing ${f}`);
    }
    assert.ok(m.created.includes('CLAUDE.md'));
    assert.equal(m.overwritten.length, 0);
  } finally {
    await fs.remove(dir);
  }
});

test('workspaceExists detects a scaffolded directory', async () => {
  const dir = tmp();
  try {
    assert.equal(await workspaceExists(dir), false);
    await scaffold({ ...base, outputDir: dir });
    assert.equal(await workspaceExists(dir), true);
  } finally {
    await fs.remove(dir);
  }
});

test('dry-run reports a plan but writes nothing', async () => {
  const dir = tmp();
  try {
    const m = await scaffold({ ...base, outputDir: dir }, { dryRun: true });
    assert.ok(m.created.length > 0);
    assert.equal(await fs.pathExists(path.join(dir, 'CLAUDE.md')), false);
  } finally {
    await fs.remove(dir);
  }
});

test('re-scaffold reports overwritten files instead of created', async () => {
  const dir = tmp();
  try {
    await scaffold({ ...base, outputDir: dir });
    const m = await scaffold({ ...base, outputDir: dir });
    assert.ok(m.overwritten.includes('CLAUDE.md'));
    assert.equal(m.created.includes('CLAUDE.md'), false);
  } finally {
    await fs.remove(dir);
  }
});

test('generated infra section uses a cloud-agnostic sync label (no hardcoded vendor lock-in)', async () => {
  const dir = tmp();
  try {
    await scaffold({ ...base, outputDir: dir });
    const md = await fs.readFile(path.join(dir, 'CLAUDE.md'), 'utf8');
    assert.match(md, /Cloud sync \(Dropbox \/ OneDrive/);
    assert.doesNotMatch(md, /\| Full Dropbox \|/);
  } finally {
    await fs.remove(dir);
  }
});
