import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const RETIRED_HU = ['+36704698397', '+36 70 469 8397', '+36 70 469 83 97'];
const LEGACY_PUBLIC_AT = ['+4367764733262', '+43 677 647 332 62'];
const CANONICAL = ['+4367761655592', '+43 677 616 55592'];
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
  'tools/audit-executive-footer-contract.mjs'
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
  for (const token of RETIRED_HU) {
    if (text.includes(token)) failures.push(`${rel}: retired Hungarian public phone token ${token}`);
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
if (failures.length) {
  console.error('Single public phone contract failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Single public phone contract OK: +43 677 616 55592 only on BANHALMI public contact surfaces.');
