import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NORBERT = { compact: '+4367761655592', display: '+43 677 616 55592' };
const VIKO = { compact: '+4367764733262', display: '+43 677 647 332 62' };
const RETIRED_HU = ['+36704698397', '+36 70 469 8397', '+36 70 469 83 97'];
const SKIP = new Set(['.git', 'node_modules', '_site', 'artifacts']);

const localePages = {
  en: ['index.html','contact/index.html','impressum/index.html','portrait/index.html','lifestyle/index.html','event-photography/index.html','fine-art/index.html','requestaquote/index.html'],
  de: ['de-at/index.html','de-at/kontakt/index.html','de-at/impressum/index.html','de-at/portrait/index.html','de-at/brand/index.html','de-at/eventfotografie/index.html','de-at/fine-art/index.html','de-at/anfrage/index.html'],
  hu: ['hu/index.html','hu/kapcsolat/index.html','hu/impresszum/index.html','hu/portre/index.html','hu/brand/index.html','hu/rendezvenyfotozas/index.html','hu/muveszi-fotografia/index.html','hu/ajanlatkeres/index.html']
};

function read(rel) {
  const file = path.join(ROOT, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}
const failures = [];

for (const [locale, pages] of Object.entries(localePages)) {
  const expected = locale === 'hu' ? NORBERT : VIKO;
  const forbidden = locale === 'hu' ? VIKO : NORBERT;
  for (const rel of pages) {
    const text = read(rel);
    if (!text) continue;
    if (!text.includes(expected.compact) && !text.includes(expected.display)) failures.push(`${rel}: expected locale phone missing ${expected.display}`);
    if (text.includes(forbidden.display) && /class="footer-phone"/.test(text)) failures.push(`${rel}: wrong locale footer phone ${forbidden.display}`);
    if (!text.includes('wa.me/4367761655592')) failures.push(`${rel}: canonical Norbert WhatsApp missing`);
    for (const token of RETIRED_HU) if (text.includes(token)) failures.push(`${rel}: retired Hungarian public phone token ${token}`);
  }
}

for (const rel of ['assets/js/main.js','js/main.js']) {
  const text = read(rel);
  for (const token of [NORBERT.compact,NORBERT.display,VIKO.compact,VIKO.display]) if (!text.includes(token)) failures.push(`${rel}: shared Contact Dock authority missing ${token}`);
  if (!text.includes('locale === "hu" ? "+4367761655592" : "+4367764733262"')) failures.push(`${rel}: Contact Dock locale routing missing`);
  for (const token of RETIRED_HU) if (text.includes(token)) failures.push(`${rel}: retired Hungarian public phone token ${token}`);
}

const generator = read('tools/normalize-executive-footer.mjs');
for (const token of [NORBERT.compact,NORBERT.display,VIKO.compact,VIKO.display]) if (!generator.includes(token)) failures.push(`tools/normalize-executive-footer.mjs: canonical phone contract missing ${token}`);

const core = JSON.parse(read('data/machine-core.json'));
const auth = core.organization?.contactAuthority;
if (auth?.whatsapp !== NORBERT.compact) failures.push('machine-core: WhatsApp must be Norbert');
if (auth?.telephoneByLanguage?.en !== VIKO.compact || auth?.telephoneByLanguage?.['de-AT'] !== VIKO.compact || auth?.telephoneByLanguage?.['hu-HU'] !== NORBERT.compact) failures.push('machine-core: locale telephone mapping drift');

if (failures.length) {
  console.error('Locale phone authority contract failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Locale phone authority contract OK: BANHALMI-C EN/DE phone=Viko, HU phone=Norbert, WhatsApp=Norbert; retired HU number absent from protected public surfaces.');
