import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const ignored = new Set(['.git', 'node_modules', '_site', 'artifacts']);
const failures = [];
let audited = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) audit(full);
  }
}

function audit(file) {
  const html = fs.readFileSync(file, 'utf8');
  audited += 1;
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const canonical = html.match(/<link\b[^>]*rel="stylesheet"[^>]*href="\/assets\/css\/site\.css[^"]*"[^>]*>/gi) || [];
  if (canonical.length !== 1) failures.push(`${rel}: expected exactly one render-blocking site.css link, found ${canonical.length}`);
  if (/href="\/assets\/css\/site\.css[^"]*"[^>]*media="print"/i.test(html)) failures.push(`${rel}: site.css must not use the print/onload deferral pattern`);
  if (/rel="preload"[^>]*as="style"[^>]*href="\/assets\/css\/site\.css/i.test(html)) failures.push(`${rel}: site.css must not be preloaded as a deferred stylesheet`);
  if (html.includes('class="site-footer"')) {
    const accordions = html.match(/<details\b[^>]*class="[^"]*footer-accordion[^"]*"[^>]*>/gi) || [];
    for (const tag of accordions) if (/\bopen(?:\s|=|>)/i.test(tag)) failures.push(`${rel}: footer accordion must default closed in source markup; desktop runtime owns open state`);
  }
}

walk(root);
if (failures.length) {
  console.error(`Render stability audit failed (${failures.length}):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Render stability audit passed for ${audited} HTML pages.`);
