import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const canonicalHosts = new Set(['www.norbertbanhalmi.com','norbertbanhalmi.com','banhalminorbert.hu','www.banhalminorbert.hu','banhalmi.at','www.banhalmi.at']);
const failures = [];
let htmlCount = 0;
let linkCount = 0;
let fragmentCount = 0;

async function walk(dir) {
  const out = [];
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    if (['.git','node_modules','reports','dist'].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...await walk(p));
    else if (ent.isFile() && ent.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function decodeFragment(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

function extractIds(html) {
  const ids = new Set();
  for (const m of html.matchAll(/\b(?:id|name)\s*=\s*(["'])(.*?)\1/gi)) ids.add(m[2]);
  return ids;
}

function extractHrefs(html) {
  const hrefs = [];
  for (const m of html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)) hrefs.push(m[2].trim());
  return hrefs;
}

async function exists(p) { try { return (await stat(p)).isFile(); } catch { return false; } }

async function resolveTarget(fromFile, pathname) {
  if (!pathname || pathname === '.') return fromFile;
  let rel;
  if (pathname.startsWith('/')) rel = pathname.replace(/^\/+/, '');
  else rel = path.normalize(path.join(path.dirname(path.relative(root, fromFile)), pathname));
  rel = rel.replace(/\\/g,'/');
  const candidates = [];
  if (!rel || rel.endsWith('/')) candidates.push(path.join(root, rel, 'index.html'));
  else {
    candidates.push(path.join(root, rel));
    if (!path.extname(rel)) {
      candidates.push(path.join(root, rel, 'index.html'));
      candidates.push(path.join(root, rel + '.html'));
    }
  }
  for (const c of candidates) if (await exists(c)) return c;
  return null;
}

const files = await walk(root);
const cache = new Map();
for (const file of files) {
  const html = await readFile(file,'utf8');
  cache.set(file, { html, ids: extractIds(html) });
}
htmlCount = files.length;

for (const file of files) {
  const { html } = cache.get(file);
  for (const rawHref of extractHrefs(html)) {
    linkCount++;
    if (!rawHref || rawHref === '#' || /^(?:mailto:|tel:|javascript:|data:)/i.test(rawHref)) continue;
    let pathname = '';
    let hash = '';
    if (/^https?:\/\//i.test(rawHref)) {
      let u;
      try { u = new URL(rawHref); } catch { continue; }
      if (!canonicalHosts.has(u.hostname.toLowerCase())) continue;
      pathname = u.pathname;
      hash = u.hash;
    } else if (rawHref.startsWith('//')) {
      continue;
    } else {
      const q = rawHref.split('?')[0];
      const idx = q.indexOf('#');
      if (idx >= 0) { pathname = q.slice(0, idx); hash = q.slice(idx); }
      else pathname = q;
    }
    if (!hash && rawHref.includes('#')) hash = '#' + rawHref.split('#').slice(1).join('#').split('?')[0];
    if (!hash) continue;
    fragmentCount++;
    const target = await resolveTarget(file, pathname);
    const sourceRel = path.relative(root, file).replace(/\\/g,'/');
    if (!target) {
      failures.push(`${sourceRel}: ${rawHref} -> target HTML not found`);
      continue;
    }
    let rec = cache.get(target);
    if (!rec) {
      const targetHtml = await readFile(target,'utf8');
      rec = { html: targetHtml, ids: extractIds(targetHtml) };
      cache.set(target, rec);
    }
    const frag = decodeFragment(hash.slice(1));
    if (frag && !rec.ids.has(frag)) {
      failures.push(`${sourceRel}: ${rawHref} -> missing #${frag} in ${path.relative(root,target).replace(/\\/g,'/')}`);
    }
  }
}

if (failures.length) {
  console.error(`BANHALMI anchor integrity audit failed with ${failures.length} issue(s):`);
  for (const f of failures) console.error(f);
  process.exit(1);
}
console.log(`BANHALMI anchor integrity audit passed: ${htmlCount} HTML files, ${linkCount} anchor links, ${fragmentCount} fragment links; every same-site fragment destination exists.`);
