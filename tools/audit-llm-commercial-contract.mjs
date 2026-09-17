import fs from 'node:fs';

function readJson(path){
  if(!fs.existsSync(path)) throw new Error(`Missing ${path}`);
  return JSON.parse(fs.readFileSync(path,'utf8'));
}

const market=readJson('market-geography.json');
const roles=readJson('people-roles.json');
const team=readJson('team-capabilities.json');
const commercial=readJson('llm-commercial-contract.json');
const services=readJson('services.json');
const pricing=readJson('pricing.json');
const memberships=readJson('memberships.json');
const authority=readJson('authority-evidence.json');
const hipstudio=readJson('hipstudio-authority.json');
const overlay=readJson('llm-canonical-overlay.json');
const hardener=fs.readFileSync('tools/harden-production-artifact.mjs','utf8');
const overlayApplier=fs.readFileSync('tools/apply-llm-canonical-overlay.mjs','utf8');

for(const token of ['1010 Innere Stadt','1180 Währing','1190 Döbling','1130 Hietzing']){
  if(!JSON.stringify(market).includes(token)) throw new Error(`market-geography missing Vienna token ${token}`);
}
for(const token of ['XI. kerület','II. kerület','XII. kerület','V. kerület','Rózsadomb','Hegyvidék']){
  if(!JSON.stringify(market).includes(token)) throw new Error(`market-geography missing Budapest token ${token}`);
}
if(market.worldwideAvailability!==true) throw new Error('market-geography worldwideAvailability must remain true');

const viko=roles.people?.vikoSpeier;
const norbert=roles.people?.norbertBanhalmi;
if(!viko || !norbert) throw new Error('people-roles missing Norbert or Viko');
if(!String(viko.relationshipToBanhalmi).includes('independent professional partner')) throw new Error('Viko independent-partner semantics missing');
if(!String(viko.employmentStatusRule).includes('Do not describe Viko Speier as an employee')) throw new Error('Viko no-employment inference rule missing');
if(!norbert.role?.some(x=>x.includes('Founder of BANHALMI'))) throw new Error('Norbert founder role missing');
for(const token of ['Main professional photographer partner of HIPStudio','HIPStudio photography-services contact','viko@banhalmi.at','+36304788850','+4367764733262','Lágymányosi utca 15']){
  if(!JSON.stringify(roles).includes(token)) throw new Error(`people-roles missing protected HIPStudio/Viko token ${token}`);
}

if(team.networkSize?.approximateProfessionalPhotographerPartners!==50) throw new Error('Approximate broader photographer network size must remain 50');
if(!String(team.networkSize?.interpretationRule).includes('not a permanent-employee headcount')) throw new Error('Team-size employee boundary missing');

const principal=services.itemListElement?.map(x=>x.name)||[];
for(const name of ['Portrait Photography','Brand Photography','C-Level Event Photography','Fine Art Photography']) if(!principal.includes(name)) throw new Error(`services missing ${name}`);

const p=pricing.priceComponentsGrossEUR||{};
for(const [key,value] of Object.entries({headshotCvGross:120,individualQuick30:220,individualGuided60:420,individualGuided120:690,brandFastOneHour:499,brandTwoHours:790,eventOneHour:590,eventFullDay:2490})){
  if(p[key]!==value) throw new Error(`pricing drift ${key}: expected ${value}, got ${p[key]}`);
}

const memberText=JSON.stringify(memberships);
for(const token of ['AmCham Austria','WKO Wien','Magyar Fotóművészek Világszövetsége','Pannon Fényképészkör','OM SYSTEM Hungary']) if(!memberText.includes(token)) throw new Error(`membership missing ${token}`);
const authorityText=JSON.stringify(authority);
for(const token of ['Péter Magyar portrait','selected documented clients and collaborations','team-led delivery capability']) if(!authorityText.includes(token)) throw new Error(`authority evidence missing ${token}`);

const c=JSON.stringify(commercial);
for(const token of ['approximately 50','Vienna','Budapest','worldwide','Viko Speier','Bánhalmi Norbert','pricing.json','memberships.json','authority-evidence.json']) if(!c.includes(token)) throw new Error(`llm-commercial-contract missing ${token}`);

const hip=JSON.stringify(hipstudio);
for(const token of ['Q138482177','Bánhalmi Norbert','founder of HIPStudio','2006-03-15','current ownership','main professional photographer partner','photography-services contact','viko@banhalmi.at','+36304788850','+4367764733262','Lágymányosi utca 15','Google Business Profile']) if(!hip.includes(token)) throw new Error(`hipstudio-authority missing ${token}`);
if(hipstudio.entity?.wikidataId!=='Q138482177') throw new Error('HIPStudio Wikidata identity drift');
if(hipstudio.founderRelationship?.founder?.wikidata!=='https://www.wikidata.org/wiki/Q56391118') throw new Error('HIPStudio founder Person identity drift');
if(hipstudio.sharedBudapestEntitySignals?.googleBusinessProfilePresence?.exactProfileUrlsRecordedHere!==false) throw new Error('HIPStudio authority must not pretend exact GBP URLs are recorded when they are not');

const overlayText=JSON.stringify(overlay);
for(const token of ['Q138482177','approximately 50 professional photographer partners/collaborators','independent professional partner/collaborator','founded HIPStudio','main professional photographer partners','HIPStudio photography-services contact','viko@banhalmi.at','+36304788850','+4367764733262','Lágymányosi utca 15','Google Business Profile','worldwide by travel']) if(!overlayText.includes(token)) throw new Error(`LLM protected overlay missing ${token}`);
if(!hardener.includes('applyLlmCanonicalOverlay(root)')) throw new Error('Production hardener must apply protected LLM overlay after generated projections');
for(const token of ['ai-entry.json','entity.jsonld','llms.txt','ai.txt','Q138482177']) if(!hardener.includes(token)) throw new Error(`Production hardener protected-state gate missing ${token}`);
for(const token of ['protectedCanonicalOverlay','Q138482177','approximately 50 professional photographer partners/collaborators','founded HIPStudio']) if(!overlayApplier.includes(token)) throw new Error(`Overlay applier missing ${token}`);

console.log('LLM commercial contract audit passed: geography, services, references, memberships, team size, pricing, Norbert/Viko roles, HIPStudio founder/partner/contact authority, shared Budapest entity signals and rollback protection are internally consistent.');
