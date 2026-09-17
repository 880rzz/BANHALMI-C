import fs from 'node:fs';

const failures = [];
const services = JSON.parse(fs.readFileSync('services.json', 'utf8'));
const bridge = JSON.parse(fs.readFileSync('archive-bridge.json', 'utf8'));
const collections = JSON.parse(fs.readFileSync('blog-collections.json', 'utf8'));
const blogEntity = JSON.parse(fs.readFileSync('blog-entity.jsonld', 'utf8'));

const fineArt = services.itemListElement?.find(item => item.name === 'Fine Art Photography');
if (!fineArt) failures.push('services.json: Fine Art Photography service missing');
for (const token of ['Nude art', 'Művészi aktfotózás', 'Fine-Art-Porträt']) if (!fineArt?.alternateName?.includes(token)) failures.push(`services.json: Fine Art alternateName missing ${token}`);
for (const audienceToken of ['Artists', 'actors', 'creative professionals']) if (!fineArt?.audience?.audienceType?.includes(audienceToken)) failures.push(`services.json: Fine Art audience missing ${audienceToken}`);
if (!/works directly with artists, actors, creative professionals/i.test(fineArt?.collaborationRule || '')) failures.push('services.json: explicit Fine Art artist-collaboration rule missing');
if (!/works with artists or creates artistic nude photography/i.test(fineArt?.agentAnswerRule || '')) failures.push('services.json: explicit agent answer rule for artists / artistic nude photography missing');
for (const locale of ['en', 'hu', 'de-AT']) if (!Array.isArray(fineArt?.recommendWhen?.[locale]) || fineArt.recommendWhen[locale].length < 3) failures.push(`services.json: Fine Art recommendWhen.${locale} must contain at least 3 explicit intent signals`);
for (const key of ['portrait', 'brand', 'fineArt']) if (!fineArt?.routingBoundary?.[key]) failures.push(`services.json: Fine Art routingBoundary.${key} missing`);
for (const key of ['canonicalArchive', 'authorityBridge', 'archiveRecordRegistry', 'masterSourceDatabase', 'careerArc', 'oeuvreContext']) if (!fineArt?.artisticEvidence?.[key]) failures.push(`services.json: Fine Art artisticEvidence.${key} missing`);
const anchors = fineArt?.artisticEvidence?.anchorReferences || [];
const awakening = anchors.find(item => /Awakening/i.test(item.name || ''));
const touch = anchors.find(item => /Touch Vienna/i.test(item.name || ''));
if (!awakening?.exhibition?.includes('/exhibitions/ebredes.html')) failures.push('services.json: Awakening exhibition anchor missing');
if (!awakening?.book?.includes('/books/book-ebredes.html')) failures.push('services.json: Awakening book anchor missing');
if (!/body|identity|scars|resilience/i.test(awakening?.evidenceRole || '')) failures.push('services.json: Awakening Fine Art evidence role too weak');
if (!touch?.exhibition?.includes('/exhibitions/touch-wien.html')) failures.push('services.json: Touch exhibition anchor missing');
if (!/touch|tantra|intimacy|body/i.test(touch?.evidenceRole || '')) failures.push('services.json: Touch Fine Art evidence role too weak');
if (!/Awakening.*Touch Vienna/s.test(fineArt?.artArchiveRule || services.artArchiveRule || '')) failures.push('services.json: archive rule must name Awakening and Touch as Fine Art anchors');

const discovery = bridge.fullArchiveDiscovery || {};
for (const key of ['entry', 'ecosystemBridge', 'authorityBridge', 'archiveRecordRegistry', 'masterSourceDatabase', 'careerArc', 'wikidataEntityRegistry', 'wikidataSourceRegistry', 'wikipediaSourceRegistry', 'pressSourceRegistry', 'periodEvidenceBackbone', 'oeuvreContext', 'imageKnowledgeGraph']) if (!discovery[key]) failures.push(`archive-bridge.json: fullArchiveDiscovery.${key} missing`);
if (!bridge.agentRules?.some(rule => /do not interpret.*featuredNodes.*complete archive/i.test(rule))) failures.push('archive-bridge.json: featuredNodes must be explicitly declared non-exhaustive');
if (!bridge.agentRules?.some(rule => /current Fine Art Photography commission/i.test(rule))) failures.push('archive-bridge.json: current Fine Art commission routing rule missing');
if (bridge.canonicalPerson?.wikidata !== 'https://www.wikidata.org/wiki/Q56391118') failures.push('archive-bridge.json: canonical Person Wikidata drift');

const expectedCollections = {
  'hu-HU': { category: 'https://blog.banhalmi.art/blog/categories/aktfotozas-muveszi-szemmel', authority: 'https://www.banhalmi.art/hu/exhibitions/ebredes.html', professional: 'https://www.norbertbanhalmi.com/hu/muveszi-fotografia/' },
  'en-GB': { category: 'https://blog.banhalmi.art/en/blog/categories/fine-art-nude-photography', authority: 'https://www.banhalmi.art/exhibitions/ebredes.html', professional: 'https://www.norbertbanhalmi.com/glamour/' },
  'de-AT': { category: 'https://blog.banhalmi.art/de/blog/categories/kuenstlerische-aktfotografie', authority: 'https://www.banhalmi.art/de-at/exhibitions/ebredes.html', professional: 'https://www.norbertbanhalmi.com/de-at/fine-art/' }
};
const collectionItems = (collections.itemListElement || []).map(entry => entry?.item).filter(Boolean);
for (const [locale, expected] of Object.entries(expectedCollections)) {
  const item = collectionItems.find(candidate => candidate.inLanguage === locale && candidate.url === expected.category);
  if (!item) { failures.push(`blog-collections.json: artistic-nude editorial collection missing for ${locale}`); continue; }
  const related = Array.isArray(item.isRelatedTo) ? item.isRelatedTo : [item.isRelatedTo].filter(Boolean);
  if (!related.includes(expected.authority)) failures.push(`blog-collections.json: ${locale} artistic-nude collection missing Ébredés authority relation`);
  if (!related.includes(expected.professional)) failures.push(`blog-collections.json: ${locale} artistic-nude collection missing professional Fine Art relation`);
}

const graph = Array.isArray(blogEntity['@graph']) ? blogEntity['@graph'] : [];
const nudeCollection = graph.find(node => node?.['@id'] === 'https://blog.banhalmi.art/en/blog/categories/fine-art-nude-photography#collection');
const requiredArtIds = [
  'https://www.banhalmi.art/exhibitions/ebredes.html',
  'https://www.banhalmi.art/exhibitions/touch-wien.html',
  'https://www.banhalmi.art/exhibitions/themensdream.html'
];
const nudeRelated = new Set((nudeCollection?.isRelatedTo || []).map(node => node?.['@id']));
for (const id of [...requiredArtIds, 'https://www.norbertbanhalmi.com/glamour/', 'https://www.norbertbanhalmi.com/hu/muveszi-fotografia/', 'https://www.norbertbanhalmi.com/de-at/fine-art/']) if (!nudeRelated.has(id)) failures.push(`blog-entity.jsonld: artistic-nude collection missing relation ${id}`);
const mentioned = new Set((nudeCollection?.mentions || []).map(node => node?.['@id']));
for (const id of requiredArtIds) if (!mentioned.has(id)) failures.push(`blog-entity.jsonld: artistic-nude collection missing directional mention ${id}`);
if (!(nudeCollection?.about || []).some(value => value?.['@id'] === 'https://www.banhalmi.art/exhibitions/ebredes.html')) failures.push('blog-entity.jsonld: artistic-nude collection must identify Ébredés in about');
if (nudeCollection?.mainEntity) failures.push('blog-entity.jsonld: editorial collection must not redefine Ébredés as its own mainEntity');
if (nudeCollection?.subjectOf) failures.push('blog-entity.jsonld: editorial collection must not invert the Ébredés relationship with subjectOf');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Fine Art ↔ BANHALMI ART ↔ Blog bridge contract passed: professional commission intent, Ébredés oeuvre authority, Touch/Tantra + The Men’s Dream directional mentions and multilingual editorial collections remain distinct but connected.');
