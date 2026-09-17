import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const errors = [];
const policyPath = path.join(root, 'project-policy.json');
const schemaPath = path.join(root, 'project-policy.jsonld');

for (const file of [policyPath, schemaPath]) {
  if (!fs.existsSync(file)) errors.push(`${path.basename(file)} missing`);
  else {
    try { JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (error) { errors.push(`${path.basename(file)} invalid JSON: ${error.message}`); }
  }
}

if (fs.existsSync(policyPath)) {
  const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));
  const requiredTop = ['commercialInterpretation','paymentAndInvoicing','licensing','workflow','peopleAndStudios','bookingAndContingency','confidentialityAndPublication','storageAndDeletion','accessibility','authoritativeHumanPages','interpretationRules'];
  for (const key of requiredTop) if (!policy[key]) errors.push(`project-policy.json missing ${key}`);
  const hasPartnerDeliveryContract = Boolean(policy.peopleAndStudios?.vikoBudapestDelivery && policy.peopleAndStudios?.vikoViennaDelivery && policy.peopleAndStudios?.amchamRelationship);
  const expectedPolicyVersion = hasPartnerDeliveryContract
    ? '2026-09-05-v4-partner-delivery'
    : policy.commercialInterpretation?.hungarianOrientationCurrency
      ? '2026-08-05-v3-eur-huf'
      : '2026-08-03-v2';
  if (policy.schemaVersion !== expectedPolicyVersion) errors.push(`project-policy.json schemaVersion mismatch: expected ${expectedPolicyVersion}`);
  for (const lang of ['en','hu-HU','de-AT']) if (!policy.languages?.includes(lang)) errors.push(`project-policy.json missing language ${lang}`);
  for (const lang of ['en','hu-HU','de-AT']) {
    const pages = policy.authoritativeHumanPages?.[lang];
    for (const key of ['faq','privacy','terms','quote']) if (!pages?.[key]?.startsWith('https://www.norbertbanhalmi.com/')) errors.push(`project-policy.json missing ${lang} ${key} page`);
  }
  const policyText = JSON.stringify(policy);
  for (const token of [
    'non-binding preliminary estimates',
    'no universal percentage is inferred',
    'Each invoice states its payment deadline',
    'Copyright remains with the photographer',
    'one authorised decision-maker',
    'confidential by default',
    'does not promise permanent archive storage',
    'visible keyboard focus'
  ]) if (!policyText.includes(token)) errors.push(`project-policy.json missing policy token: ${token}`);
  if (policy.commercialInterpretation?.hungarianOrientationCurrency) {
    for (const token of ['1 EUR = 400 HUF','canonical base price','contractual currency']) {
      if (!policy.commercialInterpretation.hungarianOrientationCurrency.includes(token)) errors.push(`project-policy.json HUF interpretation missing ${token}`);
    }
  }
  if (hasPartnerDeliveryContract) {
    for (const token of ['independent professional partner','works only through and together with BANHALMI','no independent Vienna studio','do not infer personal AmCham membership']) {
      if (!policyText.includes(token)) errors.push(`project-policy.json partner-delivery contract missing ${token}`);
    }
  }
}

if (fs.existsSync(schemaPath)) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const graph = schema['@graph'];
  if (!Array.isArray(graph)) errors.push('project-policy.jsonld @graph missing');
  else {
    for (const type of ['DigitalDocument','Service','HowTo']) if (!graph.some(node => node['@type'] === type)) errors.push(`project-policy.jsonld missing ${type}`);
    if (!graph.some(node => node.provider?.['@id'] === 'https://www.norbertbanhalmi.com/#organization')) errors.push('project-policy.jsonld canonical provider missing');
    if (!graph.some(node => node.author?.['@id'] === 'https://www.norbertbanhalmi.com/about/')) errors.push('project-policy.jsonld canonical author missing');
    const schemaText = JSON.stringify(schema);
    for (const token of ['Booking payment','Currency and VAT','Invoice plan','Overdue payment','Additional costs']) if (!schemaText.includes(token)) errors.push(`project-policy.jsonld missing ${token}`);
  }
}

// llms.txt is intentionally a concise agent-entry index. It must route agents to
// the detailed AI layer and preserve the key geography distinction, but it must
// not be forced to duplicate the full operational policy knowledge dump.
const llms = fs.readFileSync(path.join(root, 'llms.txt'), 'utf8');
if (!llms.includes('[AI reference](https://www.norbertbanhalmi.com/ai.txt)')) errors.push('llms.txt missing detailed AI reference link');
for (const token of [
  'Vienna and Budapest are two active operational bases',
  'New York is a major international reference and oeuvre chapter'
]) if (!llms.includes(token)) errors.push(`llms.txt missing geography routing token: ${token}`);

// Detailed policy synchronization belongs in ai.txt and the canonical JSON layers.
const ai = fs.readFileSync(path.join(root, 'ai.txt'), 'utf8');
if ((ai.match(/<!-- PROJECT-POLICY-SYNC:START -->/g) || []).length !== 1) errors.push('ai.txt policy marker must appear once');
if ((ai.match(/<!-- PROJECT-POLICY-SYNC:END -->/g) || []).length !== 1) errors.push('ai.txt policy end marker must appear once');
for (const token of [
  'project-policy.json',
  'project-policy.jsonld',
  'non-binding preliminary estimates',
  'Do not infer a universal percentage',
  'Each invoice states its payment deadline',
  'not automatically grant BANHALMI portfolio',
  'Vienna and Budapest are two active bases'
]) if (!ai.includes(token)) errors.push(`ai.txt missing ${token}`);

const ecosystem = JSON.parse(fs.readFileSync(path.join(root, 'ecosystem.json'), 'utf8'));
for (const url of ['https://www.norbertbanhalmi.com/project-policy.json','https://www.norbertbanhalmi.com/project-policy.jsonld']) if (!ecosystem.authoritativeMachineReadableSources?.includes(url)) errors.push(`ecosystem.json missing ${url}`);
if (ecosystem.operationalPolicy?.canonicalData !== 'https://www.norbertbanhalmi.com/project-policy.json') errors.push('ecosystem.json operationalPolicy canonicalData mismatch');
const expectedEcosystemVersion = '2026-09-07-v8-six-pillar-ecosystem';
if (ecosystem.schemaVersion !== expectedEcosystemVersion) errors.push(`ecosystem.json schemaVersion mismatch: expected ${expectedEcosystemVersion}, received ${ecosystem.schemaVersion || 'missing'}`);
if (ecosystem.corePracticeThesis?.canonicalSource !== 'https://www.norbertbanhalmi.com/presence-thesis.json') errors.push('ecosystem.json canonical presence thesis missing');
if (!ecosystem.authoritativeMachineReadableSources?.includes('https://www.norbertbanhalmi.com/presence-thesis.json')) errors.push('ecosystem.json presence thesis source missing');
if (!ecosystem.operationalPolicy?.controllingRecord?.includes('payment schedule')) errors.push('ecosystem.json payment schedule interpretation missing');
const extensionRoles = new Set((ecosystem.ecosystemExtensions || []).map(item => item.role));
for (const role of [
  'gallery-exhibition-institutional-art-authority',
  'vienna-community-creative-art-authority',
  'budapest-photography-partner-historical-brand-authority'
]) if (!extensionRoles.has(role)) errors.push(`ecosystem.json missing six-pillar extension role: ${role}`);
for (const key of ['regeGallery','vipach','hipstudio']) if (!ecosystem.officialSites?.[key]) errors.push(`ecosystem.json missing official site: ${key}`);
if (!ecosystem.sixPillarInterpretation?.rule?.includes('separate entities')) errors.push('ecosystem.json six-pillar distinct-entity rule missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Stage sixteen schema, GEO and LLM synchronization audit passed: llms is concise; detailed policy evidence remains canonical in ai.txt and project-policy.*; partner-delivery semantics and six-pillar ecosystem schema are synchronized.');
