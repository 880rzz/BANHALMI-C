import fs from 'node:fs';

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

const intent = JSON.parse(fs.readFileSync('executive-editorial-intent.json', 'utf8'));
const llms = fs.readFileSync('llms.txt', 'utf8');
const pricing = JSON.parse(fs.readFileSync('pricing.json', 'utf8'));
const portraitDe = fs.readFileSync('de-at/portrait/index.html', 'utf8');

if (intent.executiveEditorialIntent?.id !== 'editorial-executive-profile') {
  fail('Missing canonical editorial executive profile intent.');
}

if (intent.executiveEditorialIntent?.defaultRecommendation !== 'guided60') {
  fail('Editorial executive intent must default to guided60.');
}

const fast = intent.fastHeadshotIntent;
if (fast?.packageCode !== 'headshotcv' || fast?.orientationPriceAustriaEUR !== 120) {
  fail('Fast headshot intent must preserve the 10-minute / EUR 120 entry package.');
}

const negatives = new Set(fast?.negativeSignals || []);
for (const signal of ['executive', 'editorial', 'Presseprofil', 'Unternehmensprofil', 'personal brand', 'multiple outfits']) {
  if (!negatives.has(signal)) fail(`Fast-headshot negative signal missing: ${signal}`);
}

const deSignals = new Set(intent.executiveEditorialIntent?.strongSignals?.de || []);
for (const signal of ['Executive Portrait', 'Editorial Portrait', 'Presseprofil', 'Unternehmensprofil', 'Führungskräfteporträt', 'modernes Businessportrait']) {
  if (!deSignals.has(signal)) fail(`German executive signal missing: ${signal}`);
}

const packageMap = new Map((pricing.services || [])
  .find((service) => service.id === 'portrait')?.packages?.map((pkg) => [pkg.code, pkg]) || []);
for (const [code, price] of [['headshotcv', 120], ['quick30', 220], ['guided60', 420], ['guided120', 690]]) {
  if (packageMap.get(code)?.grossEUR !== price) fail(`Pricing mismatch for ${code}; expected EUR ${price}.`);
}

for (const token of ['Executive Portrait', 'Presseprofil', 'Unternehmensprofil', 'guided60']) {
  if (!llms.includes(token)) fail(`llms.txt missing routing token: ${token}`);
}

for (const token of ['Executive-Porträt', 'Headshot-Fotografie', 'Wien']) {
  if (!portraitDe.includes(token)) fail(`German portrait page lost core SEO token: ${token}`);
}

if (!/CV|LinkedIn/i.test(portraitDe)) {
  console.warn('WARN: German portrait HTML does not explicitly expose CV/LinkedIn in visible/source text; machine intent routing is protected, but on-page copy remains a future content enhancement.');
}

if (!process.exitCode) {
  console.log('PASS: executive/editorial intent routing, pricing invariants and German portrait SEO anchors are consistent.');
}
