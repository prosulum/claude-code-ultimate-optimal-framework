import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sym, S, supportsUnicode } from '../src/symbols.js';

test('supportsUnicode is true on non-Windows platforms', () => {
  assert.equal(supportsUnicode({}, 'darwin'), true);
  assert.equal(supportsUnicode({ TERM: 'xterm-256color' }, 'linux'), true);
});

test('supportsUnicode is false on the Linux kernel virtual console (TERM=linux)', () => {
  assert.equal(supportsUnicode({ TERM: 'linux' }, 'linux'), false);
});

test('supportsUnicode is false on a bare legacy Windows console', () => {
  assert.equal(supportsUnicode({}, 'win32'), false);
  assert.equal(supportsUnicode({ TERM: 'dumb' }, 'win32'), false);
});

test('supportsUnicode is true on modern Windows terminals', () => {
  assert.equal(supportsUnicode({ WT_SESSION: '1' }, 'win32'), true);
  assert.equal(supportsUnicode({ TERM_PROGRAM: 'vscode' }, 'win32'), true);
  assert.equal(supportsUnicode({ TERM: 'xterm' }, 'win32'), true);
  assert.equal(supportsUnicode({ WSL_DISTRO_NAME: 'Ubuntu' }, 'win32'), true);
});

test('sym returns non-empty strings for every known glyph', () => {
  for (const k of ['tick', 'cross', 'bullet', 'arrow', 'dash', 'middot', 'pointer']) {
    assert.equal(typeof sym(k), 'string');
    assert.ok(sym(k).length > 0);
  }
});

test('sym throws on an unknown glyph name', () => {
  assert.throws(() => sym('nope'));
});

test('S mirrors sym() for resolved glyphs', () => {
  assert.equal(S.tick, sym('tick'));
  assert.equal(S.arrow, sym('arrow'));
});
