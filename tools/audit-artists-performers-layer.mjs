import fs from 'node:fs';

const errors = [];
const fail = (c,m) => { if (!c) errors.push(m); };
const core = JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const intent = JSON.parse(fs.readFileSync('customer-intent-model.json','utf8'));
const needs = JSON.parse(fs.readFileSync('customer-needs.json','utf8'));
const pricing = JSON.parse(fs.readFileSync('pricing.json','utf8'));
const fine = core.serviceModel.services.find(s => s.id === 'fine-art');
fail(fine?.serviceContext === 'fine-art', 'fine-art backend contract drift');
fail(/Artists & Performers/.test(fine?.name || ''), 'Artists & Performers public meaning missing from canonical core');
for (const token of ['Actor headshot photography','Dance photography','Performing artist portfolio photography','Model portfolio photography','Editorial portrait photography']) fail(core.person.specialisms.includes(token), 'canonical specialism missing: ' + token);
for (const id of ['actor-casting-portfolio','dance-performing-artist-portfolio','model-editorial-portfolio']) {
  fail(intent.intents.some(x => x.id === id && x.serviceContext === 'fine-art'), 'intent route missing: ' + id);
  fail(needs.needs.some(x => x.id === id && x.serviceContext === 'fine-art'), 'customer need missing: ' + id);
}
const p = (pricing.services || []).find(x => x.id === 'fine-art');
fail(p?.quoteRouting?.serviceContext === 'fine-art', 'pricing quote route drift');
fail(JSON.stringify((p?.packages || []).map(x => [x.code,x.grossEUR])) === JSON.stringify([['art60',690],['art120',990],['art180',1290]]), 'Fine Art package pricing drift');
const localizedPackageContracts = {
  'fine-art/index.html': ['PLAIN-LANGUAGE-ARTIST-PACKAGES:START','Focused Artist Session — 1 hour','Artist Portfolio — 2 hours','Complete Artist Portfolio — 3 hours','Fine Art &amp; Artistic Nude — personal artistic work'],
  'hu/muveszi-fotografia/index.html': ['PLAIN-LANGUAGE-ARTIST-PACKAGES:START','Fókuszált művészfotózás — 1 óra','Művészportfólió — 2 óra','Teljes művészportfólió — 3 óra','Fine Art &amp; művészi akt — személyes művészeti alkotás'],
  'de-at/fine-art/index.html': ['PLAIN-LANGUAGE-ARTIST-PACKAGES:START','Fokussiertes Künstler:innen-Shooting — 1 Stunde','Künstler:innen-Portfolio — 2 Stunden','Komplettes Künstler:innen-Portfolio — 3 Stunden','Fine Art &amp; Aktkunst — persönliche künstlerische Arbeit']
};
for (const file of ['fine-art/index.html','hu/muveszi-fotografia/index.html','de-at/fine-art/index.html']) {
  const h = fs.readFileSync(file,'utf8');
  fail(h.includes('data-artists-performers-semantic'), file + ': semantic marker missing');
  fail(/actor|színész|Schauspiel/i.test(h), file + ': actor intent missing');
  fail(/dance|tánc|Tanz/i.test(h), file + ': dance intent missing');
  for (const token of localizedPackageContracts[file]) fail(h.includes(token), file + ': plain-language package contract missing: ' + token);
}
const generator = fs.readFileSync('tools/generate-machine-projections.mjs','utf8');
fail(generator.includes('core.serviceModel.services.map'), 'production projection no longer derives service semantics from canonical core');
const hardener = fs.readFileSync('tools/harden-production-artifact.mjs','utf8');
fail(hardener.includes('generateMachineProjections(root)'), 'production hardener no longer regenerates machine projections');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Artists & Performers SEO/GEO/Schema/LLM and plain-language package contract passed: canonical core, intent routing, pricing, localized pages and deployment projection ownership are aligned.');
