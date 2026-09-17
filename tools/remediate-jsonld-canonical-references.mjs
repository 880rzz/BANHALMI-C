import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const canonicalIds = new Set([
  'https://www.norbertbanhalmi.com/about/',
  'https://www.norbertbanhalmi.com/#organization',
  'https://www.norbertbanhalmi.com/#brand',
  'https://www.norbertbanhalmi.com/#website',
  'https://www.banhalmi.art/#website',
  'https://www.norbertbanhalmi.com/#vienna-studio',
  'https://www.norbertbanhalmi.com/#budapest-studio',
  'https://www.norbertbanhalmi.com/#vienna-gersthofer-office',
  'https://www.norbertbanhalmi.com/#visual-trust-partnership',
  'https://www.norbertbanhalmi.com/speier-viko/#person'
]);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site', 'playwright-report', 'test-results', 'artifacts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function normalizeBlock(data) {
  if (!data || !Array.isArray(data['@graph'])) return { data, changes: 0 };
  const graph = data['@graph'];
  const topLevelIds = new Set(graph.map((node) => node && typeof node === 'object' ? node['@id'] : null).filter((id) => canonicalIds.has(id)));
  let changes = 0;

  function visit(value, isTopLevel = false) {
    if (Array.isArray(value)) return value.map((item) => visit(item, false));
    if (!value || typeof value !== 'object') return value;
    const id = value['@id'];
    if (!isTopLevel && id && topLevelIds.has(id)) {
      const keys = Object.keys(value);
      if (keys.length !== 1 || keys[0] !== '@id') changes += 1;
      return { '@id': id };
    }
    const out = {};
    for (const [key, child] of Object.entries(value)) out[key] = visit(child, false);
    return out;
  }

  data['@graph'] = graph.map((node) => visit(node, true));
  return { data, changes };
}

let filesChanged = 0;
let referencesNormalized = 0;
for (const file of walk(root)) {
  let html = fs.readFileSync(file, 'utf8');
  let fileChanges = 0;
  html = html.replace(/<script\b([^>]*\btype=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, raw) => {
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch { return match; }
    const result = normalizeBlock(parsed);
    if (!result.changes) return match;
    fileChanges += result.changes;
    return `<script${attrs}>${JSON.stringify(result.data)}</script>`;
  });
  if (fileChanges) {
    fs.writeFileSync(file, html);
    filesChanged += 1;
    referencesNormalized += fileChanges;
  }
}

console.log(`Canonical JSON-LD reference normalization: ${filesChanged} HTML files changed, ${referencesNormalized} nested duplicate entity definitions reduced to @id references.`);
