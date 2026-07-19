import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import {
  slugify,
  normalizeConfig,
  validateConfig,
  loadConfigFile,
  exampleConfig,
} from '../src/config.js';

test('slugify normalizes names to filesystem-safe slugs', () => {
  assert.equal(slugify('PickBot 3000!'), 'pickbot-3000');
  assert.equal(slugify('  Customer Success  '), 'customer-success');
  assert.equal(slugify('A/B & C'), 'ab-c');
  assert.equal(slugify('---weird---'), 'weird');
});

test('normalizeConfig slugs and dedupes departments', () => {
  const c = normalizeConfig({
    company: { name: 'X', description: 'Y', industry: 'Z' },
    departments: ['Marketing', 'marketing', 'Custom Lab'],
  });
  assert.deepEqual(c.departments, ['marketing', 'custom-lab']);
  assert.match(c.company.date, /^\d{4}-\d{2}-\d{2}$/);
});

test('normalizeConfig derives product slugs from names', () => {
  const c = normalizeConfig({
    company: { name: 'X', description: 'Y', industry: 'Z' },
    products: [{ name: 'PickBot 3000', description: 'A robot.' }],
  });
  assert.equal(c.products[0].slug, 'pickbot-3000');
  assert.equal(c.products[0].name, 'PickBot 3000');
});

test('normalizeConfig tolerates a completely empty input', () => {
  const c = normalizeConfig();
  assert.deepEqual(c.departments, []);
  assert.deepEqual(c.products, []);
  assert.equal(c.outputDir, '.');
});

test('validateConfig requires core company fields', () => {
  const errs = validateConfig(normalizeConfig({}));
  assert.ok(errs.some((e) => e.includes('company.name')));
  assert.ok(errs.some((e) => e.includes('company.description')));
  assert.ok(errs.some((e) => e.includes('company.industry')));
});

test('validateConfig requires vpsHost when hasVps is true', () => {
  const errs = validateConfig(
    normalizeConfig({
      company: { name: 'X', description: 'Y', industry: 'Z' },
      infra: { hasVps: true },
    })
  );
  assert.ok(errs.some((e) => e.includes('vpsHost')));
});

test('the built-in example config passes validation', () => {
  assert.deepEqual(validateConfig(normalizeConfig(exampleConfig())), []);
});

test('loadConfigFile rejects invalid JSON', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccuof-'));
  try {
    const p = path.join(dir, 'bad.json');
    await fs.writeFile(p, '{ not json');
    await assert.rejects(() => loadConfigFile(p), /not valid JSON/);
  } finally {
    await fs.remove(dir);
  }
});

test('loadConfigFile rejects a missing file', async () => {
  await assert.rejects(() => loadConfigFile('/no/such/file-xyz.json'), /not found/);
});

test('loadConfigFile loads, normalizes, and validates', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccuof-'));
  try {
    const p = path.join(dir, 'ok.json');
    await fs.writeJson(p, exampleConfig());
    const c = await loadConfigFile(p);
    assert.equal(c.company.name, 'Acme Robotics');
    assert.equal(c.products[0].slug, 'pickbot-3000');
  } finally {
    await fs.remove(dir);
  }
});
