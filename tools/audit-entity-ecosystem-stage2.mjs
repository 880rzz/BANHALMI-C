import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Final permanent protected stage-two gate for the professional entity ecosystem.
const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const legacyArchiveOrigin = ['https://www.', 'banhalmi.art', '/#studio-'].join('');
const oldIds = [`${legacyArchiveOrigin}vienna`, `${legacyArchiveOrigin}budapest`];
const htmlFiles = [];
const textExtensions = new Set(['.html', '.json', '.jsonld', '.txt', '.md', '.js', '.mjs', '.xml']);

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension)) continue;
    const text = await readFile(full, 'utf8');
    for (const id of oldIds) if (text.includes(id)) errors.push(`${path.relative(root, full)}: legacy archive-owned studio ID remains: ${id}`);
    if (extension === '.html') htmlFiles.push({ full, text });
  }
}
await walk(root);

let contentPages = 0;
for (const { full, text: html } of htmlFiles) {
  const relative = path.relative(root, full).replaceAll(path.sep, '/');
  const hasNoindex = /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  const hasRedirect = /window\.location\.(?:replace|href)/i.test(html);
  const isRedirectStub = hasNoindex && hasRedirect && !/(?:^|\/)404\.html$/i.test(relative);
  if (isRedirectStub || !html.includes('</footer>')) continue;
  contentPages += 1;
  if (!html.includes('data-banhalmi-ecosystem')) errors.push(`${relative}: official ecosystem navigation missing`);
  const lang = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.toLowerCase() || 'en';
  const professional = lang.startsWith('hu') ? 'https://www.norbertbanhalmi.com/hu/' : lang.startsWith('de') ? 'https://www.norbertbanhalmi.com/de-at/' : 'https://www.norbertbanhalmi.com/';
  const archive = lang.startsWith('hu') ? 'https://www.banhalmi.art/hu/' : lang.startsWith('de') ? 'https://www.banhalmi.art/de-at/' : 'https://www.banhalmi.art/';
  for (const url of [professional, archive, 'https://blog.banhalmi.art/']) {
    if (!html.includes(`href="${url}"`)) errors.push(`${relative}: ecosystem link missing ${url}`);
  }
  if (!html.includes(`href="${professional}" aria-current="page"`)) errors.push(`${relative}: professional site is not marked as current`);
}
if (contentPages < 54) errors.push(`Unexpectedly low professional content-page coverage: ${contentPages}`);

for (const relative of ['llms.txt', 'ai.txt', 'entity.jsonld', 'entity-graph.json', 'knowledge.json', 'ecosystem.json']) {
  const text = await readFile(path.join(root, relative), 'utf8');
  for (const url of ['https://www.norbertbanhalmi.com/', 'https://www.banhalmi.art/', 'https://blog.banhalmi.art/']) {
    if (!text.includes(url)) errors.push(`${relative}: official ecosystem URL missing ${url}`);
  }
}

const css = await readFile(path.join(root, 'assets/css/style.css'), 'utf8');
if (!css.includes('/* BANHALMI_OFFICIAL_ECOSYSTEM */')) errors.push('style.css: ecosystem component styles missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`Stage-two entity ecosystem audit passed across ${contentPages} professional content pages: canonical studio IDs and visible three-site navigation are consistent.`);
