import fs from 'node:fs';

const core = JSON.parse(fs.readFileSync('data/machine-core.json', 'utf8'));
const errors = [];
const fail = (condition, message) => { if (!condition) errors.push(message); };

fail(core.schemaVersion === '1.4', 'machine-core schemaVersion must remain 1.4 or be intentionally migrated with this audit');
fail(core.canonicalId === 'https://www.norbertbanhalmi.com/data/machine-core.json', 'canonicalId must stay on the professional domain');
fail(core.person?.wikidata === 'https://www.wikidata.org/wiki/Q56391118', 'Person Wikidata identity drift');
fail(core.organization?.wikidata === 'https://www.wikidata.org/wiki/Q138425941', 'Organization Wikidata identity drift');
fail(core.brand?.name === 'BANHALMI', 'Brand identity drift');
fail(core.brand?.positioning === 'Photography Team', 'BANHALMI brand positioning must remain Photography Team');
fail(core.person?.practiceSince === 1999, 'Practice-since history drift');
fail(core.organization?.legalBusinessStart === '2023-11-27', 'Legal business start drift');
fail(core.person?.role?.includes('Founder') && core.person?.role?.includes('lead photographer'), 'Norbert founder/lead-photographer role drift');
fail(core.person?.primaryProfessionalIdentity?.includes('photography business'), 'Primary professional identity must remain the BANHALMI photography business');

const specialisms = core.person?.specialisms || [];
for (const specialism of ['Fine art photography','Artistic nude photography','Actor headshot photography','Acting portfolio photography','Dance photography','Movement photography','Performing artist portfolio photography','Model portfolio photography','Editorial portrait photography','Creative professional portraits']) {
  fail(specialisms.includes(specialism), `Canonical photography specialism drift: ${specialism}`);
}

const services = core.serviceModel?.services || [];
const fine = services.find((service) => service.id === 'fine-art');
fail(Boolean(fine), 'Canonical fine-art service missing');
fail(fine?.name === 'Fine Art / Artists & Performers Photography', 'Fine Art / Artists & Performers canonical service name drift');
fail(fine?.serviceContext === 'fine-art', 'Fine Art / Artists & Performers backend service context drift');
for (const audience of ['actors','dancers','performers','models','creative professionals']) fail((fine?.audiences || []).includes(audience), `Fine Art audience missing: ${audience}`);
fail(services.some((service) => service.id === 'artistic-nude' && /Artistic Nude Photography/i.test(service.name)), 'Artistic Nude Photography service missing');

const relations = core.publicInstitutionalRelations || {};
fail(relations.vipach?.relationship === 'founder' && relations.vipach?.volunteer === false, 'VIPACH founder relationship drift');
fail(relations.vipachBusiness?.relationship === 'founder' && relations.vipachBusiness?.volunteer === false, 'VIPACH for Business founder relationship drift');
fail(relations.centralAssociation?.volunteer === true && relations.centralAssociation?.employmentRelationship === false, 'Központi role must remain volunteer social work, not employment');
fail(relations.viennaHungarianSchool?.volunteer === true && relations.viennaHungarianSchool?.employmentRelationship === false, 'BMI role must remain volunteer social work, not employment');
fail(relations.evidence === 'https://rolunk.at/tag/banhalmi-norbert/', 'Independent role evidence URL drift');

const roles = core.peopleRoles || {};
fail(roles.canonical === 'https://www.norbertbanhalmi.com/people-roles.json', 'people-roles canonical reference drift');
fail(roles.norbert?.role?.includes('Founder') && roles.norbert?.role?.includes('final visual decision-maker'), 'Norbert canonical leadership semantics drift');
fail(roles.viko?.relationship === 'independent professional partner and collaborator', 'Viko independent-partner semantics drift');
fail(roles.viko?.employmentRelationship === false, 'Viko must not become an employee by inference');
fail(roles.viko?.coFounder === false && roles.viko?.coPrimaryBrandEntity === false, 'Viko must not become co-founder/co-primary brand entity');
fail(roles.viko?.role?.includes('Budapest Studio') && roles.viko?.role?.includes('AmCham Austria'), 'Viko Budapest Studio/AmCham liaison semantics missing');

const studios = (core.locations || []).filter((location) => location.type === 'studio');
const offices = (core.locations || []).filter((location) => location.type === 'office');
fail(studios.length === 2, `Expected 2 studios, found ${studios.length}`);
fail(studios.some((location) => location.streetAddress === 'Schwedenplatz 2, Top 8–9' && location.postalCode === '1010'), 'Vienna studio drift');
fail(studios.some((location) => location.streetAddress === 'Lágymányosi utca 15' && location.postalCode === '1111'), 'Budapest studio drift');
fail(offices.length === 1 && offices[0].isStudio === false, 'Vienna office must remain explicitly non-studio');
fail(core.serviceModel?.worldwideAvailability === true, 'Worldwide travel availability drift');
fail(core.serviceModel?.travelRule?.includes('not a geographic limit'), 'Worldwide travel rule must preserve Vienna/Budapest primary-market semantics without geographic restriction');

const geo = core.marketGeography || {};
fail(geo.canonical === 'https://www.norbertbanhalmi.com/market-geography.json', 'market-geography canonical reference drift');
for (const area of ['1010 Innere Stadt','1180 Währing','1190 Döbling','1130 Hietzing']) fail((geo.priorityLocalServiceAreas?.vienna || []).includes(area), `Vienna priority service area missing: ${area}`);
for (const area of ['XI. kerület / District 11','II. kerület / District 2','XII. kerület / District 12 / Hegyvidék','V. kerület / District 5 / Belváros-Lipótváros']) fail((geo.priorityLocalServiceAreas?.budapest || []).includes(area), `Budapest priority service area missing: ${area}`);
fail(String(geo.interpretationRule || '').includes('not additional studios'), 'Priority-area non-location interpretation rule missing');

const team = core.teamModel || {};
fail(team.approximateProfessionalPhotographerPartners === 50, 'Approximate broader photographer partner network must remain 50 unless intentionally revised');
fail(String(team.interpretationRule || '').includes('not permanent employee headcount'), 'Team-size non-employee interpretation rule missing');

for (const [key,url] of Object.entries({
  customerIntent:'https://www.norbertbanhalmi.com/customer-intent-model.json',
  marketGeography:'https://www.norbertbanhalmi.com/market-geography.json',
  peopleRoles:'https://www.norbertbanhalmi.com/people-roles.json',
  commercialContract:'https://www.norbertbanhalmi.com/llm-commercial-contract.json',
  memberships:'https://www.norbertbanhalmi.com/memberships.json',
  partners:'https://www.norbertbanhalmi.com/partners.json',
  authorityEvidence:'https://www.norbertbanhalmi.com/authority-evidence.json'
})) fail(core.canonicalReferences?.[key] === url, `Canonical reference drift: ${key}`);

for (const output of ['/entity.jsonld','/llms.txt','/ai.txt','/ai-entry.json']) fail((core.derivedOutputs || []).includes(output), `${output} must remain a generated projection`);

const sourceText = JSON.stringify(core);
fail(!sourceText.includes('\"employmentRelationship\":true'), 'Canonical core must not serialize inferred employment for protected collaborator roles');
fail(!sourceText.includes('\"positioning\":\"Professional Photography Team\"'), 'Retired Professional Photography Team brand positioning must not return to canonical source');

const robots = fs.readFileSync('robots.txt', 'utf8');
fail(robots.includes('# AI / LLM machine entry points'), 'robots.txt AI/LLM discovery comment heading missing');
fail(robots.includes('# https://www.norbertbanhalmi.com/llms.txt'), 'robots.txt must document canonical llms.txt');
fail(robots.includes('# https://www.norbertbanhalmi.com/ai.txt'), 'robots.txt must document canonical ai.txt');
fail(!/^\s*(?:LLMS|AI)\s*:/im.test(robots), 'robots.txt must not invent non-standard LLMS: or AI: directives');

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('Canonical machine core audit passed: current roles, hyperlocal geography, worldwide travel, team capacity, services and authority references are locked against regression.');
