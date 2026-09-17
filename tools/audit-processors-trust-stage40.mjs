import fs from 'node:fs';

const registry=JSON.parse(fs.readFileSync('processors.json','utf8'));
if(registry.documentType!=='BANHALMI service-provider and processor registry') throw new Error('processors.json: unexpected document type');
const providers=new Map(registry.providers.map(p=>[p.id,p]));
for(const id of ['github-pages','cloudflare-workers','google-workspace-apps-script','google-analytics-4','elfsight','vercel-legacy-redirects']){
  if(!providers.has(id)) throw new Error(`processors.json: missing provider ${id}`);
}
for(const id of ['google-analytics-4','elfsight']){
  if(providers.get(id).consentRequired!==true) throw new Error(`${id}: optional provider must remain consent-gated`);
}
for(const id of ['github-pages','cloudflare-workers','google-workspace-apps-script','vercel-legacy-redirects']){
  if(providers.get(id).consentRequired!==false) throw new Error(`${id}: necessary/request-driven infrastructure must not be mislabeled as optional consent storage`);
}
const legacy=providers.get('vercel-legacy-redirects');
for(const host of ['banhalmi.at','www.banhalmi.at','banhalminorbert.hu','www.banhalminorbert.hu']){
  if(!legacy.scope.includes(host)) throw new Error(`Vercel legacy scope missing ${host}`);
}

const notices=registry.humanReadableNotices || {};
const expectedNotices={
  privacy:'https://www.norbertbanhalmi.com/privacy-policy/',
  cookies:'https://www.norbertbanhalmi.com/cookie-policy/',
  trustCenter:'https://www.norbertbanhalmi.com/trust/'
};
for(const [key,value] of Object.entries(expectedNotices)){
  if(notices[key]!==value) throw new Error(`processors.json: ${key} human-readable notice must remain ${value}`);
}

const pages={
  en:fs.readFileSync('privacy-policy/index.html','utf8'),
  hu:fs.readFileSync('hu/adatvedelem/index.html','utf8'),
  de:fs.readFileSync('de-at/datenschutz/index.html','utf8')
};
for(const [lang,text] of Object.entries(pages)){
  for(const needle of ['GitHub Pages','Cloudflare','Google Apps Script','Elfsight','Vercel']){
    if(!text.includes(needle)) throw new Error(`${lang} privacy: missing provider disclosure ${needle}`);
  }
  if(/Wix/i.test(text)) throw new Error(`${lang} privacy: legacy Wix disclosure must not remain`);
}

const trust=fs.readFileSync('trust/index.html','utf8');
if(!/href=["']\/privacy-policy\/["']/i.test(trust)){
  throw new Error('Trust Center must link to the authoritative human-readable privacy notice');
}
if(/privacy-policy\/?#processors/i.test(trust)){
  throw new Error('Trust Center must not reintroduce the previously broken #processors fragment');
}

const machineEntrypoints=['llms.txt','ai.txt','knowledge-core.json'];
const machineCorpus=machineEntrypoints.map(file=>fs.readFileSync(file,'utf8')).join('\n');
if(!machineCorpus.includes('processors.json')){
  console.warn('Stage 40 note: processors.json is valid and public but is not yet advertised in a machine entry file.');
}

console.log('Stage 40 processor/trust audit passed: machine registry, consent gating, legacy redirects, human privacy notices and Trust Center routing are aligned.');
