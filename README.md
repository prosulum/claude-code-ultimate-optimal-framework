# claude-code-ultimate-optimal-framework

Scaffold a Claude Code workspace with routing, memory, and a self-updating file structure. One command. Works on macOS, Linux, and Windows.

[![npm version](https://img.shields.io/npm/v/claude-code-ultimate-optimal-framework.svg)](https://www.npmjs.com/package/claude-code-ultimate-optimal-framework)
[![downloads](https://img.shields.io/npm/dm/claude-code-ultimate-optimal-framework.svg)](https://www.npmjs.com/package/claude-code-ultimate-optimal-framework)
[![node](https://img.shields.io/node/v/claude-code-ultimate-optimal-framework.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/claude-code-ultimate-optimal-framework.svg)](./LICENSE)
[![platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-4c9)](#windows)

```bash
npx claude-code-ultimate-optimal-framework
```

That is the whole install step. No global package, no config file to hand-write.

Prefer a shorter command? Install once globally and you get the `ccuof` alias:

```bash
npm install -g claude-code-ultimate-optimal-framework
ccuof --help
```

The examples below use the short `ccuof` form. If you stick with `npx`, substitute the full package name — `npx` needs the package name, not the alias.

---

## The problem this solves

You start a Claude Code session and it loads the wrong files. It forgets how your project is organized, so you paste the same context again. Your `CLAUDE.md` grew into a wall of text nobody reads, and token usage climbs every time the repo gets bigger.

The fix is structure: a small set of files that tell Claude exactly what to read for a given task, and exactly what to skip. This tool writes that structure for you and fills it in from a few questions about your company.

---

## Quick start

Run it with `npx` (nothing to install first):

```bash
npx claude-code-ultimate-optimal-framework                      # interactive setup, current folder
npx claude-code-ultimate-optimal-framework --output ./my-team   # ...or into a specific folder
```

Or with the global install:

```bash
ccuof                      # interactive setup in the current folder
ccuof --output ./my-team   # ...or into a specific folder
```

The setup asks for:

- Company name, description, tagline, website, and industry
- Which departments you have (pick from a list, or add your own)
- Products and services
- VPS or always-on local machine (optional)
- Where to create the workspace

Then it writes the folder tree below, customized with your answers.

---

## What you get

```text
your-workspace/
├── CLAUDE.md                 # Master map, always loaded
├── CONTEXT.md                # Task router: where to go for each job
├── PROJECT-REGISTRY.md       # Index of active projects
├── company/                  # Brand voice, products, SOPs
├── departments/              # One workspace per department
├── products/                 # One workspace per product
├── projects/                 # Time-bounded work (auto-created)
└── _system/                  # Infrastructure docs + project templates
```

Each department, product, company, and `_system` workspace gets its own `CONTEXT.md` that scopes what Claude loads for tasks in that folder.

---

## How it works

### Three-layer routing

The point of the structure is a chain of maps, each one smaller and more specific than the last.

| Layer | File | Job | Target size |
|-------|------|-----|-------------|
| 1 | `CLAUDE.md` | Always loaded. The map of the whole workspace. | ≤ 200 lines |
| 2 | `CONTEXT.md` | Routes a task to the right folder. | 30–50 lines |
| 3 | `<folder>/CONTEXT.md` | Scoped instructions for that folder only. | 25–80 lines |

Claude reads layer 1, jumps to the one layer-3 file the task needs, and ignores the rest.

### A "Skip These" column, not just a "Load" column

Each workspace `CONTEXT.md` says what to load *and what to skip*. Telling Claude to skip the other departments' files is what keeps token usage flat as the workspace grows. That column is the mechanism, not a suggestion.

### Self-updating

Paste or speak an unstructured thought and Claude routes it to the right file:

- *"Our brand voice is warm but direct."* updates `company/voice-brand.md`
- *"We're launching a service called X."* updates `company/products.md`
- *"We need an onboarding process."* creates `company/sops/sop-onboarding.md`

The routing table that makes this work ships inside the generated `CLAUDE.md`.

### Auto-scaffolding new projects

Say `"New project: [describe it]"` and Claude infers the type (business initiative, VA workflow, or product build), copies the matching template from `_system/templates/`, and registers the project in `PROJECT-REGISTRY.md`.

---

## CLI reference

```text
ccuof [command] [options]
```

| Option | Short | What it does |
|--------|-------|--------------|
| `--output <dir>` | `-o` | Where to create the workspace (default: current folder) |
| `--config <file>` | | Build from a JSON file instead of prompting (non-interactive) |
| `--dry-run` | | Print the exact files that would be written, write nothing |
| `--force` | `-f` | Overwrite an existing workspace without asking |
| `--yes` | `-y` | Assume "yes" to confirmations |
| `--example-config` | | Print a starter config file and exit |
| `--version` | `-v` | Print the version |
| `--help` | `-h` | Show help |

Preview before you write:

```bash
ccuof --dry-run --output ./my-team
```

If the target folder already contains workspace files (`CLAUDE.md`, `CONTEXT.md`, or `PROJECT-REGISTRY.md`), the tool asks before overwriting (interactive) or stops and tells you to pass `--force` (with `--config` or without a terminal). Your edited files are safe by default.

---

## Non-interactive / CI use

Generate a config, edit it, then build with no prompts. This is the path for scripts, CI jobs, and any terminal without interactive input.

```bash
ccuof --example-config > workspace.json
# edit workspace.json
ccuof --config workspace.json --output ./my-team
```

`workspace.json` looks like this:

```json
{
  "company": {
    "name": "Acme Robotics",
    "description": "We build warehouse automation robots.",
    "tagline": "Ship faster.",
    "website": "https://example.com",
    "industry": "Robotics"
  },
  "departments": ["marketing", "sales", "engineering"],
  "products": [
    { "name": "PickBot 3000", "description": "Autonomous picking robot." }
  ],
  "infra": {
    "hasVps": false,
    "vpsHost": "",
    "vpsSshAlias": "",
    "hasLocalServer": false,
    "localServerName": ""
  },
  "outputDir": "."
}
```

With `--config`, the CLI never prompts, even in a terminal. If the target folder already contains workspace files, it stops with an error unless you pass `--force` or `--yes`.

---

## Windows

The tool runs on Windows the same as on macOS and Linux — via `npx claude-code-ultimate-optimal-framework`, or as `ccuof` after `npm install -g`.

**PowerShell or Command Prompt:**

```powershell
ccuof --output .\my-team
```

**Windows paths** work as arguments:

```powershell
ccuof --output C:\Users\you\claude-workspaces\acme
```

A few Windows notes:

- **Windows Terminal** (or the VS Code terminal) gives you the nicest output. On the older `cmd.exe` console, decorative check marks and arrows fall back to plain characters automatically, so you will never see garbled symbols.
- With `npx`, always use the full package name (`npx claude-code-ultimate-optimal-framework`) — `npx ccuof` will not resolve, because `npx` looks up package names and `ccuof` is the installed command's alias, not a package.
- Line endings in the generated files are LF, which Git and every editor on Windows handle fine.

---

## Requirements

- **Node.js 18.3 or newer** (Node 20+ recommended). Check with `node --version`.
- **Claude Code** to open and use the workspace: [claude.ai/code](https://claude.ai/code).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `npx ccuof` fails with `404 Not Found` | `npx` needs the package name: `npx claude-code-ultimate-optimal-framework`. The short `ccuof` command comes from `npm install -g`. |
| `ccuof: command not found` | Install it globally first: `npm install -g claude-code-ultimate-optimal-framework`. |
| It refuses to run and mentions `--force` | A workspace already exists in that folder. Pass `--force` to overwrite, or pick a new `--output` folder. |
| It exits saying interactive setup needs a terminal | You are in a non-interactive shell. Use `--config` (see [Non-interactive use](#non-interactive--ci-use)). |
| Symbols look odd in an old console | Switch to Windows Terminal, or ignore it: the fallback characters are still readable. |

---

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, the project layout, and the release steps. Run `npm test` before opening a PR.

---

## License

[MIT](./LICENSE) © ProSulum
