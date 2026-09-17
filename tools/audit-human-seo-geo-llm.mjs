import fs from 'node:fs';
import path from 'node:path';

// Permanent read-only gate for human voice, biography chronology and the three-site entity ecosystem.
const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const plan = read('docs/HUMAN_SEO_GEO_LLM_AUDIT_PLAN.md');
for (const heading of ['Voice system', 'SEO audit', 'Schema audit', 'GEO audit', 'LLM audit', 'Required biography correction']) {
  if (!plan.includes(heading)) errors.push(`audit plan: missing ${heading}`);
}

const pages = {
  'about/index.html': {
    canonical: 'https://www.norbertbanhalmi.com/about/',
    origin: ['MOL Y2K project', 'IT specialist', '1.3-megapixel', 'Military documentation followed later'],
    retired: ['The first camera came into my hands during military service']
  },
  'hu/eletmu/index.html': {
    canonical: 'https://www.norbertbanhalmi.com/hu/eletmu/',
    origin: ['MOL Y2K projekt', 'informatikusként', '1,3 megapixeles', 'katonai dokumentáció később'],
    retired: ['Az első fényképezőgép a katonai szolgálat alatt került a kezembe']
  },
  'de-at/werk/index.html': {
    canonical: 'https://www.norbertbanhalmi.com/de-at/werk/',
    origin: ['MOL-Y2K-Projekt', 'IT-Spezialist', '1,3 Megapixeln', 'militärische Dokumentation folgte später'],
    retired: ['Die erste Kamera kam während des Militärdienstes in meine Hände']
  }
};

for (const [relative, contract] of Object.entries(pages)) {
  const html = read(relative);
  if (!html.includes(`rel="canonical"`) || !html.includes(contract.canonical)) errors.push(`${relative}: canonical mismatch`);
  for (const token of contract.origin) if (!html.includes(token)) errors.push(`${relative}: origin chronology missing ${token}`);
  for (const token of contract.retired) if (html.includes(token)) errors.push(`${relative}: retired military-origin claim remains`);
  if (!html.includes('https://www.norbertbanhalmi.com/about/')) errors.push(`${relative}: canonical Person missing`);
  for (const lang of ['hreflang="en"', 'hreflang="de-AT"', 'hreflang="hu-HU"', 'hreflang="x-default"']) {
    if (!html.includes(lang)) errors.push(`${relative}: hreflang cluster missing ${lang}`);
  }
}

const oeuvre = JSON.parse(read('oeuvre.json'));
const firstTimeline = Array.isArray(oeuvre.timeline?.[0]) ? oeuvre.timeline[0].join(' ') : '';
for (const token of ['1999', 'MOL Y2K', 'IT specialist', '1.3-megapixel']) {
  if (!firstTimeline.includes(token)) errors.push(`oeuvre.json: first timeline record missing ${token}`);
}
if (oeuvre.person?.canonicalId !== 'https://www.norbertbanhalmi.com/about/') errors.push('oeuvre.json: canonical Person ID missing');

// The concise llms.txt entry index carries identity/ecosystem routing; detailed origin evidence stays in ai.txt.
const llms = read('llms.txt');
for (const token of [
  'https://www.norbertbanhalmi.com/about/',
  'https://www.norbertbanhalmi.com/',
  'https://www.banhalmi.art/',
  'https://blog.banhalmi.art/'
]) {
  if (!llms.includes(token)) errors.push(`llms.txt: ecosystem token missing ${token}`);
}
if (!llms.includes('[AI reference](https://www.norbertbanhalmi.com/ai.txt)')) errors.push('llms.txt: detailed AI reference link missing');
if (/first camera.*military service|military service.*first camera/i.test(llms)) errors.push('llms.txt: retired military-origin claim remains');

const ai = read('ai.txt');
for (const token of [
  'https://www.norbertbanhalmi.com/about/',
  'https://www.norbertbanhalmi.com/',
  'https://www.banhalmi.art/',
  'https://blog.banhalmi.art/',
  'MOL Y2K',
  '1.3-megapixel'
]) {
  if (!ai.includes(token)) errors.push(`ai.txt: ecosystem/origin token missing ${token}`);
}
if (/first camera.*military service|military service.*first camera/i.test(ai)) errors.push('ai.txt: retired military-origin claim remains');

const canonicalPerson = 'https://www.norbertbanhalmi.com/about/';
for (const relative of ['entity.jsonld', 'entity-graph.json', 'knowledge.json', 'ecosystem.json']) {
  if (!read(relative).includes(canonicalPerson)) errors.push(`${relative}: canonical Person missing`);
}

const highRisk = /\b(timeless|seamless|elevate|unique journey|autentikus élmény|egyedülálló utazás|zeitlose Reise|nahtlos)\b/gi;
for (const relative of ['index.html', 'hu/index.html', 'de-at/index.html', ...Object.keys(pages)]) {
  const html = read(relative).replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
  const matches = html.match(highRisk) || [];
  if (matches.length > 2) errors.push(`${relative}: generic marketing language risk (${matches.length} flagged phrases)`);
}

if (errors.length) {
  console.error('HUMAN / SEO / GEO / SCHEMA / LLM AUDIT FAILED');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

console.log('Human / SEO / GEO / schema / LLM audit passed: three-language biography, canonical entities and the professional–archive–blog ecosystem are aligned; llms remains concise while detailed evidence stays in ai.txt.');
