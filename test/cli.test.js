import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import fs from 'fs-extra';
import { exampleConfig } from '../src/config.js';

const BIN = fileURLToPath(new URL('../bin/claude-code-ultimate-optimal-framework.js', import.meta.url));
const PKG = fileURLToPath(new URL('../package.json', import.meta.url));

/** Run the CLI as a real subprocess with non-TTY stdin. */
function run(args, opts = {}) {
  return new Promise((resolve) => {
    execFile(process.execPath, [BIN, ...args], { encoding: 'utf8', ...opts }, (err, stdout, stderr) => {
      resolve({ code: err ? (err.code ?? 1) : 0, stdout, stderr });
    });
  });
}

test('--version prints the package version', async () => {
  const { code, stdout } = await run(['--version']);
  const pkg = await fs.readJson(PKG);
  assert.equal(code, 0);
  assert.equal(stdout.trim(), pkg.version);
});

test('--help prints usage and the ccuof alias', async () => {
  const { code, stdout } = await run(['--help']);
  assert.equal(code, 0);
  assert.match(stdout, /USAGE/);
  assert.match(stdout, /ccuof/);
});

test('--example-config prints valid JSON', async () => {
  const { code, stdout } = await run(['--example-config']);
  assert.equal(code, 0);
  const parsed = JSON.parse(stdout);
  assert.equal(parsed.company.name, exampleConfig().company.name);
});

test('an unknown option exits non-zero with a helpful error', async () => {
  const { code, stderr } = await run(['--totally-bogus']);
  assert.equal(code, 1);
  assert.match(stderr, /Error/);
  assert.match(stderr, /--help/);
});

test('interactive setup without a TTY fails clearly instead of hanging', async () => {
  const { code, stderr } = await run([]);
  assert.equal(code, 1);
  assert.match(stderr, /--config/);
});

test('--config builds a workspace non-interactively', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccuof-cli-'));
  try {
    const cfgPath = path.join(dir, 'workspace.json');
    const out = path.join(dir, 'ws');
    await fs.writeJson(cfgPath, exampleConfig());
    const { code, stdout } = await run(['--config', cfgPath, '--output', out]);
    assert.equal(code, 0, stdout);
    assert.ok(await fs.pathExists(path.join(out, 'CLAUDE.md')));
    assert.ok(await fs.pathExists(path.join(out, 'departments/engineering/CONTEXT.md')));
  } finally {
    await fs.remove(dir);
  }
});

test('--config --dry-run writes nothing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccuof-cli-'));
  try {
    const cfgPath = path.join(dir, 'workspace.json');
    const out = path.join(dir, 'ws');
    await fs.writeJson(cfgPath, exampleConfig());
    const { code } = await run(['--config', cfgPath, '--output', out, '--dry-run']);
    assert.equal(code, 0);
    assert.equal(await fs.pathExists(path.join(out, 'CLAUDE.md')), false);
  } finally {
    await fs.remove(dir);
  }
});

test('re-running over an existing workspace without --force is refused (non-interactive)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccuof-cli-'));
  try {
    const cfgPath = path.join(dir, 'workspace.json');
    const out = path.join(dir, 'ws');
    await fs.writeJson(cfgPath, exampleConfig());
    await run(['--config', cfgPath, '--output', out]); // first build
    const { code, stderr } = await run(['--config', cfgPath, '--output', out]);
    assert.equal(code, 1);
    assert.match(stderr, /--force/);
  } finally {
    await fs.remove(dir);
  }
});

test('re-running with --force overwrites', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccuof-cli-'));
  try {
    const cfgPath = path.join(dir, 'workspace.json');
    const out = path.join(dir, 'ws');
    await fs.writeJson(cfgPath, exampleConfig());
    await run(['--config', cfgPath, '--output', out]);
    const { code } = await run(['--config', cfgPath, '--output', out, '--force']);
    assert.equal(code, 0);
  } finally {
    await fs.remove(dir);
  }
});
