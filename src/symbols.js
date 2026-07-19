// Terminal-safe symbols.
//
// Legacy Windows consoles (cmd.exe / older conhost) frequently run on an OEM
// code page (437/850) and mangle multi-byte Unicode glyphs into `?` or mojibake.
// Modern terminals — Windows Terminal, VS Code, ConEmu/Cmder, Git Bash, WSL, and
// every macOS/Linux terminal — render Unicode fine. We detect capability and fall
// back to code-page-safe alternatives (the same convention the `figures` package
// uses) so output looks correct everywhere without a runtime dependency.

export function supportsUnicode(env = process.env, platform = process.platform) {
  if (platform !== 'win32') {
    // The Linux kernel virtual console (TERM=linux) uses a limited font that
    // cannot render these glyphs; every other non-Windows terminal is UTF-8.
    return env.TERM !== 'linux';
  }

  // Known-good Windows terminals advertise themselves via env vars.
  return Boolean(
    env.WT_SESSION ||                                  // Windows Terminal
    env.TERM_PROGRAM === 'vscode' ||                   // VS Code integrated terminal
    env.ConEmuTask ||                                  // ConEmu / Cmder
    (env.TERM && env.TERM !== 'dumb') ||               // Git Bash / mintty / MSYS
    env.WSL_DISTRO_NAME                                // WSL
  );
}

const UNICODE = supportsUnicode();

// Each entry: [unicode, ascii-safe fallback]
const TABLE = {
  tick: ['✓', '√'], // √ exists in CP437/CP850
  cross: ['✗', 'x'],
  bullet: ['•', '-'],
  arrow: ['→', '->'],
  dash: ['—', '--'],
  middot: ['·', '-'],
  pointer: ['❯', '>'],
};

/** Resolve a named symbol to a terminal-safe string. */
export function sym(name) {
  const pair = TABLE[name];
  if (!pair) throw new Error(`Unknown symbol: ${name}`);
  return UNICODE ? pair[0] : pair[1];
}

// Pre-resolved shortcuts for the common glyphs.
export const S = Object.freeze(
  Object.fromEntries(Object.keys(TABLE).map((k) => [k, sym(k)]))
);
