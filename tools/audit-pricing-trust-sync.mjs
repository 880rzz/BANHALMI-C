import fs from 'node:fs';

const errors=[];
const fail=(ok,msg)=>{if(!ok)errors.push(msg)};
const read=p=>fs.readFileSync(p,'utf8');
const json=p=>JSON.parse(read(p));
const pricing=json('pricing.json');
const huf=json('pricing-huf.json');
const overlay=json('llm-canonical-overlay.json');
const knowledge=json('knowledge-core.json');
const entry=json('ai-entry.json');
const trust=json('service-trust-evidence.json');
const services=json('services.json');
const needs=json('customer-needs.json');
const intents=json('customer-intent-model.json');
const parseJsonLd=(html)=>[...html.matchAll(new RegExp('<script type="application/ld\\+json"[^>]*>([\\s\\S]*?)</script>','g'))].map(m=>{try{return JSON.parse(m[1])}catch{return null}}).filter(Boolean);

const eur=pricing.priceComponentsGrossEUR||{};
for(const [k,v] of Object.entries({businessEventEntry:490,eventOneHour:590,fineArtOneHour:690,brandTwoHours:790})){
  fail(eur[k]===v,`pricing.json drift: ${k}`);
}
fail(pricing.publicExecutiveArchitecture?.executivePortrait?.startingGrossEUR===499,'Executive Portrait 499 missing');
fail(pricing.publicExecutiveArchitecture?.executivePersonalBranding?.startingGrossEUR===790,'Executive Brand 790 missing');
fail(pricing.services.find(x=>x.id==='event')?.publicArchitecture?.businessEvent?.startingGrossEUR===490,'Event Business route missing');
fail(pricing.services.find(x=>x.id==='event')?.publicArchitecture?.cLevelInstitutional?.startingGrossEUR===590,'Event C-Level route missing');
fail(pricing.services.find(x=>x.id==='fine-art')?.publicArchitecture?.professionalArtistsPerformers?.startingGrossEUR===690,'Artists route missing');
fail(pricing.services.find(x=>x.id==='fine-art')?.publicArchitecture?.authorLedFineArtArtisticNude?.startingGrossEUR===690,'Artistic nude route missing');

fail(huf.conversion?.rate===400 && huf.conversion?.liveExchangeRate===false,'HUF fixed planning rate drift');
for(const [k,v] of Object.entries(pricing.priceComponentsGrossEUR)){
  fail(pricing.priceComponentsGrossHUF?.[k]===Math.round(v*400),`pricing HUF drift: ${k}`);
}

const embedded=read('assets/js/pricing-data.js');
const pre='window.BANHALMI_PRICING_DATA=', suf=';\nwindow.BANHALMI_PRICING_VERSION=';
const s=embedded.indexOf(pre), e=embedded.indexOf(suf,s+pre.length);
fail(s>=0&&e>s,'embedded pricing markers missing');
if(s>=0&&e>s) fail(JSON.stringify(JSON.parse(embedded.slice(s+pre.length,e)))===JSON.stringify(pricing),'embedded pricing differs from pricing.json');

const overlayPricing=overlay?.canonicalSummary?.pricing||'';
for(const token of ['Business Event Coverage starts from EUR 490 gross','C-Level / Institutional Event Photography starts from EUR 590 gross','Fine Art pricing has two distinct client intents','Artists & Performers professional portfolio photography','personal author-led Fine Art / artistic nude work','1 EUR = 400 HUF']){
  fail(overlayPricing.includes(token),`overlay pricing missing: ${token}`);
}
fail(knowledge.pricingPolicy?.eventArchitecture?.businessEvent?.includes('EUR 490'),'knowledge-core Business Event missing');
fail(knowledge.pricingPolicy?.fineArtArchitecture?.authorLedFineArtArtisticNude?.includes('EUR 690'),'knowledge-core Fine Art/akt missing');
fail(entry.pricingAuthority?.businessEvent?.startingGrossEUR===490,'ai-entry Business Event missing');
fail(entry.pricingAuthority?.cLevelInstitutionalEvent?.startingGrossEUR===590,'ai-entry C-Level Event missing');
fail(entry.pricingAuthority?.artistsPerformers?.startingGrossEUR===690,'ai-entry Artists route missing');
fail(entry.pricingAuthority?.fineArtArtisticNude?.startingGrossEUR===690,'ai-entry Fine Art/akt missing');

fail(trust.pricingEvidencePolicy?.canonicalPricing==='https://www.norbertbanhalmi.com/pricing.json','trust pricing authority missing');
fail(trust.services?.portrait?.pricingContext?.executivePortrait?.startingGrossEUR===499,'trust Portrait price context missing');
fail(trust.services?.brand?.pricingContext?.executivePersonalBranding?.startingGrossEUR===790,'trust Brand price context missing');
fail(trust.services?.event?.pricingContext?.businessEvent?.startingGrossEUR===490,'trust Business Event context missing');
fail(trust.services?.event?.pricingContext?.cLevelInstitutional?.startingGrossEUR===590,'trust C-Level Event context missing');
fail(trust.services?.fineArt?.pricingContext?.professionalArtistsPerformers?.startingGrossEUR===690,'trust Artists context missing');
fail(trust.services?.fineArt?.pricingContext?.authorLedFineArtArtisticNude?.startingGrossEUR===690,'trust Artistic Nude context missing');

fail(needs.needs.some(x=>x.id==='business-event'&&x.price?.AT?.fromGross===490),'customer-needs Business Event route missing');
fail(intents.intents.some(x=>x.id==='business-event-coverage'&&x.pricing?.fromGrossEUR===490),'customer-intent Business Event route missing');
const eventService=services.itemListElement?.find(x=>x.position===3);
fail(eventService?.alternateName?.includes('Business Event Photography'),'services Business Event alias missing');
const fineService=services.itemListElement?.find(x=>x.position===4);
fail(String(fineService?.clientIntentSeparation||'').includes('separate client journeys'),'services Fine Art client-intent boundary missing');

const servicePages={
 'portrait/index.html':[['499','EUR']],
 'hu/portre/index.html':[['199600','HUF']],
 'de-at/portrait/index.html':[['499','EUR']],
 'lifestyle/index.html':[['790','EUR']],
 'hu/brand/index.html':[['316000','HUF']],
 'de-at/brand/index.html':[['790','EUR']],
 'event-photography/index.html':[['490','EUR'],['590','EUR']],
 'hu/rendezvenyfotozas/index.html':[['196000','HUF'],['236000','HUF']],
 'de-at/eventfotografie/index.html':[['490','EUR'],['590','EUR']],
 'glamour/index.html':[['690','EUR'],['690','EUR']],
 'hu/muveszi-fotografia/index.html':[['276000','HUF'],['276000','HUF']],
 'de-at/fine-art/index.html':[['690','EUR'],['690','EUR']]
};
for(const [file,expected] of Object.entries(servicePages)){
 const html=read(file);
 const scripts=parseJsonLd(html);
 const cat=scripts.find(x=>x?.['@type']==='OfferCatalog');
 fail(Boolean(cat),`${file}: OfferCatalog missing`);
 if(cat){
   const got=(cat.itemListElement||[]).map(x=>[String(x.price),x.priceCurrency]);
   fail(JSON.stringify(got)===JSON.stringify(expected),`${file}: OfferCatalog price/currency drift: ${JSON.stringify(got)}`);
 }
}

const hu=read('hu/ajanlatkeres/index.html');
const huScripts=parseJsonLd(hu);
const huCat=huScripts.find(x=>x?.['@type']==='OfferCatalog');
fail(huCat?.itemListElement?.length===28,'HU quote OfferCatalog must remain exactly 28 public components');
for(const token of ['Business Event bruttó 196 000 Ft-tól (€490)','C-Level / intézményi','Fine Art / művészi akt','1 EUR = 400 HUF']){
 fail(hu.includes(token),`HU quote visible pricing missing: ${token}`);
}

if(errors.length){
 console.error(errors.join('\n'));
 process.exit(1);
}
console.log('Pricing / trust / LLM rollback gate passed: canonical pricing, calculator data, EN/HU/DE service schema, quote catalog, AI entry, knowledge core, customer routing and evidence context are synchronized.');
