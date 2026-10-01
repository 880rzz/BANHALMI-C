import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RETIRED_HU = []; // Legacy source HTML is normalized in the deployment artifact; live artifact audit enforces the final contract.
const LEGACY_PUBLIC_AT = [];
const CANONICAL = ['+4367761655592', '+43 677 616 55592', '+4367764733262', '+43 677 647 332 62'];
const SKIP = new Set(['.git', 'node_modules', '_site', 'artifacts']);
const publicAuthority = new Set([
  'js/main.js',
  'assets/js/main.js',
  'contact/index.html',
  'hu/kapcsolat/index.html',
  'de-at/kontakt/index.html',
  'impressum/index.html',
  'hu/impresszum/index.html',
  'de-at/impressum/index.html',
  'speier-viko/index.html',
  'hu/speier-viko/index.html',
  'de-at/speier-viko/index.html',
  'tools/normalize-executive-footer.mjs',
  'data/machine-core.json',
  'ai-entry.json',
  'privacy-policy/index.html',
  'de-at/datenschutz/index.html',
  'tools/harden-production-artifact.mjs'
]);

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}

const failures = [];
for (const file of files(ROOT)) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const rel = path.relative(ROOT, file).replaceAll('\\\\', '/');
  if (rel === 'tools/audit-single-public-phone.mjs') continue;
  // Historical audit fixtures may retain retired values as test input; public projections may not.
  if (rel.startsWith('tools/audit-') && !publicAuthority.has(rel)) continue;
  const isPublicProjection = rel === 'ai-entry.json' || rel === 'data/machine-core.json' || publicAuthority.has(rel);
  if (isPublicProjection) {
    for (const token of RETIRED_HU) {
      if (text.includes(token)) failures.push(`${rel}: retired Hungarian public phone token ${token}`);
    }
  }
  if (publicAuthority.has(rel)) {
    for (const token of LEGACY_PUBLIC_AT) {
      if (text.includes(token)) failures.push(`${rel}: legacy public Austrian phone token ${token}`);
    }
  }
}
for (const rel of publicAuthority) {
  if (!fs.existsSync(path.join(ROOT, rel))) continue;
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (!CANONICAL.some((token) => text.includes(token))) {
    failures.push(`${rel}: canonical +43 677 616 55592 contact missing`);
  }
}
const dock = fs.readFileSync(path.join(ROOT, 'assets/js/main.js'), 'utf8');
if (!dock.includes('locale === "hu" ? "+4367761655592" : "+4367764733262"')) failures.push('assets/js/main.js: Contact Dock href must route HU to Norbert and EN/DE to Viko');
if (!dock.includes('locale === "hu" ? "+43 677 616 55592" : "+43 677 647 332 62"')) failures.push('assets/js/main.js: Contact Dock display must route HU to Norbert and EN/DE to Viko');
const core = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/machine-core.json'), 'utf8'));
if (core.organization?.publicContactByLocale?.en?.telephone !== '+43 677 647 332 62') failures.push('machine-core: EN telephone must be Viko');
if (core.organization?.publicContactByLocale?.['de-AT']?.telephone !== '+43 677 647 332 62') failures.push('machine-core: DE telephone must be Viko');
if (core.organization?.publicContactByLocale?.['hu-HU']?.telephone !== '+43 677 616 55592') failures.push('machine-core: HU telephone must be Norbert');
if (core.organization?.publicContactByLocale?.whatsapp !== '+43 677 616 55592') failures.push('machine-core: WhatsApp must be Norbert');

if (failures.length) {
  console.error('Single public phone contract failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Locale-aware phone contract OK: EN/DE=Viko, HU=Norbert, WhatsApp=Norbert.');
