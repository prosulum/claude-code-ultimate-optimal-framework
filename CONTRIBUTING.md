# Contributing

Thanks for your interest in improving `claude-code-ultimate-optimal-framework`.

## Local development

```bash
git clone https://github.com/prosulum/claude-code-ultimate-optimal-framework.git
cd claude-code-ultimate-optimal-framework
npm install

# Run the CLI from source
node bin/claude-code-ultimate-optimal-framework.js --help
node bin/claude-code-ultimate-optimal-framework.js --dry-run --output ./scratch

# Run the test suite
npm test
```

## Project layout

```
bin/   Thin executable that parses process.argv and calls src/cli.js
src/
  cli.js         Argument parsing, command routing, overwrite safety, errors
  prompts.js     Interactive Q&A (returns a raw config)
  config.js      Config schema: normalize, validate, load JSON, example
  scaffold.js    Writes the workspace; returns a manifest; supports dry-run
  templates.js   Pure string generators for every workspace file
  report.js      Success / dry-run terminal output
  help.js        --help text and --version resolution
  symbols.js     Terminal-safe glyphs (Windows-aware)
test/  node:test suites (config, scaffold, symbols, cli)
```

Both the interactive path and the `--config` path funnel through
`normalizeConfig()` + `validateConfig()`, so the two entry points never drift.

## Conventions

- Keep `scaffold.js` free of prompts — the caller owns overwrite policy.
- Any decorative glyph printed to the terminal must go through `src/symbols.js`.
- Add or update a test for any behavior change; `npm test` must pass.

## Releasing (maintainers)

```bash
npm test                       # must be green
npm version <patch|minor|major> # bumps package.json + tags
npm publish --dry-run          # verify the file list
npm publish
git push --follow-tags
```
