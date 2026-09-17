import fs from 'node:fs';

const registry=JSON.parse(fs.readFileSync('media-usage-evidence.json','utf8'));
const overlay=JSON.parse(fs.readFileSync('llm-canonical-overlay.json','utf8'));
const apply=fs.readFileSync('tools/apply-llm-canonical-overlay.mjs','utf8');

function requireContract(condition,message){if(!condition) throw new Error(message);}

const ID='https://www.norbertbanhalmi.com/media-usage-evidence.json';
requireContract(registry?.['@type']==='Dataset','Media usage evidence must remain a Dataset');
requireContract(registry?.['@id']===ID,'Media usage canonical Dataset ID drift');
requireContract(registry?.person?.['@id']==='https://www.norbertbanhalmi.com/about/','Canonical Person ID drift in media evidence');
requireContract(registry?.sourceDocument?.pageCount===98,'Raw PDF page count drift');
requireContract(registry?.sourceDocument?.uniqueTextCaptureGroups===58,'Capture-level dedupe count drift');
requireContract(registry?.sourceDocument?.duplicateCaptureGroups===14,'Duplicate capture group count drift');
requireContract(registry?.sourceDocument?.duplicatePagesBeyondFirstOccurrence===40,'Duplicate-page excess count drift');

const pubs=Array.isArray(registry?.explicitCreatorCreditPublications)?registry.explicitCreatorCreditPublications:[];
requireContract(pubs.length===6,'Normalized explicit creator-credit publication count must remain 6 until evidence review changes it explicitly');
for(const id of ['geopolitika-term-limits-2026','hungary-report-strongman-spell-2026','american-thinker-peter-magyar-2026','quotulatiousness-hungary-news-2026','sota-eu-credit-hungary-2026']){
  const p=pubs.find(item=>item.id===id);
  requireContract(Boolean(p),`Missing normalized publication: ${id}`);
  requireContract(p.confidence==='high',`Expected high-confidence publication: ${id}`);
  requireContract(/Norbert Bánhalmi|Norbert Banhalmi/i.test(p.credit||''),`Creator credit missing: ${id}`);
}
const disput=pubs.find(item=>item.id==='disput-hungary-election-violence-2026');
requireContract(disput?.confidence==='medium-high','Disput capture must remain medium-high until canonical article URL is independently resolved');
requireContract(disput?.articleUrl===null,'Do not invent Disput canonical article URL');

const exclusions=JSON.stringify(registry?.excludedNonCreditCaptures||[]);
for(const token of ['logged-in/self X profile','personalized advertising/navigation/newsletter UI']) requireContract(exclusions.includes(token),`False-positive exclusion missing: ${token}`);
requireContract(String(registry?.metrics?.doNotPublishAsMetric||'').includes('Do not present 98 pages, 58 captures or raw link counts'),'Raw capture metrics publication guardrail missing');
for(const token of ['Media usage/photo credit != client relationship.','Editorial use != political endorsement or affiliation.','Wikimedia reuse != direct commission by the publisher.']) requireContract((registry?.relationshipGuardrails||[]).includes(token),`Relationship guardrail missing: ${token}`);

requireContract(overlay?.protectedReferences?.mediaUsageEvidence===ID,'Protected overlay must pin media usage evidence registry');
for(const token of ['media-usage-evidence.json','International Editorial Image Circulation','Wikimedia Commons Licensed Distribution']) requireContract(JSON.stringify(overlay).includes(token),`Protected media token missing: ${token}`);
for(const token of ['applyMediaUsageEvidence','protectedMediaUsageEvidence','media-usage-evidence.json']) requireContract(apply.includes(token),`Post-generator media protection missing: ${token}`);

console.log(`Media usage evidence audit passed: 98 raw pages -> 58 capture groups -> ${pubs.length} normalized explicit creator-credit publications; false positives and relationship boundaries pinned.`);
