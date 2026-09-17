import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const failures = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['.git','node_modules','test-results','playwright-report'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(?:html|json|jsonld|md|txt)$/i.test(entry.name)) files.push(full);
  }
}
await walk(root);

const banned = [
  /for\s+more\s+than\s+since\s+1999/iu,
  /more\s+than\s+since\s+1999/iu,
  /more\s+than\s+twenty[\s\u2010-\u2015-]*five\s+years/iu,
  /twenty[\s\u2010-\u2015-]*five\s+years/iu,
  /több\s+mint\s+1999\s+óta/iu,
  /több\s+mint\s+huszonöt\s+év/iu,
  /huszonöt\s+év/iu,
  /seit\s+seit\s+1999/iu,
  /seit\s+einer\s+seit\s+1999\s+aufgebauten\s+Praxis/iu,
  /einer\s+seit\s+1999\s+aufgebauten\s+Praxis/iu,
  /mehr\s+als\s+fünfundzwanzig\s+Jahren/iu,
  /fünfundzwanzig\s+Jahren/iu,
  /Bánhalmi Norbert e\.U\./u,
  /banhalmi_consent_v2/u,
  /Technikai megfelelőségi tervezet/iu,
];
for (const file of files) {
  const rel = path.relative(root, file).replaceAll(path.sep, '/');
  const content = await readFile(file, 'utf8');
  for (const pattern of banned) if (pattern.test(content)) failures.push(`${rel}: stale or inconsistent copy ${pattern}`);
}

for (const route of ['requestaquote/index.html','hu/ajanlatkeres/index.html','de-at/anfrage/index.html']) {
  const html = await readFile(path.join(root, route), 'utf8');
  if (!/<input[^>]*name=["']name["'][^>]*required/i.test(html) && !/<input[^>]*required[^>]*name=["']name["']/i.test(html)) failures.push(`${route}: name field is not required`);
  if (!/<label[^>]*for=["']name["'][^>]*>[\s\S]*\*[\s\S]*<\/label>/i.test(html)) failures.push(`${route}: required marker missing from name label`);
  const successBlocks = [...html.matchAll(/<(?:p|div)([^>]*)>(?:[^<]*(?:Thank you\. Your enquiry has been sent|Köszönjük[^<]*elküldtük|Vielen Dank[^<]*gesendet)[^<]*)<\/(?:p|div)>/gi)];
  for (const match of successBlocks) if (!/\bhidden\b/i.test(match[1])) failures.push(`${route}: success message visible before submission`);
}

for (const route of ['privacy-policy/index.html','hu/adatvedelem/index.html','de-at/datenschutz/index.html']) {
  const html = await readFile(path.join(root, route), 'utf8');
  if (!html.includes('G-90C452LJKQ')) failures.push(`${route}: GA4 property not disclosed`);
  if (!/banhalmi\.art/i.test(html)) failures.push(`${route}: ART domain not disclosed`);
  if (!/2026/.test(html)) failures.push(`${route}: review date missing`);
}

for (const file of ['assets/js/main.js','assets/js/analytics.js']) {
  const content = await readFile(path.join(root, file), 'utf8');
  if (!content.includes('banhalmi_consent_v3')) failures.push(`${file}: consent key v3 missing`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Strict COM audit checked ${files.length} content files.`);
if (failures.length) process.exitCode = 1;
