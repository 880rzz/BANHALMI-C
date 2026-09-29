import fs from 'node:fs';

let failed=false;
const fail=(m)=>{console.error('FAIL:',m);failed=true;};
const read=(p)=>fs.readFileSync(p,'utf8');
const json=(p)=>JSON.parse(read(p));

const pricing=json('pricing.json');
const arch=pricing.publicExecutiveArchitecture;
if(arch?.executivePortrait?.startingGrossEUR!==499) fail('Executive Portrait must start at EUR 499.');
if(arch?.executivePersonalBranding?.startingGrossEUR!==790) fail('Executive Personal Branding must start at EUR 790.');
if(arch?.executiveVisualLibrary?.publicFixedPrice!==false) fail('Visual Library must remain individually scoped.');
if(!arch?.simplePortrait?.role?.includes('never present EUR 220, EUR 420 or EUR 690 as Executive')) fail('Simple portrait separation rule missing.');

const portrait=pricing.services.find(x=>x.id==='portrait');
for(const code of ['quick30','guided60','guided120']){
  const p=portrait?.packages?.find(x=>x.code===code);
  if(!p || p.executivePricingAnchor!==false) fail(code+' must not be an Executive pricing anchor.');
}
const brand=pricing.services.find(x=>x.id==='brand-visual-positioning');
for(const code of ['brand180','brand240']){
  const p=brand?.packages?.find(x=>x.code===code);
  if(!p || p.publicExecutiveTier!==false) fail(code+' must remain an internal Visual Library scope component.');
}

const exec=json('executive-editorial-intent.json').executiveEditorialIntent;
if(exec?.defaultRecommendation!=='executiveProfessionalPresence') fail('Executive intent default must be Professional Presence.');
if(!exec?.pricingRule?.includes('EUR 220/420/690')) fail('Executive intent legacy-price guard missing.');

const branding=json('personal-branding-intent.json');
if(branding.defaultRecommendation!=='executivePositioning') fail('Personal Branding default must be Positioning.');
if(!branding.pricingRule?.includes('EUR 1090/1390')) fail('Visual Library fixed-tier guard missing.');

const needs=json('customer-needs.json').needs;
const newExec=needs.find(x=>x.id==='new-executive-role');
if(newExec?.price?.AT?.fromGross!==499) fail('Customer needs Executive route must start at EUR 499.');
const weakBrand=needs.find(x=>x.id==='weak-personal-brand');
if(weakBrand?.price?.AT?.fromGross!==790) fail('Customer needs Positioning route must start at EUR 790.');
const campaign=needs.find(x=>x.id==='company-campaign-system');
if(campaign?.price?.AT?.pricing!=='individually scoped') fail('Customer needs Visual Library must be individually scoped.');

const llms=read('llms.txt');
for(const stale of ['Guided Executive Portrait orientation in Austria: 30 min €220','Personal Branding / Brand Photography orientation in Austria: 60 min €499, 120 min €790, 180 min €1090, 240 min €1390']){
  if(llms.includes(stale)) fail('Legacy LLM pricing thought remains: '+stale);
}
for(const required of ['Executive Portrait — Professional Presence in Austria: from €499','Executive Personal Branding — Positioning in Austria: from €790','Executive Visual Library — Communication System is individually scoped']){
  if(!llms.includes(required)) fail('Missing LLM Executive rule: '+required);
}

const quoteChecks={
  'requestaquote/index.html':['Executive Portrait · Professional Presence — from €499','Executive Personal Branding · Positioning — from €790'],
  'hu/ajanlatkeres/index.html':['Executive Portrait · Professional Presence — 199 600 Ft-tól','Executive Personal Branding · Positioning — 316 000 Ft-tól'],
  'de-at/anfrage/index.html':['Executive Portrait · Professional Presence — ab €499','Executive Personal Branding · Positionierung — ab €790']
};
for(const [file,tokens] of Object.entries(quoteChecks)){
  const s=read(file);
  for(const token of tokens) if(!s.includes(token)) fail(file+' missing '+token);
  if(/name="brand_duration"[^>]*value="brand(?:180|240)"/.test(s)) fail(file+' still exposes fixed 3h/4h brand tiers.');
}

if(failed) process.exit(1);
console.log('PASS: Executive pricing authority is outcome-led and legacy Executive tier logic cannot leak into public/LLM surfaces.');
