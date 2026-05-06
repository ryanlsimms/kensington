import { spawnSync } from 'node:child_process';

export function copyToClipboard(text) {
  try {
    const clipCmd = process.platform === 'darwin' ? 'pbcopy'
      : process.platform === 'win32' ? 'clip'
        : 'xclip';
    const clipArgs = process.platform === 'linux' ? ['-selection', 'clipboard'] : [];
    const result = spawnSync(clipCmd, clipArgs, { input: text });
    if (!result.error && result.status === 0) {
      process.stderr.write('Copied to clipboard.\n');
    }
  } catch {
    // clipboard not available
  }
}
