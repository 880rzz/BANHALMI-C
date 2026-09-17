import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
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
const failures = [];
let blocks = 0;
let files = 0;

function walk(dir = '.') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site', 'playwright-report', 'test-results', 'artifacts'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(rel.replaceAll('\\', '/').replace(/^\.\//, ''));
  }
  return out;
}

function inspectNested(value, topLevelIds, file, blockIndex, pathLabel = '$', isTopLevel = false) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectNested(item, topLevelIds, file, blockIndex, `${pathLabel}[${index}]`, false));
    return;
  }
  if (!value || typeof value !== 'object') return;
  const id = value['@id'];
  if (!isTopLevel && id && topLevelIds.has(id) && Object.keys(value).some((key) => key !== '@id')) {
    failures.push(`${file} JSON-LD#${blockIndex} ${pathLabel}: canonical ${id} is redefined inside another node; use an @id-only reference`);
  }
  for (const [key, child] of Object.entries(value)) inspectNested(child, topLevelIds, file, blockIndex, `${pathLabel}.${key}`, false);
}

for (const file of walk()) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const matches = [...html.matchAll(/<script\b[^>]*\btype=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!matches.length) continue;
  files += 1;
  matches.forEach((match, index) => {
    let data;
    try { data = JSON.parse(match[1]); }
    catch (error) {
      failures.push(`${file} JSON-LD#${index + 1}: invalid JSON (${error.message})`);
      return;
    }
    blocks += 1;
    if (!Array.isArray(data?.['@graph'])) return;
    const topLevelIds = new Set(data['@graph'].map((node) => node?.['@id']).filter((id) => canonicalIds.has(id)));
    data['@graph'].forEach((node, nodeIndex) => inspectNested(node, topLevelIds, file, index + 1, `@graph[${nodeIndex}]`, true));
  });
}

if (failures.length) {
  console.error(`Canonical JSON-LD reference audit failed with ${failures.length} conflict(s):`);
  failures.slice(0, 160).forEach((failure) => console.error(`- ${failure}`));
  if (failures.length > 160) console.error(`- ... ${failures.length - 160} additional conflicts omitted`);
  process.exit(1);
}
console.log(`Canonical JSON-LD reference audit passed: ${files} HTML files / ${blocks} JSON-LD blocks contain no nested redefinitions of top-level canonical entities.`);
