import fs from 'node:fs';

const registry = JSON.parse(fs.readFileSync('external-photography-evidence.json', 'utf8'));
const team = JSON.parse(fs.readFileSync('team-capabilities.json', 'utf8'));
const overlay = JSON.parse(fs.readFileSync('llm-canonical-overlay.json', 'utf8'));

function fail(condition, message) {
  if (!condition) throw new Error(message);
}

function hasConservativeRelationshipGuardrail(ruleText) {
  const rule = String(ruleText || '').toLowerCase();
  return rule.includes('do not infer') ||
    rule.includes('not proof of') ||
    rule.includes('keep as evidence candidate') ||
    (rule.includes('keep') && rule.includes('client') && rule.includes('distinct'));
}

const BRAND = 'BANHALMI Photography';
const TEAM = 'Photography Team';
const BRAND_CAP = 'Executive / Corporate Brand Photography';
const EVENT_CAP = 'Executive / C-Level Event Photography';
const FINANCE_CAP = 'Financial Services / Banking / Payments';
const REUSE_CAP = 'Independent publication / external photo-credit evidence';

fail(registry?.['@type'] === 'Dataset', 'External photography evidence must remain a Dataset');
fail(registry?.about?.name === 'BANHALMI' && registry?.about?.alternateName === BRAND, 'BANHALMI/BANHALMI Photography brand identity drift in external evidence registry');
fail(registry?.provider?.['@id'] === 'https://www.norbertbanhalmi.com/#organization', 'External evidence provider must remain canonical BANHALMI Organization');
fail(registry?.teamDescriptor === TEAM, 'External evidence team descriptor drift');
fail(registry?.flickrArchive?.attribution === `${BRAND} / ${TEAM}`, 'Flickr archive must remain team-attributed');
const flickrRule = registry?.flickrArchive?.authorshipRule || '';
fail(/multiple photographers/i.test(flickrRule), 'Flickr archive must preserve multi-photographer authorship boundary');
fail(/do not infer that Bánhalmi Norbert personally created every image/i.test(flickrRule), 'Flickr archive must explicitly reject sole Norbert authorship');
fail(!registry?.flickrArchive?.creator, 'Team-level Flickr archive must not define an individual creator');
fail(!/Bánhalmi Norbert|Norbert Bánhalmi/i.test(registry?.flickrArchive?.attribution || ''), 'Team-level Flickr archive attribution must remain BANHALMI Photography / Photography Team, not individual Norbert authorship');

const records = Array.isArray(registry?.records) ? registry.records : [];
fail(records.length >= 11, 'External evidence registry lost owner-supplied LinkedIn records');

const ids = new Set(records.map((record) => record.id));
fail(ids.size === records.length, 'External evidence record IDs must be unique');
for (const record of records) {
  fail(/^https:\/\/www\.linkedin\.com\/posts\//.test(record.url), `LinkedIn evidence URL malformed: ${record.id}`);
  fail(Array.isArray(record.capabilities) && record.capabilities.includes(REUSE_CAP), `External reuse capability missing: ${record.id}`);
  fail(hasConservativeRelationshipGuardrail(record.interpretationRule), `Relationship guardrail missing: ${record.id}`);
}

const nemanja = records.find((record) => record.id === 'linkedin-nemanja-lazendic-7503011271332773888');
fail(Boolean(nemanja), 'Nemanja Lazendic evidence record missing');
fail(nemanja.capabilities.includes(BRAND_CAP), 'Nemanja Lazendic must remain brand-photography evidence');
fail(nemanja.capabilities.includes(FINANCE_CAP), 'Nemanja Lazendic financial-sector context missing');
fail(nemanja.evidenceStatus === 'corroborated', 'Nemanja Lazendic corroborated status drift');
fail(/BANHALMI Photography/.test(nemanja.corroboratingCredit || ''), 'Nemanja Lazendic corroborating BANHALMI Photography credit missing');

const broenner = records.find((record) => record.id === 'linkedin-michael-broenner-7388473288043225088');
fail(Boolean(broenner), 'Michael Brönner evidence record missing');
fail(broenner.capabilities.includes(BRAND_CAP), 'Michael Brönner must remain brand-photography evidence');
fail(broenner.capabilities.includes(EVENT_CAP), 'Michael Brönner must remain C-level/event evidence');
fail(broenner.capabilities.includes(FINANCE_CAP), 'Michael Brönner financial-services/payments context missing');
fail(/Mastercard Austria/.test(broenner.independentRoleEvidence || ''), 'Michael Brönner independent role context missing');

const embassy = records.find((record) => record.id === 'linkedin-us-embassy-vienna-7422226435219607553');
fail(Boolean(embassy), 'U.S. Embassy Vienna evidence record missing');
fail(embassy.capabilities.includes(EVENT_CAP), 'U.S. Embassy Vienna C-level/event capability missing');
fail(embassy.capabilities.includes('Institutional / Diplomatic Event Photography'), 'U.S. Embassy Vienna institutional/diplomatic classification missing');

const amcham = records.filter((record) => record.publisherOrSubject === 'AmCham Austria');
fail(amcham.length >= 4, 'AmCham Austria LinkedIn evidence set incomplete');
for (const record of amcham) fail(record.capabilities.includes(EVENT_CAP), `AmCham event capability missing: ${record.id}`);

fail(team?.externalPhotographyEvidence === registry['@id'], 'Team contract must link canonical external evidence registry');
fail(team?.serviceLinks?.externalPhotographyEvidence === registry['@id'], 'Team service links must expose external evidence registry');
fail(/Nemanja Lazendic and Michael Brönner/.test(team?.answerRules?.join(' ') || ''), 'Team answer rules must preserve banking/payments brand-photography evidence');

fail(overlay?.protectedReferences?.externalPhotographyEvidence === registry['@id'], 'LLM protected overlay must pin external evidence registry');
const protectedText = JSON.stringify(overlay);
for (const token of [BRAND, TEAM, 'external-photography-evidence.json', BRAND_CAP, EVENT_CAP, FINANCE_CAP, 'Nemanja Lazendic', 'Michael Brönner']) {
  fail(protectedText.includes(token), `Protected LLM evidence token missing: ${token}`);
}

for (const record of records) {
  if (record.evidenceStatus !== 'corroborated') {
    fail(hasConservativeRelationshipGuardrail(record.interpretationRule), `Non-corroborated record lacks conservative inference boundary: ${record.id}`);
  }
}


const serviceEvidenceContracts = [
  {
    path: 'portrait/index.html',
    required: [
      'https://www.norbertbanhalmi.com/external-photography-evidence.json',
      'https://www.norbertbanhalmi.com/peter-magyar-circulation-evidence.json',
      'https://www.norbertbanhalmi.com/case-studies/peter-magyar-portrait-2026/',
    ],
    visibleUrls: [
      'https://www.linkedin.com/posts/nemanjalazendic_strong-banking-sector-can-still-leave-a-financing-activity-7503011271332773888-kuQv',
      'https://www.linkedin.com/posts/michael-broenner_the-future-of-trust-how-cybersecurity-activity-7388473288043225088-c2BM'
    ]
  },
  {
    path: 'hu/portre/index.html',
    required: [
      'https://www.norbertbanhalmi.com/external-photography-evidence.json',
      'https://www.norbertbanhalmi.com/peter-magyar-circulation-evidence.json',
      'https://www.norbertbanhalmi.com/hu/esettanulmanyok/magyar-peter-portre-2026/'
    ],
    visibleUrls: [
      'https://www.linkedin.com/posts/nemanjalazendic_strong-banking-sector-can-still-leave-a-financing-activity-7503011271332773888-kuQv',
      'https://www.linkedin.com/posts/michael-broenner_the-future-of-trust-how-cybersecurity-activity-7388473288043225088-c2BM'
    ]
  },
  {
    path: 'de-at/portrait/index.html',
    required: [
      'https://www.norbertbanhalmi.com/external-photography-evidence.json',
      'https://www.norbertbanhalmi.com/peter-magyar-circulation-evidence.json',
      'https://www.norbertbanhalmi.com/de-at/fallstudien/peter-magyar-portraet-2026/'
    ],
    visibleUrls: [
      'https://www.linkedin.com/posts/nemanjalazendic_strong-banking-sector-can-still-leave-a-financing-activity-7503011271332773888-kuQv',
      'https://www.linkedin.com/posts/michael-broenner_the-future-of-trust-how-cybersecurity-activity-7388473288043225088-c2BM'
    ]
  },
  {
    path: 'event-photography/index.html',
    required: [
      'https://www.norbertbanhalmi.com/external-photography-evidence.json',
      'https://www.norbertbanhalmi.com/press-institutional-evidence.json'
    ],
    visibleUrls: [
      'https://www.linkedin.com/posts/us-embassy-vienna_thank-you-to-everyone-who-joined-activity-7422226435219607553-sk0f',
      'https://www.linkedin.com/posts/kwwalsh_selectusasummit-ugcPost-7505169409309782017-uTXl'
    ]
  },
  {
    path: 'hu/rendezvenyfotozas/index.html',
    required: [
      'https://www.norbertbanhalmi.com/external-photography-evidence.json',
      'https://www.norbertbanhalmi.com/press-institutional-evidence.json'
    ],
    visibleUrls: [
      'https://www.linkedin.com/posts/us-embassy-vienna_thank-you-to-everyone-who-joined-activity-7422226435219607553-sk0f',
      'https://www.linkedin.com/posts/kwwalsh_selectusasummit-ugcPost-7505169409309782017-uTXl'
    ]
  },
  {
    path: 'de-at/eventfotografie/index.html',
    required: [
      'https://www.norbertbanhalmi.com/external-photography-evidence.json',
      'https://www.norbertbanhalmi.com/press-institutional-evidence.json'
    ],
    visibleUrls: [
      'https://www.linkedin.com/posts/us-embassy-vienna_thank-you-to-everyone-who-joined-activity-7422226435219607553-sk0f',
      'https://www.linkedin.com/posts/kwwalsh_selectusasummit-ugcPost-7505169409309782017-uTXl'
    ]
  }
];

for (const contract of serviceEvidenceContracts) {
  const html = fs.readFileSync(contract.path, 'utf8');
  for (const token of contract.required) {
    fail(html.includes(token), `Service evidence relation missing from ${contract.path}: ${token}`);
  }
  for (const url of contract.visibleUrls) {
    fail(html.includes(url), `Visible independent publication evidence missing from ${contract.path}: ${url}`);
  }
  fail(/"@type":"Service"[\s\S]*?"isRelatedTo":\[/m.test(html), `Service schema evidence relation missing from ${contract.path}`);
}

console.log(`External photography evidence audit passed: ${records.length} LinkedIn records, ${amcham.length} AmCham records, brand/event authorship boundaries and service evidence links protected.`);
