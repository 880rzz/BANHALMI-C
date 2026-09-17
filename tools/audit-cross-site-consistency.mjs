import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const failures = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'test-results' || entry.name === 'playwright-report') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    // link-audit-results.json is a gitignored, machine-generated live-link-check
    // report (see tools/audit-seo-network.mjs). It lists checked URLs verbatim,
    // including ones containing "szosszenetek", but is not editorial content and
    // was never meant to carry the book's ISBN. Scanning it here produced a false
    // positive; it is intentionally excluded from the editorial-consistency scan.
    else if (entry.name === 'link-audit-results.json') continue;
    else if (/\.(?:html|json|jsonld|xml)$/i.test(entry.name)) files.push(full);
  }
}

function rel(file) { return path.relative(root, file).replaceAll(path.sep, '/'); }
function metaValue(html, key, attr = 'property') {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\b[^>]*${attr}=["']${escaped}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i'))?.[1]
    || html.match(new RegExp(`<meta\\b[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${escaped}["'][^>]*>`, 'i'))?.[1]
    || '';
}

await walk(root);
for (const file of files) {
  const route = rel(file);
  const content = await readFile(file, 'utf8');

  if (/Szösszenetek|Snippets|szosszenetek/i.test(content + route)) {
    if (/2310005245015|9786155596766|978-615-5596-76-6/.test(content)) failures.push(`${route}: legacy Szösszenetek identifier remains`);
    if (!/9786150000534/.test(content)) failures.push(`${route}: authoritative Szösszenetek ISBN missing`);
  }

  if (/twenty documented exhibitions and long-term projects|20 documented exhibitions and long-term projects|húsz dokumentált kiállítás|zwanzig dokumentierte Ausstellungen/i.test(content)) {
    failures.push(`${route}: outdated exhibition count wording`);
  }
  if (/twenty[- ]five years|25 years|1999 óta épülő|25 éve|seit 25 Jahren|fünfundzwanzig Jahre/i.test(content)) failures.push(`${route}: ageing year-count copy remains`);

  if (!route.endsWith('.html') || /http-equiv=["']refresh["']/i.test(content)) continue;
  const expectedLocale = route.startsWith('hu/') ? 'hu_HU' : route.startsWith('de-at/') ? 'de_AT' : 'en_US';
  if (metaValue(content, 'og:locale') !== expectedLocale) failures.push(`${route}: invalid og:locale`);
  if (metaValue(content, 'og:site_name') === '') failures.push(`${route}: missing og:site_name`);

  const ogImage = metaValue(content, 'og:image');
  if (ogImage) {
    for (const key of ['og:image:alt', 'og:image:width', 'og:image:height']) {
      if (metaValue(content, key) === '') failures.push(`${route}: missing ${key}`);
    }
    for (const key of ['twitter:image', 'twitter:image:alt']) {
      if (metaValue(content, key, 'name') === '') failures.push(`${route}: missing ${key}`);
    }
  }
  for (const key of ['twitter:title', 'twitter:description']) {
    if (metaValue(content, key, 'name') === '') failures.push(`${route}: missing ${key}`);
  }

  const jsonScripts = [...content.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const [, json] of jsonScripts) {
    try { JSON.parse(json); }
    catch (error) { failures.push(`${route}: invalid JSON-LD (${error.message})`); }
  }
}

for (const route of ['privacy-policy/index.html', 'hu/adatvedelem/index.html', 'de-at/datenschutz/index.html']) {
  const content = await readFile(path.join(root, route), 'utf8');
  if (!content.includes('data-cross-site-privacy="true"')) failures.push(`${route}: missing BANHALMI ART privacy disclosure`);
  if (!content.includes('G-90C452LJKQ')) failures.push(`${route}: missing shared GA4 property disclosure`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Audited ${files.length} COM files for cross-site consistency.`);
if (failures.length) process.exitCode = 1;
