import fs from 'node:fs';

const errors = [];
const checks = [
  {
    path: 'portrait/index.html',
    title: [/Executive Portrait/i, /Headshot/i, /Vienna/i, /Budapest/i],
    body: [/leaders|executives|leadership/i, /LinkedIn|press|web/i]
  },
  {
    path: 'hu/portre/index.html',
    title: [/portré|portrait/i, /Bécs|Vienna/i, /Budapest/i],
    body: [/vezető|executive/i, /LinkedIn|sajtó|web/i]
  },
  {
    path: 'de-at/portrait/index.html',
    title: [/Porträt|Portrait|Headshot/i, /Wien|Vienna/i, /Budapest/i],
    body: [/Führung|Executive|Unternehmer/i, /LinkedIn|Presse|Web/i]
  },
  {
    path: 'lifestyle/index.html',
    title: [/Brand Photography/i, /Visual Positioning/i, /Vienna/i, /Budapest/i],
    body: [/personal brand|executive|entrepreneur|artist/i, /website|LinkedIn|social|press/i]
  },
  {
    path: 'hu/brand/index.html',
    title: [/brand/i, /Bécs|Vienna/i, /Budapest/i],
    body: [/személyes márka|vizuális pozicionálás|vezető|vállalkoz/i, /web|LinkedIn|social|sajtó/i]
  },
  {
    path: 'de-at/brand/index.html',
    title: [/Brand/i, /Wien|Vienna/i, /Budapest/i],
    body: [/Personal Brand|Positionierung|Führung|Unternehmer/i, /Website|LinkedIn|Social|Presse/i]
  },
  {
    path: 'event-photography/index.html',
    title: [/C-Level Event Photography/i, /Vienna/i, /Budapest/i],
    body: [/photographer team|team/i, /press|communication|archive/i]
  },
  {
    path: 'hu/rendezvenyfotozas/index.html',
    title: [/rendezvény|event/i, /Bécs|Vienna/i, /Budapest/i],
    body: [/fotós csapat|csapat|C-Level|vezető/i, /sajtó|kommunikáció|archív/i]
  },
  {
    path: 'de-at/eventfotografie/index.html',
    title: [/Event|Veranstaltung/i, /Wien|Vienna/i, /Budapest/i],
    body: [/Fotografenteam|Team|C-Level|Führung/i, /Presse|Kommunikation|Archiv/i]
  }
];

function extractTitle(html) {
  return html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/&amp;/g, '&') || '';
}
function extractDescription(html) {
  return html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1]
    || html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i)?.[1]
    || '';
}

const titles = new Map();
for (const check of checks) {
  const html = fs.readFileSync(check.path, 'utf8');
  const title = extractTitle(html);
  const description = extractDescription(html);
  titles.set(check.path, title);
  for (const rx of check.title) if (!rx.test(title)) errors.push(`${check.path}: title intent/locality missing ${rx}`);
  const semanticSurface = title + '\n' + description + '\n' + html;
  for (const rx of check.body) if (!rx.test(semanticSurface)) errors.push(`${check.path}: service audience/use-case signal missing ${rx}`);
  if (!/https:\/\/www\.norbertbanhalmi\.com\/about\//.test(html)) errors.push(`${check.path}: canonical Person missing`);
  if (!/Q56391118/.test(html)) errors.push(`${check.path}: Wikidata Person evidence missing`);
}

const enTitles = ['portrait/index.html','lifestyle/index.html','event-photography/index.html'].map(p => titles.get(p));
if (new Set(enTitles).size !== enTitles.length) errors.push('EN primary service titles collapsed into overlapping intent');

const requiredMachineFiles = [
  'customer-intent-model.json',
  'customer-needs.json',
  'executive-editorial-intent.json',
  'personal-branding-intent.json',
  'authority-evidence.json',
  'market-geography.json'
];
for (const file of requiredMachineFiles) if (!fs.existsSync(file)) errors.push(`${file}: required intent/evidence model missing`);

if (errors.length) {
  for (const error of errors) console.error('FAIL ' + error);
  process.exit(1);
}
console.log('BANHALMI service-search contract passed: Portrait, Brand and C-Level Event remain distinct, localised, audience-led and evidence-linked.');
