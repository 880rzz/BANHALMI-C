import fs from 'node:fs';

const errors = [];
const read = path => fs.readFileSync(path, 'utf8');

const matrix = JSON.parse(read('data/search-authority-master-matrix.json'));
if (matrix.version !== '2026-10-06-v8-gsc-wizard-owner-routing') errors.push('GSC authority matrix version is stale');
if (matrix.latestWizardSnapshot?.settledThrough !== '2026-10-04') errors.push('GSC Wizard settled-through date must be 2026-10-04');
if (JSON.stringify(matrix.latestWizardSnapshot?.baseline28d) !== JSON.stringify(['2026-09-06','2026-10-03'])) errors.push('GSC Wizard 28d window drifted');

const protectedQueries = new Set((matrix.latestWizardSnapshot?.protectedHomepageQueries || []).map(row => row.query));
for (const query of ['fényképész budapest','fotós budapest','budapest fotós','profi fotós']) {
  if (!protectedQueries.has(query)) errors.push(`Protected homepage winner missing: ${query}`);
}
const gapOwners = new Map((matrix.latestWizardSnapshot?.canonicalOwnerGaps || []).map(row => [row.query, row.expectedOwner]));
for (const [query, owner] of [
  ['portré fotózás budapest','/hu/portre/'],
  ['portréfotózás budapest','/hu/portre/'],
  ['portraitfotografie wien','/de-at/portrait/'],
  ['brand fotograf','/de-at/brand/'],
  ['brand photographer','/lifestyle/'],
  ['event photography','/event-photography/'],
  ['fine art fotografie','/de-at/fine-art/'],
  ['aktfotózás','/hu/muveszi-fotografia/']
]) {
  if (gapOwners.get(query) !== owner) errors.push(`Canonical owner gap mismatch for ${query}`);
}

const homes = [
  {
    path: 'index.html',
    title: 'BANHALMI | Executive Portrait & Brand Photography | Vienna–Budapest',
    anchors: [
      'Portrait photography in Vienna &amp; Budapest ›',
      'Brand photography in Vienna &amp; Budapest ›',
      'Event photography in Vienna &amp; Budapest ›',
      'Fine Art photography in Vienna &amp; Budapest ›'
    ]
  },
  {
    path: 'hu/index.html',
    title: 'BANHALMI | Executive portré és brandfotózás | Bécs–Budapest',
    anchors: [
      'Portréfotózás Budapesten és Bécsben ›',
      'Brandfotózás Budapesten és Bécsben ›',
      'Rendezvényfotózás Budapesten és Bécsben ›',
      'Művészi fotózás Budapesten és Bécsben ›'
    ]
  },
  {
    path: 'de-at/index.html',
    title: 'BANHALMI | Executive-Porträt & Brandfotografie | Wien–Budapest',
    anchors: [
      'Portraitfotografie in Wien &amp; Budapest ›',
      'Brandfotografie in Wien &amp; Budapest ›',
      'Eventfotografie in Wien &amp; Budapest ›',
      'Fine-Art-Fotografie in Wien &amp; Budapest ›'
    ]
  }
];
for (const home of homes) {
  const html = read(home.path);
  if (!html.includes(`<title>${home.title}</title>`)) errors.push(`${home.path}: protected homepage title changed`);
  for (const anchor of home.anchors) if (!html.includes(anchor)) errors.push(`${home.path}: missing contextual service anchor ${anchor}`);
}

const serviceOwners = [
  ['portrait/index.html','https://www.norbertbanhalmi.com/portrait/','Portrait photography in Vienna and Budapest'],
  ['hu/portre/index.html','https://www.norbertbanhalmi.com/hu/portre/','Portréfotózás Budapesten és Bécsben'],
  ['de-at/portrait/index.html','https://www.norbertbanhalmi.com/de-at/portrait/','Portraitfotografie in Wien und Budapest'],
  ['lifestyle/index.html','https://www.norbertbanhalmi.com/lifestyle/','Brand photography in Vienna and Budapest'],
  ['hu/brand/index.html','https://www.norbertbanhalmi.com/hu/brand/','Brandfotózás Budapesten és Bécsben'],
  ['de-at/brand/index.html','https://www.norbertbanhalmi.com/de-at/brand/','Brandfotografie in Wien und Budapest'],
  ['event-photography/index.html','https://www.norbertbanhalmi.com/event-photography/','Event photography in Vienna and Budapest'],
  ['hu/rendezvenyfotozas/index.html','https://www.norbertbanhalmi.com/hu/rendezvenyfotozas/','Rendezvényfotózás Budapesten és Bécsben'],
  ['de-at/eventfotografie/index.html','https://www.norbertbanhalmi.com/de-at/eventfotografie/','Eventfotografie in Wien und Budapest'],
  ['fine-art/index.html','https://www.norbertbanhalmi.com/fine-art/','Fine Art photography in Vienna and Budapest'],
  ['hu/muveszi-fotografia/index.html','https://www.norbertbanhalmi.com/hu/muveszi-fotografia/','Művészi fotózás Budapesten és Bécsben'],
  ['de-at/fine-art/index.html','https://www.norbertbanhalmi.com/de-at/fine-art/','Fine-Art-Fotografie in Wien und Budapest']
];
for (const [path, canonical, phrase] of serviceOwners) {
  const html = read(path);
  if (!html.includes(`href="${canonical}" rel="canonical"`)) errors.push(`${path}: canonical owner changed`);
  if (!html.includes(`class="service-search-context"`)) errors.push(`${path}: service-search-context missing`);
  if (!html.includes(phrase)) errors.push(`${path}: localized service-language owner signal missing`);
}

const intents = JSON.parse(read('customer-intent-model.json'));
if (intents.schemaVersion !== '2026-10-06-v5-search-owner-routing') errors.push('Customer intent model search-owner version is stale');
const machineOwners = new Map((intents.searchOwnerAliases?.owners || []).map(row => [row.service, row.routes]));
for (const [service, routes] of [
  ['portrait',{en:'/portrait/',hu:'/hu/portre/',de:'/de-at/portrait/'}],
  ['brand',{en:'/lifestyle/',hu:'/hu/brand/',de:'/de-at/brand/'}],
  ['event',{en:'/event-photography/',hu:'/hu/rendezvenyfotozas/',de:'/de-at/eventfotografie/'}],
  ['fine-art',{en:'/fine-art/',hu:'/hu/muveszi-fotografia/',de:'/de-at/fine-art/'}]
]) {
  if (JSON.stringify(machineOwners.get(service)) !== JSON.stringify(routes)) errors.push(`Machine route mismatch for ${service}`);
}
const fineArt = (intents.searchOwnerAliases?.owners || []).find(row => row.service === 'fine-art');
if (!/not synonymous with nudity/i.test(fineArt?.guardrail || '')) errors.push('Fine Art/nudity guardrail missing');

for (const term of ['produktfotos wien','fotós tanfolyam','fényképész tanfolyam']) {
  if (!(matrix.latestWizardSnapshot?.remediation?.excludedFromTargeting || []).includes(term)) errors.push(`Non-service query exclusion missing: ${term}`);
}

if (errors.length) {
  console.error('GSC owner-routing audit FAILED:\n' + errors.map(x => ' - ' + x).join('\n'));
  process.exit(1);
}
console.log('GSC owner-routing audit passed: protected homepage winners are locked; 12 localized canonical service owners, current Wizard evidence and machine routing are aligned.');
