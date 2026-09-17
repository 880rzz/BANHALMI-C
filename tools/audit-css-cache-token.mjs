import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync('assets/css/site.css');
const expected = `design-${createHash('sha256').update(css).digest('hex').slice(0, 16)}`;
const files = [];
const skip = new Set(['.git', 'node_modules', '.github', 'artifacts']);
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
}
walk('.');

const errors = [];
let references = 0;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/\/assets\/css\/site\.css\?v=([^"']+)/g)) {
    references += 1;
    if (match[1] !== expected) errors.push(`${file}: stale site.css token ${match[1]} (expected ${expected})`);
  }
}
if (references < 50) errors.push(`expected at least 50 versioned site.css references, found ${references}`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`CSS cache-token audit passed: ${references} site.css references use ${expected}.`);
