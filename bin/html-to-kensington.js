#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { copyToClipboard } from './lib/clipboard.js';
import { convertHtml } from './lib/convert-html.js';
import { loadFormatter } from './lib/formatter.js';
import { readHtml } from './lib/read-html.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  const helpFile = join(dirname(fileURLToPath(import.meta.url)), './lib', 'help.txt');
  process.stdout.write(readFileSync(helpFile, 'utf8'));
  process.exit(0);
}

const KNOWN_FLAGS = new Set(['--copy', '-c', '--help', '-h']);
const flags = args.filter(a => a.startsWith('-'));
const positional = args.filter(a => !a.startsWith('-'));

const unknown = flags.filter(f => !KNOWN_FLAGS.has(f));
if (unknown.length) {
  process.stderr.write(`Unknown option: ${unknown[0]}\nRun with --help for usage.\n`);
  process.exit(1);
}
if (positional.length > 1) {
  process.stderr.write(`Too many arguments. Expected at most one file.\nRun with --help for usage.\n`);
  process.exit(1);
}

const copy = flags.includes('--copy') || flags.includes('-c');
const file = positional[0];

let html;
if (file) {
  try {
    html = readFileSync(file, 'utf8');
  } catch {
    process.stderr.write(`Cannot read file: ${file}\n`);
    process.exit(1);
  }
} else {
  html = (await readHtml()).trim();
}

if (!html) {
  process.stderr.write('No HTML input provided.\n');
  process.exit(1);
}

const { maxLen, apply } = await loadFormatter();
const result = convertHtml(html, maxLen);
const output = await apply(result);

process.stdout.write(`${output.trimEnd()}\n`);

if (copy) {
  copyToClipboard(output.trimEnd());
}
