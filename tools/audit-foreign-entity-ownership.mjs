import fs from 'node:fs';

const ROOT = process.cwd();
const ENTITY_FILE = 'entity.jsonld';
const OWN_IDS = new Set([
  'https://www.norbertbanhalmi.com/about/',
  'https://www.norbertbanhalmi.com/#organization',
  'https://www.norbertbanhalmi.com/#brand',
  'https://www.norbertbanhalmi.com/#website',
  'https://www.banhalmi.art/#website',
  'https://www.norbertbanhalmi.com/speier-viko/#person',
  'https://www.norbertbanhalmi.com/#visual-trust-partnership'
]);
const SERVICE_TOKENS = [
  'visual strategic partnership',
  'leadership positioning',
  'executive portraiture',
  'employer branding',
  'event communication',
  'visual reputation'
];
const failures = [];
const data = JSON.parse(fs.readFileSync(`${ROOT}/${ENTITY_FILE}`, 'utf8'));

function types(node) {
  const value = node?.['@type'];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function inspect(node, path = '$') {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    node.forEach((item, index) => inspect(item, `${path}[${index}]`));
    return;
  }

  const isOrg = types(node).some((type) => ['Organization', 'EducationalOrganization', 'ArtGallery'].includes(type));
  const id = node['@id'];
  const url = typeof node.url === 'string' ? node.url : '';
  const isBanhalmiOwned = OWN_IDS.has(id) || url.includes('norbertbanhalmi.com') || url.includes('banhalmi.art');

  if (isOrg && !isBanhalmiOwned) {
    const text = JSON.stringify({ description: node.description, slogan: node.slogan, knowsAbout: node.knowsAbout }).toLowerCase();
    for (const token of SERVICE_TOKENS) {
      if (text.includes(token)) failures.push(`${path}: foreign entity ${node.name || id || url || '(unnamed)'} inherits BANHALMI service semantics (${token})`);
    }
  }

  for (const [key, value] of Object.entries(node)) inspect(value, `${path}.${key}`);
}

inspect(data);

const aiEntry = JSON.parse(fs.readFileSync(`${ROOT}/ai-entry.json`, 'utf8'));
const knowledge = JSON.parse(fs.readFileSync(`${ROOT}/knowledge-core.json`, 'utf8'));
const identity = JSON.parse(fs.readFileSync(`${ROOT}/entity-identity-contract.json`, 'utf8'));
const personId = 'https://www.norbertbanhalmi.com/about/';
const orgId = 'https://www.norbertbanhalmi.com/#organization';
const brandId = 'https://www.norbertbanhalmi.com/#brand';

for (const [label, person] of [
  ['ai-entry', aiEntry.identity?.person],
  ['knowledge-core', knowledge.primaryPerson],
  ['identity-contract', identity.canonicalPerson]
]) {
  if (person?.['@id'] !== personId) failures.push(`${label}: canonical Person @id drifted`);
  if ((person?.alternateName || []).includes('BANHALMI')) failures.push(`${label}: Person must not use bare BANHALMI as alternateName`);
}
for (const [label, org] of [
  ['ai-entry', aiEntry.identity?.organization],
  ['knowledge-core', knowledge.primaryOrganization],
  ['identity-contract', identity.canonicalOrganization]
]) {
  if (org?.['@id'] !== orgId) failures.push(`${label}: canonical Organization @id drifted`);
  if (org?.name !== 'Banhalmi Norbert e.U.' || org?.legalName !== 'Banhalmi Norbert e.U.') failures.push(`${label}: legal Organization name must remain Banhalmi Norbert e.U.`);
}
for (const [label, brand] of [
  ['ai-entry', aiEntry.identity?.brand],
  ['knowledge-core', knowledge.primaryBrand],
  ['identity-contract', identity.canonicalBrand]
]) {
  if (brand?.['@id'] !== brandId || brand?.name !== 'BANHALMI') failures.push(`${label}: canonical Brand identity drifted`);
}
for (const [label, history] of [
  ['ai-entry', aiEntry.identity?.history],
  ['knowledge-core', knowledge.history],
  ['identity-contract', identity.history]
]) {
  if (history?.practiceSince !== 1999) failures.push(`${label}: practiceSince must remain 1999`);
  if (history?.legalCompanyStart !== '2023-11-27') failures.push(`${label}: legalCompanyStart must remain 2023-11-27`);
  const text = JSON.stringify(history || {}).toLowerCase();
  if (!text.includes('not') || !text.includes('legal')) failures.push(`${label}: 1999 interpretation must explicitly distinguish practice history from legal company founding`);
}
const budapest = identity.locations?.find((location) => location?.['@id'] === 'https://www.norbertbanhalmi.com/#budapest-studio');
if (budapest?.address?.streetAddress !== 'Lágymányosi u. 15' || budapest?.address?.postalCode !== '1111') failures.push('identity-contract: canonical Budapest studio street/postal address drifted');

if (failures.length) {
  console.error('Foreign entity and identity ownership audit failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Foreign entity and identity ownership audit passed: external organisations remain identity references; Person, legal Organization, Brand, 1999 history and canonical Budapest location stay separated and synchronized.');
