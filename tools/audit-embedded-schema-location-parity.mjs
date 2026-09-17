import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const PERSON_ID = 'https://www.norbertbanhalmi.com/about/';
const ORG_ID = 'https://www.norbertbanhalmi.com/#organization';
const STUDIO_VIE = 'https://www.norbertbanhalmi.com/#vienna-studio';
const STUDIO_BUD = 'https://www.norbertbanhalmi.com/#budapest-studio';
const OFFICE_ID = 'https://www.norbertbanhalmi.com/#vienna-gersthofer-office';
const EXPECTED_LOCATIONS=[STUDIO_VIE,STUDIO_BUD,OFFICE_ID];
const failures = [];

const canonical = JSON.parse(fs.readFileSync(path.join(root, 'entity.jsonld'), 'utf8'));
const canonicalGraph = Array.isArray(canonical['@graph']) ? canonical['@graph'] : [];
const canonicalOffice = canonicalGraph.find(node => node && node['@id'] === OFFICE_ID);
const canonicalPerson = canonicalGraph.find(node => node && node['@id']===PERSON_ID && (node['@type']==='Person'||(Array.isArray(node['@type'])&&node['@type'].includes('Person'))));
const canonicalOrg = canonicalGraph.find(node => node && node['@id']===ORG_ID && (node['@type']==='Organization'||(Array.isArray(node['@type'])&&node['@type'].includes('Organization'))));
if(!canonicalPerson) failures.push('entity.jsonld: canonical Person is missing');
else {
  if(Object.hasOwn(canonicalPerson,'homeLocation')) failures.push('entity.jsonld: Person.homeLocation must not encode a business/studio location; use workLocation');
  if(!exactLocations(canonicalPerson.workLocation)) failures.push('entity.jsonld: Person.workLocation must reference exactly Vienna studio, Budapest studio and Gersthofer office');
}
if(!canonicalOrg) failures.push('entity.jsonld: canonical Organization is missing');
else if(!exactLocations(canonicalOrg.location)) failures.push('entity.jsonld: Organization.location must reference exactly Vienna studio, Budapest studio and Gersthofer office');
if (!canonicalOffice) failures.push('entity.jsonld: canonical Gersthofer office Place is missing');
else {
  const text = JSON.stringify(canonicalOffice);
  if (!text.includes('Gersthofer Straße 150–154/6/2')) failures.push('entity.jsonld: Gersthofer street address drift');
  if (!/office|client meeting/i.test(text)) failures.push('entity.jsonld: Gersthofer office/client-meeting role missing');
  if (!/not a photographic studio|not a studio|studio[^]{0,80}false/i.test(text)) failures.push('entity.jsonld: Gersthofer non-studio semantics missing');
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '_site') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function refs(value) {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list.map(item => typeof item === 'string' ? item : item?.['@id']).filter(Boolean);
}
function exactLocations(value){const ids=refs(value);return ids.length===EXPECTED_LOCATIONS.length&&new Set(ids).size===EXPECTED_LOCATIONS.length&&EXPECTED_LOCATIONS.every(id=>ids.includes(id));}

let structuredPages = 0;
let personPages = 0;
let orgPages = 0;
for (const file of walk(root).filter(file => file.endsWith('.html'))) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const html = fs.readFileSync(file, 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (!scripts.length) continue;
  let pageHasCanonicalEntity = false;
  for (const match of scripts) {
    let data;
    try { data = JSON.parse(match[1]); }
    catch (error) { failures.push(`${rel}: invalid JSON-LD (${error.message})`); continue; }
    const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : [data];
    const person = graph.find(node => node && node['@id'] === PERSON_ID && (node['@type'] === 'Person' || (Array.isArray(node['@type']) && node['@type'].includes('Person'))));
    const org = graph.find(node => node && node['@id'] === ORG_ID && (node['@type'] === 'Organization' || (Array.isArray(node['@type']) && node['@type'].includes('Organization'))));
    if (!person && !org) continue;
    pageHasCanonicalEntity = true;
    const office = graph.find(node => node && node['@id'] === OFFICE_ID);
    if (!office) failures.push(`${rel}: canonical Gersthofer Place node missing from embedded graph`);
    else if (canonicalOffice) {
      const a = office.address?.streetAddress;
      const b = canonicalOffice.address?.streetAddress;
      if (a !== b) failures.push(`${rel}: Gersthofer embedded address drift (${a ?? 'missing'})`);
      const officeText = JSON.stringify(office);
      if (!/office|client meeting/i.test(officeText) || !/not a photographic studio|not a studio|studio[^]{0,80}false/i.test(officeText)) failures.push(`${rel}: Gersthofer embedded role/non-studio semantics drift`);
    }
    if (person) {
      personPages += 1;
      if(Object.hasOwn(person,'homeLocation')) failures.push(`${rel}: Person.homeLocation must not encode business/studio location`);
      if (!exactLocations(person.workLocation)) failures.push(`${rel}: Person.workLocation must reference exactly Vienna studio, Budapest studio and Gersthofer office`);
    }
    if (org) {
      orgPages += 1;
      if (!exactLocations(org.location)) failures.push(`${rel}: Organization.location must reference exactly Vienna studio, Budapest studio and Gersthofer office`);
    }
  }
  if (pageHasCanonicalEntity) structuredPages += 1;
}

if (structuredPages < 45) failures.push(`embedded schema coverage unexpectedly low: ${structuredPages} pages`);
if (personPages < 45) failures.push(`Person schema coverage unexpectedly low: ${personPages}`);
if (orgPages < 45) failures.push(`Organization schema coverage unexpectedly low: ${orgPages}`);

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Embedded schema location parity passed: canonical Person/Organization plus ${structuredPages} pages; Person ${personPages}, Organization ${orgPages}; only workLocation/location carry the exact three business locations and Gersthofer remains non-studio office.`);
