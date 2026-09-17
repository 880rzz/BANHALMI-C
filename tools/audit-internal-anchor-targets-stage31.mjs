import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const skipDirs = new Set(['.git', 'node_modules', '_site']);

function walk(dir = root) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function routeToFile(pathname, sourceFile) {
  let clean = pathname.split('?')[0];
  if (!clean || clean === '/') return path.join(root, 'index.html');
  if (clean.startsWith('/')) clean = clean.slice(1);
  else clean = path.normalize(path.join(path.relative(root, path.dirname(sourceFile)), clean)).replaceAll('\\', '/');
  if (!path.extname(clean) || clean.endsWith('/')) clean = path.join(clean, 'index.html');
  return path.join(root, clean);
}

const htmlFiles = walk();
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const links = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>/gi)].map((m) => m[1]);
  for (const href of links) {
    if (!href.includes('#')) continue;
    let url;
    try {
      url = new URL(href, `https://www.norbertbanhalmi.com/${path.relative(root, file).replaceAll('\\', '/')}`);
    } catch {
      failures.push(`${path.relative(root, file)}: invalid fragment URL ${href}`);
      continue;
    }
    if (url.hostname !== 'www.norbertbanhalmi.com') continue;
    const id = decodeURIComponent(url.hash.slice(1));
    if (!id) continue;
    const targetFile = href.startsWith('#') ? file : routeToFile(url.pathname, file);
    if (!fs.existsSync(targetFile)) {
      failures.push(`${path.relative(root, file)}: fragment target file missing for ${href}`);
      continue;
    }
    const targetHtml = fs.readFileSync(targetFile, 'utf8');
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`\\bid=["']${escaped}["']`, 'i').test(targetHtml)) {
      failures.push(`${path.relative(root, file)}: ${href} points to missing #${id} in ${path.relative(root, targetFile)}`);
    }
  }
}

const css = fs.readFileSync(path.join(root, 'assets/css/style.css'), 'utf8');
for (const anchor of ['#selected-work', '#next-step', '#fine-art-selected-work', '#private-conversation', '.contact-form-section']) {
  if (!css.includes(anchor) || !css.includes('scroll-margin-top')) failures.push(`style.css: fixed-header fragment offset contract missing for ${anchor}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Stage 31 internal fragment audit passed across ${htmlFiles.length} HTML files.`);
