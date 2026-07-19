// Canonical workspace config: normalization, validation, and JSON loading.
//
// Both the interactive prompts and the non-interactive `--config file.json` path
// funnel through `normalizeConfig` + `validateConfig`, so the two entry points can
// never drift apart. `scaffold()` only ever receives a normalized, validated config.

import fs from 'fs-extra';
import path from 'path';

/** Turn a free-text name into a filesystem-safe slug. */
export function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** ISO date (YYYY-MM-DD) for "last updated" stamps. */
function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Sanitize a free-text field before it is interpolated into generated markdown.
 * The generated CLAUDE.md/CONTEXT.md files are instruction files that Claude Code
 * auto-loads, so config text (especially from a --config JSON file) must not be
 * able to inject new headings, code fences, or control characters:
 *   - control characters are stripped (incl. newlines — every field is single-line)
 *   - backticks are removed so text cannot open/close a code fence
 *   - length is capped to keep a pathological field from flooding the file
 */
export function cleanText(value, maxLen = 500) {
  return String(value ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]+/g, " ")
    .replace(/`+/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/**
 * Fill defaults and derive computed fields (slugs, date) on a raw config object.
 * Accepts partial input (from a hand-written --config file) and returns a complete,
 * predictable shape. Does not throw — validation is a separate step.
 */
export function normalizeConfig(raw = {}) {
  const company = raw.company || {};
  const infra = raw.infra || {};

  const departments = Array.from(
    new Set(
      (Array.isArray(raw.departments) ? raw.departments : [])
        .map((d) => slugify(d))
        .filter(Boolean)
    )
  );

  const products = (Array.isArray(raw.products) ? raw.products : [])
    .filter((p) => p && (p.name || p.slug))
    .map((p) => ({
      name: cleanText(p.name || p.slug, 200),
      slug: slugify(p.slug || p.name),
      description: cleanText(p.description, 1000),
    }))
    .filter((p) => p.slug);

  return {
    company: {
      name: cleanText(company.name, 200),
      description: cleanText(company.description, 1000),
      tagline: cleanText(company.tagline, 300),
      website: cleanText(company.website, 300),
      industry: cleanText(company.industry, 200),
      date: company.date || today(),
    },
    departments,
    products,
    infra: {
      hasVps: Boolean(infra.hasVps),
      vpsHost: cleanText(infra.vpsHost, 300),
      vpsSshAlias: cleanText(infra.vpsSshAlias, 200),
      hasLocalServer: Boolean(infra.hasLocalServer),
      localServerName: cleanText(infra.localServerName, 200),
    },
    outputDir: String(raw.outputDir || '.').trim() || '.',
  };
}

/**
 * Validate a normalized config. Returns an array of human-readable error strings;
 * an empty array means the config is valid.
 */
export function validateConfig(config) {
  const errors = [];
  const c = config.company || {};

  if (!c.name) errors.push('company.name is required');
  if (!c.description) errors.push('company.description is required');
  if (!c.industry) errors.push('company.industry is required');

  if (!Array.isArray(config.departments)) {
    errors.push('departments must be an array');
  }
  if (!Array.isArray(config.products)) {
    errors.push('products must be an array');
  }

  if (config.infra?.hasVps && !config.infra.vpsHost) {
    errors.push('infra.vpsHost is required when infra.hasVps is true');
  }
  if (config.infra?.hasLocalServer && !config.infra.localServerName) {
    errors.push('infra.localServerName is required when infra.hasLocalServer is true');
  }

  return errors;
}

/**
 * Load and normalize a config from a JSON file. Throws a friendly Error on a
 * missing file, bad JSON, or validation failure.
 */
export async function loadConfigFile(filePath) {
  const resolved = path.resolve(filePath);

  if (!(await fs.pathExists(resolved))) {
    throw new Error(`Config file not found: ${resolved}`);
  }

  let raw;
  try {
    raw = await fs.readJson(resolved);
  } catch (err) {
    throw new Error(`Config file is not valid JSON (${resolved}): ${err.message}`);
  }

  const config = normalizeConfig(raw);
  const errors = validateConfig(config);
  if (errors.length) {
    throw new Error(
      `Config file has ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`
    );
  }
  return config;
}

/** A complete example config, printed by `--example-config`. */
export function exampleConfig() {
  return {
    company: {
      name: 'Acme Robotics',
      description: 'We build warehouse automation robots.',
      tagline: 'Ship faster.',
      website: 'https://example.com',
      industry: 'Robotics',
    },
    departments: ['marketing', 'sales', 'engineering'],
    products: [
      { name: 'PickBot 3000', description: 'Autonomous picking robot.' },
    ],
    infra: {
      hasVps: false,
      vpsHost: '',
      vpsSshAlias: '',
      hasLocalServer: false,
      localServerName: '',
    },
    outputDir: '.',
  };
}
