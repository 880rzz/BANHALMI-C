import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skip = new Set(['.git', 'node_modules', '_site', 'dist', 'coverage', 'assets', 'api', '.well-known']);
const pageTypes = new Set(['WebPage', 'ProfilePage', 'AboutPage', 'ContactPage', 'FAQPage', 'CollectionPage']);
let changedFiles = 0;
let changedNodes = 0;

function decode(v='') {
  return String(v).replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&nbsp;/gi,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)));
}
function text(v) { return decode(String(v || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function norm(v) { return text(v).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function isRedirect(h) { return /<meta[^>]+http-equiv=["']refresh["']/i.test(h) || (/location\.(?:replace|href)\s*=/i.test(h) && !/<main\b/i.test(h)); }

function patchJsonLd(data, title) {
  let changed = 0;
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const item of node) visit(item); return; }
    const types = [].concat(node['@type'] || []);
    if (types.some((t) => pageTypes.has(t)) && node.name && norm(node.name) !== norm(title)) {
      node.name = title;
      changed += 1;
    }
    if (Array.isArray(node['@graph'])) {
      for (const item of node['@graph']) visit(item);
    }
  }
  visit(data);
  return changed;
}

function patchFile(file) {
  let html = fs.readFileSync(file, 'utf8');
  if (isRedirect(html) || !/<main\b/i.test(html)) return;
  const title = text(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
  if (!title) return;
  let fileChanges = 0;
  html = html.replace(/<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi, (full, attrs, source) => {
    let data;
    try { data = JSON.parse(source); } catch { return full; }
    const count = patchJsonLd(data, title);
    if (!count) return full;
    fileChanges += count;
    return `<script${attrs}>${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  });
  if (fileChanges) {
    fs.writeFileSync(file, html, 'utf8');
    changedFiles += 1;
    changedNodes += fileChanges;
    console.log(`${path.relative(root, file)}: synchronized ${fileChanges} page-level schema name(s)`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) patchFile(full);
  }
}

walk(root);
console.log(`Schema-title synchronization complete: ${changedNodes} node(s) across ${changedFiles} file(s).`);
