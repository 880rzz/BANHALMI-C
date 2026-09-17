import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Permanent cross-repository identity guard for the single canonical Person node.
const root = path.resolve(import.meta.dirname, '..');
const canonical = 'https://www.norbertbanhalmi.com/about/';
const legacyWwwRoot = 'https://www.banhalmi' + '.art/norbert-banhalmi';
const legacyRoot = 'https://banhalmi' + '.art/norbert-banhalmi';
const forbidden = [
  `${legacyWwwRoot}#person`,
  `${legacyRoot}#person`,
  legacyWwwRoot,
  legacyRoot
];
const extensions = new Set([
  '.html', '.htm', '.json', '.jsonld', '.txt', '.md', '.mjs', '.js', '.cjs',
  '.xml', '.yaml', '.yml', '.css', '.svg', '.webmanifest', '.csv'
]);
const special = new Set(['_redirects', 'robots.txt', 'CNAME', 'vercel.json']);
const files = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', 'playwright-report', 'test-results'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (extensions.has(path.extname(entry.name).toLowerCase()) || special.has(entry.name)) files.push(full);
  }
}

await walk(root);
let canonicalHits = 0;
const errors = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  canonicalHits += text.split(canonical).length - 1;
  for (const value of forbidden) {
    if (text.includes(value)) errors.push(`${path.relative(root, file)}: legacy Person identifier ${value}`);
  }
}

if (!canonicalHits) errors.push('Canonical Person identifier is not present.');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Canonical Person audit passed across ${files.length} files with ${canonicalHits} references.`);
