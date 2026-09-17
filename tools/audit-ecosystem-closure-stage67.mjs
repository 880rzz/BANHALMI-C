import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const assert = (condition, message) => { if (!condition) errors.push(message); };

let ecosystem;
try {
  ecosystem = JSON.parse(read('ecosystem.json'));
} catch (error) {
  console.error(`ecosystem.json: invalid JSON (${error.message})`);
  process.exit(1);
}

assert(ecosystem.documentType === 'canonical-digital-ecosystem-map', 'ecosystem.json: documentType drifted');
assert(ecosystem.canonicalPerson?.['@id'] === 'https://www.norbertbanhalmi.com/about/', 'ecosystem.json: canonical Person @id drifted');
assert(ecosystem.canonicalPerson?.wikidata === 'https://www.wikidata.org/wiki/Q56391118', 'ecosystem.json: Wikidata identity drifted');
assert(ecosystem.canonicalOrganization?.['@id'] === 'https://www.norbertbanhalmi.com/#organization', 'ecosystem.json: canonical Organization @id drifted');
assert(ecosystem.canonicalOrganization?.legalName === 'Banhalmi Norbert e.U.', 'ecosystem.json: legal organization name drifted');

const expectedRoles = new Map([
  ['professional-services', 'https://www.norbertbanhalmi.com/'],
  ['artistic-archive', 'https://www.banhalmi.art/'],
  ['editorial-knowledge-layer', 'https://blog.banhalmi.art/']
]);
const websites = Array.isArray(ecosystem.canonicalWebsites) ? ecosystem.canonicalWebsites : [];
assert(websites.length === expectedRoles.size, `ecosystem.json: expected exactly ${expectedRoles.size} canonical website roles`);
for (const [role, url] of expectedRoles) {
  const item = websites.find((entry) => entry?.role === role);
  assert(item?.url === url, `ecosystem.json: ${role} must resolve to ${url}`);
}

const aliases = Array.isArray(ecosystem.languageEntryDomains) ? ecosystem.languageEntryDomains : [];
const expectedAliases = new Map([
  ['https://www.banhalminorbert.hu/', 'https://www.norbertbanhalmi.com/hu/'],
  ['https://www.banhalmi.at/', 'https://www.norbertbanhalmi.com/de-at/']
]);
for (const [url, target] of expectedAliases) {
  const item = aliases.find((entry) => entry?.url === url);
  assert(item, `ecosystem.json: missing language-entry alias ${url}`);
  assert(item?.expectedHttpStatus === 301, `ecosystem.json: ${url} must remain a permanent redirect alias`);
  assert(item?.canonicalTarget === target && item?.redirectTarget === target, `ecosystem.json: ${url} target drifted from ${target}`);
}
const canonicalUrls = new Set(websites.map((entry) => entry?.url));
for (const alias of aliases) assert(!canonicalUrls.has(alias?.url), `ecosystem.json: redirect alias ${alias?.url} must not become canonical`);

const consultation = ecosystem.canonicalConsultation || {};
assert(consultation.type === 'video-call', 'ecosystem.json: consultation type drifted');
assert(consultation.durationMinutes === 15, 'ecosystem.json: consultation duration must remain 15 minutes');
assert(consultation.mode === 'Google Meet', 'ecosystem.json: consultation mode drifted');
assert(consultation.bookingProvider === 'Bookipi', 'ecosystem.json: consultation provider drifted');
assert(consultation.bookingUrl === 'https://meet.bookipi.com/zk5ly35r', 'ecosystem.json: canonical consultation URL drifted');
assert(consultation.bookingInterfaceLanguage === 'en', 'ecosystem.json: booking interface language contract drifted');

const expectedMachineSources = [
  'https://www.norbertbanhalmi.com/entity.jsonld',
  'https://www.norbertbanhalmi.com/knowledge.json',
  'https://www.norbertbanhalmi.com/ecosystem.json',
  'https://www.norbertbanhalmi.com/blog-entity.jsonld',
  'https://www.norbertbanhalmi.com/blog-collections.json'
];
const machineSources = new Set(ecosystem.authoritativeMachineReadableSources || []);
for (const url of expectedMachineSources) assert(machineSources.has(url), `ecosystem.json: authoritative machine source missing ${url}`);

for (const file of ['ai.txt', 'llms.txt']) {
  const text = read(file);
  for (const url of expectedRoles.values()) assert(text.includes(url), `${file}: missing ecosystem role URL ${url}`);
  assert(text.includes('Q56391118'), `${file}: missing canonical Wikidata identity`);
}

const networkAudit = read('tools/audit-seo-network.mjs');
for (const url of [
  'https://www.norbertbanhalmi.com/ecosystem.json',
  'https://www.banhalmi.art/ecosystem-bridge.json',
  'https://www.banhalmi.art/ecosystem-bridge.jsonld',
  'https://blog.banhalmi.art/',
  'https://blog.banhalmi.art/blog-posts-sitemap.xml',
  'https://blog.banhalmi.art/blog-categories-sitemap.xml'
]) assert(networkAudit.includes(`'${url}'`), `audit-seo-network.mjs: critical ecosystem URL is not fail-closed: ${url}`);

const productionRouting = read('tools/audit-production-routing.mjs');
for (const url of [
  'https://www.norbertbanhalmi.com/ecosystem.json',
  'https://www.banhalmi.art/ecosystem-bridge.json',
  'https://www.banhalmi.art/ecosystem-bridge.jsonld',
  'https://blog.banhalmi.art/',
  'https://blog.banhalmi.art/blog-posts-sitemap.xml',
  'https://blog.banhalmi.art/blog-categories-sitemap.xml'
]) assert(productionRouting.includes(url), `audit-production-routing.mjs: live ecosystem closure missing ${url}`);

if (errors.length) {
  console.error(`Stage67 ecosystem closure audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}

console.log('Stage67 ecosystem closure audit passed: one Person, one professional Organization, three non-competing web roles, two redirect-only market aliases, one canonical consultation path and fail-closed live checks for the professional, archive and editorial machine layers.');
