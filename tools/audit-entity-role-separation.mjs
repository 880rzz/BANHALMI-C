import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PERSON_ID = 'https://www.norbertbanhalmi.com/about/';
const ORG_ID = 'https://www.norbertbanhalmi.com/#organization';
const BRAND_ID = 'https://www.norbertbanhalmi.com/#brand';
const SERVICE_ID = 'https://www.norbertbanhalmi.com/#visual-trust-partnership';
const LEGAL_NAME = 'Banhalmi Norbert e.U.';
const failures = [];
let fullGraphs = 0;

function types(node) {
  const value = node?.['@type'];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function inspectGraph(data, label) {
  const graph = Array.isArray(data?.['@graph']) ? data['@graph'] : null;
  const nodes = graph || [data];
  const person = nodes.find((n) => n?.['@id'] === PERSON_ID && types(n).includes('Person'));
  const org = nodes.find((n) => n?.['@id'] === ORG_ID && types(n).includes('Organization'));
  const brand = nodes.find((n) => n?.['@id'] === BRAND_ID && types(n).includes('Brand'));
  const service = nodes.find((n) => n?.['@id'] === SERVICE_ID && types(n).includes('Service'));

  if (person) {
    const alts = Array.isArray(person.alternateName) ? person.alternateName : [];
    if (alts.includes('BANHALMI')) failures.push(`${label}: canonical Person must not use bare BANHALMI as alternateName`);
  }

  if (org) {
    if (org.name !== LEGAL_NAME) failures.push(`${label}: canonical Organization name must be ${LEGAL_NAME}`);
    if (org.legalName !== LEGAL_NAME) failures.push(`${label}: canonical Organization legalName must be ${LEGAL_NAME}`);
    const alts = Array.isArray(org.alternateName) ? org.alternateName : [];
    if (alts.some((v) => ['Bánhalmi Norbert', 'Norbert Bánhalmi'].includes(v))) failures.push(`${label}: canonical Organization must not use Person names as alternateName`);
    if (org.brand?.['@id'] !== BRAND_ID) failures.push(`${label}: canonical Organization must reference canonical Brand`);
    const served = Array.isArray(org.areaServed) ? org.areaServed : [];
    if (!served.includes('Worldwide')) failures.push(`${label}: Organization areaServed must expose documented worldwide project availability`);
  }

  if (person && org) {
    fullGraphs++;
    if (!brand) failures.push(`${label}: full canonical graph is missing the BANHALMI Brand node`);
  }

  if (brand) {
    if (brand.name !== 'BANHALMI') failures.push(`${label}: canonical Brand name must be BANHALMI`);
    if (brand.owner?.['@id'] !== ORG_ID) failures.push(`${label}: canonical Brand owner must be the Organization`);
    if (brand.founder?.['@id'] !== PERSON_ID) failures.push(`${label}: canonical Brand founder must be the Person`);
    if (brand.sameAs) failures.push(`${label}: BANHALMI Brand must not claim a sameAs identity until a dedicated verified Brand entity exists`);
  }

  if (service) {
    const served = Array.isArray(service.areaServed) ? service.areaServed : [];
    if (!served.includes('Worldwide')) failures.push(`${label}: strategic partnership Service must expose documented worldwide project availability`);
  }
}

function inspectHtml(file) {
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  while ((match = re.exec(html))) {
    index++;
    try {
      inspectGraph(JSON.parse(match[1]), `${path.relative(ROOT, file)}#jsonld-${index}`);
    } catch (error) {
      failures.push(`${path.relative(ROOT, file)}#jsonld-${index}: invalid JSON-LD (${error.message})`);
    }
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site', 'artifacts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) inspectHtml(full);
  }
}

walk(ROOT);
for (const file of ['entity.jsonld', 'brand-positioning.jsonld']) {
  try {
    inspectGraph(JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8')), file);
  } catch (error) {
    failures.push(`${file}: cannot inspect (${error.message})`);
  }
}

if (!fullGraphs) failures.push('No full Person + Organization canonical graph found.');

if (failures.length) {
  console.error('Entity role separation audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Entity role separation audit passed across ${fullGraphs} full canonical graph(s).`);
