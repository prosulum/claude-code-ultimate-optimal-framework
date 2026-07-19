import fs from 'fs-extra';

const PKG_URL = new URL('../package.json', import.meta.url);

/** Read the package version straight from package.json so --version never drifts. */
export async function getVersion() {
  const pkg = await fs.readJson(PKG_URL);
  return pkg.version;
}

export const HELP = `
  claude-code-ultimate-optimal-framework  (alias: ccuof)

  Scaffold a Claude Code workspace with routing, memory, and a
  self-updating architecture — in one command.

  USAGE
    npx claude-code-ultimate-optimal-framework [command] [options]
    npx ccuof [command] [options]

  COMMANDS
    init                 Create a workspace (default; runs the interactive setup)

  OPTIONS
    -o, --output <dir>   Where to create the workspace (default: current directory)
        --config <file>  Build from a JSON config instead of prompting
                         (non-interactive; ideal for CI and scripting)
        --dry-run        Show what would be created without writing anything
    -f, --force          Overwrite an existing workspace without asking
    -y, --yes            Skip confirmation prompts (assume "yes")
        --example-config Print an example --config JSON file and exit
    -v, --version        Print the version and exit
    -h, --help           Show this help and exit

  EXAMPLES
    # Interactive setup in the current directory
    npx ccuof

    # Interactive setup into a specific folder
    npx ccuof --output ./my-workspace

    # Preview without writing
    npx ccuof --dry-run --output ./my-workspace

    # Non-interactive (CI / scripting)
    npx ccuof --example-config > workspace.json   # then edit it
    npx ccuof --config workspace.json --output ./my-workspace

  Docs: https://github.com/prosulum/claude-code-ultimate-optimal-framework
`;
