import fs from 'node:fs';

const aliases = new Map([
  ['https://www.banhalmi.at/', 'https://www.norbertbanhalmi.com/de-at/'],
  ['https://banhalmi.at/', 'https://www.norbertbanhalmi.com/de-at/'],
  ['https://www.banhalminorbert.hu/', 'https://www.norbertbanhalmi.com/hu/'],
  ['https://banhalminorbert.hu/', 'https://www.norbertbanhalmi.com/hu/']
]);

const schema = JSON.parse(fs.readFileSync('domain-aliases.jsonld', 'utf8'));
const ecosystem = JSON.parse(fs.readFileSync('ecosystem.json', 'utf8'));
const geo = fs.readFileSync('domain-aliases.txt', 'utf8');
const liveAudit = fs.readFileSync('tools/audit-domain-aliases.mjs', 'utf8');

const failures = [];
const items = schema.dataFeedElement?.map((entry) => entry.item) ?? [];
const schemaMap = new Map(items.map((item) => [item.url, item.sameAs]));
const ecosystemVariants = new Map();

for (const entry of ecosystem.languageEntryDomains ?? []) {
  for (const variant of entry.hostVariants ?? []) {
    ecosystemVariants.set(variant, entry.canonicalTarget);
  }
}

for (const [alias, target] of aliases) {
  if (schemaMap.get(alias) !== target) failures.push(`Schema mapping mismatch: ${alias}`);
  if (ecosystemVariants.get(alias) !== target) failures.push(`Ecosystem mapping mismatch: ${alias}`);
  if (!geo.includes(alias) || !geo.includes(target)) failures.push(`GEO mapping missing: ${alias}`);
  if (!liveAudit.includes(alias)) failures.push(`Live redirect audit missing: ${alias}`);
}

const forbiddenCanonicalTargets = [...aliases.keys()];
for (const entry of ecosystem.languageEntryDomains ?? []) {
  if (forbiddenCanonicalTargets.includes(entry.canonicalTarget)) {
    failures.push(`Alias used as canonical target: ${entry.canonicalTarget}`);
  }
}

if (schema['@type'] !== 'DataFeed') failures.push('domain-aliases.jsonld must be a DataFeed');
if (items.length !== 4) failures.push(`Expected 4 alias records, found ${items.length}`);

for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length) process.exitCode = 1;
else console.log('Domain alias SEO/GEO/schema entity audit passed.');
