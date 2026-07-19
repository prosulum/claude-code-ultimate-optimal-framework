# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-07-18

Backward-compatible release. Existing usage (`npx claude-code-ultimate-optimal-framework`)
behaves exactly as before; everything below is additive or a safety fix.

### Added
- **Short command alias** `ccuof` alongside the full package name.
- **Real CLI flags** via a proper argument parser:
  - `--help` / `-h`, `--version` / `-v` (previously ignored — they dropped you into the prompts).
  - `--output` / `-o <dir>` to set the target directory without a prompt.
  - `--config <file>` — **non-interactive mode**: build from a JSON file (CI / scripting friendly).
  - `--dry-run` — preview the exact files that would be written, writing nothing.
  - `--force` / `-f` and `--yes` / `-y`.
  - `--example-config` — print a ready-to-edit config file.
- **Tests** (`npm test`, Node's built-in test runner, no extra dependencies).
- **`LICENSE`** file now ships in the package (MIT was declared but the file was missing).
- `repository`, `homepage`, and `bugs` metadata so the npm page links to source.
- A `files` allowlist so only intended files are published.

### Fixed
- **Data-loss guard**: running in a directory that already contains a workspace no
  longer silently overwrites your edited files. It now asks (interactive) or refuses
  unless `--force` is passed (non-interactive). The guard triggers on any root
  workspace file (`CLAUDE.md`, `CONTEXT.md`, or `PROJECT-REGISTRY.md`), and
  `--config` runs never prompt (so CI jobs cannot hang on a hidden confirm).
- **Security — path containment**: the always-on machine name is now slugified to
  `[a-z0-9-]` before becoming a filename, so free-text names (including
  traversal-shaped or Windows-reserved characters) can never write outside the
  workspace or produce invalid Windows paths.
- **Security — input sanitization**: free-text config fields are stripped of
  control characters, newlines, and backticks before being written into the
  generated instruction files, and are length-capped.
- **Windows console rendering**: decorative glyphs (`✓ • → —`) now fall back to
  code-page-safe characters on legacy `cmd.exe`, preventing mojibake. Modern terminals
  (Windows Terminal, VS Code, Git Bash, WSL, macOS, Linux) still get full Unicode.
- **Non-interactive stdin** no longer hangs: without a TTY and without `--config`, the
  CLI prints a clear message instead of waiting forever on a prompt.

### Changed
- Generated `CLAUDE.md` uses a cloud-agnostic sync label ("Cloud sync (Dropbox /
  OneDrive / etc.)") instead of assuming one provider.

## [1.0.2]

- Initial published scaffolder.
