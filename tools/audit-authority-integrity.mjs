import fs from 'node:fs';

function fail(message) {
  console.error(`AUTHORITY INTEGRITY ERROR: ${message}`);
  process.exit(1);
}

function readJson(path) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

const PERSON_ID = 'https://www.norbertbanhalmi.com/about/';
const COMPANY_ID = 'https://www.norbertbanhalmi.com/#organization';
const CENTRAL_ID = 'https://www.kozpontiszovetseg.at/#organization';
const BMI_ID = 'https://www.magyariskola.at/#school';
const VIPACH_ID = 'https://www.vipach.at/#organization';
const HIPSTUDIO_ID = 'https://www.hipstudio.hu/#organization';

const authority = readJson('person-authority.jsonld');
const graph = asArray(authority['@graph']);
const person = graph.find((node) => node?.['@type'] === 'Person' && node?.['@id'] === PERSON_ID);
if (!person) fail('canonical Person node is missing from person-authority.jsonld');

const sameAs = asArray(person.sameAs);
for (const required of [
  'https://www.wikidata.org/wiki/Q56391118',
  'https://hu.wikipedia.org/wiki/B%C3%A1nhalmi_Norbert'
]) {
  if (!sameAs.includes(required)) fail(`canonical Person sameAs is missing ${required}`);
}

const subjectUrls = asArray(person.subjectOf).map((entry) => entry?.url || entry?.['@id']).filter(Boolean);
if (!subjectUrls.includes('https://rolunk.at/tag/banhalmi-norbert/')) fail('Rólunk.at must remain subjectOf/press evidence for Bánhalmi Norbert');
if (!subjectUrls.includes('https://www.norbertbanhalmi.com/hipstudio-authority.json')) fail('HIPStudio founder authority must remain linked from the canonical Person');
if (sameAs.includes('https://rolunk.at/tag/banhalmi-norbert/')) fail('Rólunk.at must never be serialized as sameAs');

if (person.worksFor?.['@id'] !== COMPANY_ID) fail('Person worksFor must resolve only to the canonical Banhalmi Norbert e.U. organization');

const affiliations = asArray(person.affiliation);
const central = affiliations.find((entry) => entry?.['@id'] === CENTRAL_ID);
const bmi = affiliations.find((entry) => entry?.['@id'] === BMI_ID);
const vipach = affiliations.find((entry) => entry?.['@id'] === VIPACH_ID);
const hipstudioAffiliation = affiliations.find((entry) => entry?.['@id'] === HIPSTUDIO_ID);
if (!central || central.sameAs !== 'https://www.wikidata.org/wiki/Q141274866') fail('Központi affiliation/Q141274866 missing');
if (!bmi || bmi.sameAs !== 'https://www.wikidata.org/wiki/Q141274560') fail('BMI affiliation/Q141274560 missing');
if (!vipach || vipach.sameAs !== 'https://www.wikidata.org/wiki/Q138416887') fail('VIPACH affiliation/Q138416887 missing');
if (!hipstudioAffiliation || hipstudioAffiliation.sameAs !== 'https://www.wikidata.org/wiki/Q138482177') fail('HIPStudio affiliation/Q138482177 missing');
if (!String(hipstudioAffiliation.description || '').includes('founded HIPStudio')) fail('HIPStudio founder relationship missing from Person authority');
if (!String(hipstudioAffiliation.description || '').includes('does not imply current ownership')) fail('HIPStudio founder/current-ownership boundary missing');

const centralDescription = String(central.description || '').toLowerCase();
if (!centralDescription.includes('önkéntes') || !centralDescription.includes('nem munkaviszony') || !centralDescription.includes('nem fizetett')) fail('Központi relationship must explicitly remain voluntary and non-employment/non-paid');

const company = graph.find((node) => node?.['@id'] === COMPANY_ID);
if (!company || company.sameAs !== 'https://www.wikidata.org/wiki/Q138425941') fail('Banhalmi Norbert e.U. must remain linked to Wikidata Q138425941');

const hipstudioNode = graph.find((node) => node?.['@id'] === HIPSTUDIO_ID);
if (!hipstudioNode) fail('HIPStudio Organization node missing from person-authority.jsonld');
if (hipstudioNode.sameAs !== 'https://www.wikidata.org/wiki/Q138482177') fail('HIPStudio Wikidata identity drift');
if (hipstudioNode.founder?.['@id'] !== PERSON_ID) fail('HIPStudio founder must remain Bánhalmi Norbert');
if (hipstudioNode.foundingDate !== '2006-03-15') fail('HIPStudio operational founding date drift');

const hipstudioAuthority = readJson('hipstudio-authority.json');
if (hipstudioAuthority.entity?.wikidataId !== 'Q138482177') fail('hipstudio-authority Wikidata drift');
if (hipstudioAuthority.founderRelationship?.founder?.wikidata !== 'https://www.wikidata.org/wiki/Q56391118') fail('hipstudio-authority founder Person drift');
if (hipstudioAuthority.founderRelationship?.operationalFoundingDate !== '2006-03-15') fail('hipstudio-authority founding date drift');

const business = readJson('business-authority.json');
const entity = business.entity || {};
if (entity.wikidata !== 'Q138425941') fail('business-authority Wikidata must remain Q138425941');
if (entity.identifiers?.GLN_public_administration !== '9110037983878') fail('GLN drift detected');
if (entity.identifiers?.VAT_UID !== 'ATU80445314') fail('UID drift detected');
if (entity.identifiers?.GISA !== '36592951') fail('GISA drift detected');

const primary = entity.primaryWkoBusinessAddress || {};
if (primary.streetAddress !== 'Schwedenplatz 2, Top 8–9' || primary.postalCode !== '1010' || primary.addressLocality !== 'Wien') fail('Schwedenplatz business/studio address drift detected');
const office = entity.additionalViennaLocation || {};
if (office.streetAddress !== 'Gersthofer Straße 150–154/6/2' || office.postalCode !== '1180' || office.addressLocality !== 'Wien') fail('Gersthofer office address drift detected');
if (!String(office.role || '').toLowerCase().includes('not the vienna studio')) fail('Gersthofer office must remain explicitly distinct from the Vienna studio');

const readme = fs.readFileSync('README.md', 'utf8');
for (const token of ['person-authority.jsonld', 'business-authority.json', 'hipstudio-authority.json', 'Q56391118', 'Q138425941', 'Q138482177']) {
  if (!readme.includes(token)) fail(`README authority contract missing ${token}`);
}
if (!readme.toLowerCase().includes('voluntary') || !readme.toLowerCase().includes('must not be represented or inferred as employment')) fail('README must preserve the voluntary/non-employment interpretation rule');

console.log('Authority integrity audit passed: Person, business, HIPStudio founder history, institutional affiliations and location semantics are stable.');
