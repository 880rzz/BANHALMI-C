import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NORBERT = ['+4367761655592', '+43 677 616 55592'];
const VIKO_AT = ['+4367764733262', '+43 677 647 332 62'];
const RETIRED = ['+36704698397', '+36 70 469 8397', '+36 70 469 83 97', '+43 677 647 3262', '+436776473262'];
const SKIP = new Set(['.git', 'node_modules', '_site', 'artifacts']);

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : [full];
  });
}
function hasAny(text, tokens) { return tokens.some((token) => text.includes(token)); }
function localeFor(rel) {
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  if (rel.endsWith('.html')) return 'en';
  return null;
}

const failures = [];
for (const file of files(ROOT)) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const rel = path.relative(ROOT, file).replaceAll('\\\\', '/');
  if (rel === 'tools/audit-single-public-phone.mjs') continue;
  if (rel.startsWith('tools/audit-')) continue;

  for (const token of RETIRED) {
    if (text.includes(token)) failures.push(`${rel}: retired public phone token ${token}`);
  }

  const locale = localeFor(rel);
  if (locale === 'hu' && hasAny(text, VIKO_AT)) {
    failures.push(`${rel}: Viko Austrian phone must not appear on HU public pages`);
  }
}

// Contact Dock authority: EN/DE phone action = Viko AT; HU = Norbert AT; WhatsApp = Norbert everywhere.
for (const rel of ['js/main.js','assets/js/main.js']) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const text = fs.readFileSync(full, 'utf8');
  if (!hasAny(text, NORBERT) || !hasAny(text, VIKO_AT)) failures.push(`${rel}: dual locale-aware phone authority missing`);
  if (!text.includes('locale === "hu" ? "+4367761655592" : "+4367764733262"')) failures.push(`${rel}: EN/DE Viko vs HU Norbert phone routing missing`);
}

// Footer source authority must preserve EN/DE Viko, HU Norbert, Budapest Norbert and Norbert WhatsApp.
{
  const rel = 'tools/normalize-executive-footer.mjs';
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (!hasAny(text, NORBERT) || !hasAny(text, VIKO_AT)) failures.push(`${rel}: locale/location phone authority incomplete`);
  if (!text.includes('tel:+4367761655592')) failures.push(`${rel}: Budapest Norbert phone authority missing`);
  if (!text.includes('wa.me/')) failures.push(`${rel}: WhatsApp authority missing`);
}

if (failures.length) {
  console.error('Locale/location phone authority contract failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Phone authority contract OK: BANHALMI-C EN/DE use Viko for Austrian phone contact; HU, Budapest and WhatsApp use Norbert; retired numbers are blocked.');
