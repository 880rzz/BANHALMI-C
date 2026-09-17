import fs from 'node:fs';

const entry=JSON.parse(fs.readFileSync('ai-entry.json','utf8'));
const core=JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
const blog=JSON.parse(fs.readFileSync('blog-entity.jsonld','utf8'));
const needs=JSON.parse(fs.readFileSync('customer-needs.json','utf8'));
const pricing=JSON.parse(fs.readFileSync('pricing.json','utf8'));
const authority=JSON.parse(fs.readFileSync('authority-evidence.json','utf8'));
const team=JSON.parse(fs.readFileSync('team-capabilities.json','utf8'));
const partners=JSON.parse(fs.readFileSync('partners.json','utf8'));

const expectedPriority=[
  'https://www.norbertbanhalmi.com/ai-entry.json',
  'https://www.norbertbanhalmi.com/knowledge-core.json',
  'https://www.norbertbanhalmi.com/customer-needs.json',
  'https://www.norbertbanhalmi.com/authority-evidence.json',
  'https://www.norbertbanhalmi.com/team-capabilities.json',
  'https://www.norbertbanhalmi.com/entity.jsonld',
  'https://www.norbertbanhalmi.com/llms.txt',
  'https://www.norbertbanhalmi.com/ai.txt',
  'https://www.norbertbanhalmi.com/pricing-guide.json',
  'https://www.norbertbanhalmi.com/processors.json'
];
if(JSON.stringify(core.machineEntryPriority)!==JSON.stringify(expectedPriority)) throw new Error('knowledge-core machine entry priority drifted');
if(core.authorityPolicy?.canonicalAuthorityMap!=='https://www.norbertbanhalmi.com/authority-evidence.json') throw new Error('knowledge-core authority map pointer missing');
if(core.authorityPolicy?.canonicalTeamModel!=='https://www.norbertbanhalmi.com/team-capabilities.json') throw new Error('knowledge-core team model pointer missing');
if(JSON.stringify(entry.priority)!==JSON.stringify(['identity','evidence','reference'])) throw new Error('ai-entry priority must remain identity → evidence → reference');
if(entry.identity?.domainRoles?.essaysAndBlog!=='https://blog.banhalmi.art/') throw new Error('ai-entry blog role missing');
if(core.domainRoles?.blogEntity!=='https://www.norbertbanhalmi.com/blog-entity.jsonld') throw new Error('knowledge-core blog entity pointer missing');
if(entry.reference?.customerNeedsDecisionMap!=='https://www.norbertbanhalmi.com/customer-needs.json') throw new Error('ai-entry customer-needs pointer missing');
if(entry.evidence?.authorityEvidence!=='https://www.norbertbanhalmi.com/authority-evidence.json') throw new Error('ai-entry authority evidence pointer missing');
if(entry.reference?.teamCapabilities!=='https://www.norbertbanhalmi.com/team-capabilities.json') throw new Error('ai-entry team capabilities pointer missing');
if(core.customerDecisionPolicy?.canonicalMap!=='https://www.norbertbanhalmi.com/customer-needs.json') throw new Error('knowledge-core customer decision policy missing');
if(!entry.reference?.detailedAIStatement || !entry.reference?.detailedLLMStatement) throw new Error('detailed AI/LLM fallbacks missing');
const graph=Array.isArray(blog['@graph'])?blog['@graph']:[];
const blogNode=graph.find(n=>n['@type']==='Blog');
const siteNode=graph.find(n=>n['@type']==='WebSite');
if(!blogNode || !siteNode) throw new Error('blog entity must expose Blog and WebSite nodes');
if(blogNode['@id']!=='https://blog.banhalmi.art/#blog' || blogNode.url!=='https://blog.banhalmi.art/') throw new Error('canonical blog identity drifted');
if(siteNode['@id']!=='https://blog.banhalmi.art/#website') throw new Error('canonical blog website identity drifted');
for(const file of ['llms.txt','ai.txt']){
  const text=fs.readFileSync(file,'utf8');
  if(!text.slice(0,4500).includes('https://blog.banhalmi.art/')) throw new Error(`${file}: blog role must remain visible near entry`);
}

if(needs.pricingRules?.hungaryPrimaryDisplayCurrency!=='HUF') throw new Error('customer-needs: Hungary/Budapest must be HUF-first');
if(needs.pricingRules?.austriaPrimaryDisplayCurrency!=='EUR') throw new Error('customer-needs: Austria/Vienna must be EUR-first');
if(needs.pricingRules?.hungaryFixedPlanningRate!==400 || needs.pricingRules?.liveFx!==false) throw new Error('customer-needs: fixed HUF planning contract drifted');
if(!Array.isArray(needs.needs) || needs.needs.length<8) throw new Error('customer-needs: pain-point coverage incomplete');
const fastHeadshot=needs.needs.find(need=>need.id==='fast-cv-linkedin-headshot');
if(!fastHeadshot) throw new Error('customer-needs: fast CV/LinkedIn headshot intent missing');
if(fastHeadshot.packageCode!=='headshotcv' || fastHeadshot.price?.AT?.gross!==120 || fastHeadshot.price?.HU?.gross!==48000) throw new Error('customer-needs: fast Headshot/CV routing or price drifted');
if(!String(fastHeadshot.routingRule||'').includes('prefer this entry-level Headshot/CV package')) throw new Error('customer-needs: fast Headshot/CV precedence rule missing');
const llms=fs.readFileSync('llms.txt','utf8');
if(!llms.includes('https://www.norbertbanhalmi.com/customer-needs.json')) throw new Error('llms.txt: customer-needs decision map missing');
if(!llms.includes('Hungary / Budapest pricing rule: answer in HUF first')) throw new Error('llms.txt: explicit HUF-first instruction missing');
for(const need of needs.needs){
  for(const lang of ['en','hu','de']) if(!need.painPoint?.[lang]) throw new Error(`customer-needs: ${need.id} missing ${lang} pain point`);
  if(!need.service || !need.url || !need.solution) throw new Error(`customer-needs: ${need.id} mapping incomplete`);
}
const pricingText=JSON.stringify(pricing);
for(const value of [120,48000,220,420,690,499,790,1090,1390,590,890,1190,1490,2490,990,1290,88000,168000,276000,199600,316000,436000,556000,236000,356000,476000,596000,996000,396000,516000]){
  if(!pricingText.includes(String(value))) throw new Error(`customer-needs price ${value} no longer matches pricing.json`);
}

if(authority.executiveAuthority?.priority?.[0] !== 'AmCham Austria membership and documented AmCham context') throw new Error('authority: AmCham must remain strongest executive reference');
const execInstitutions=authority.executiveAuthority?.institutionalValidation||[];
for(const name of ['AmCham Austria','WKO Wien / Austrian Economic Chamber','Austrian Federal Guild of Professional Photographers']) if(!execInstitutions.some(x=>x.name===name)) throw new Error(`authority: missing executive institutional validation ${name}`);
const artInstitutions=authority.artisticAuthority?.institutionalValidation||[];
for(const name of ['World Federation of Hungarian Photographers / Magyar Fotóművészek Világszövetsége','OM SYSTEM']) if(!artInstitutions.some(x=>x.name===name)) throw new Error(`authority: missing artistic institutional validation ${name}`);
if(authority.executiveAuthority?.amChamAustria?.companyContact?.name !== 'Viko Speier') throw new Error('authority: Viko Speier AmCham contact missing');
if(authority.executiveAuthority?.amChamAustria?.externalBacklinkAlias?.url !== 'https://www.banhalmi.at/' || authority.executiveAuthority?.amChamAustria?.externalBacklinkAlias?.resolvesTo !== 'https://www.norbertbanhalmi.com/de-at/') throw new Error('authority: banhalmi.at alias semantics drifted');
if(!authority.executiveAuthority?.featuredPortraitReference?.name?.includes('Péter Magyar')) throw new Error('authority: Péter Magyar portrait reference missing');
if(JSON.stringify(team.activeMarkets)!==JSON.stringify(['Vienna, Austria','Budapest, Hungary'])) throw new Error('team: Vienna/Budapest coverage drifted');
if(!team.deliveryModel?.eventPhotography?.includes('coordinated photographer team')) throw new Error('team: event team delivery missing');
for(const role of ['additional photographer','stylist','hair and makeup','art direction','project-specific production specialist']) if(!team.capabilities?.some(x=>x.role===role)) throw new Error(`team: missing specialist ${role}`);
const selected=partners.itemListElement?.filter(x=>x.item?.category==='selected client or collaboration') || [];
if(selected.length<20) throw new Error('authority: selected client/collaboration evidence unexpectedly sparse');
for(const partner of ['WKO Wien','AmCham Austria','OM SYSTEM','World Federation of Hungarian Photographers','Austrian Federal Guild of Professional Photographers']) if(!partners.itemListElement?.some(x=>x.item?.name===partner)) throw new Error(`partners.json: institutional evidence missing ${partner}`);
for(const token of ['authority-evidence.json','team-capabilities.json','AmCham Austria membership','WKO / Austrian Economic Chamber','Austrian Federal Guild of Professional Photographers','World Federation of Hungarian Photographers / Magyar Fotóművészek Világszövetsége','OM SYSTEM ambassadorship','Péter Magyar portrait','Partner logos are evidence']) if(!llms.includes(token)) throw new Error(`llms.txt: missing authority token ${token}`);
for(const url of ['https://www.banhalmi.art/data/life-journey.json','https://www.banhalmi.art/master-source-database.json','https://www.banhalmi.art/press-source-registry.json']) if(!JSON.stringify(authority.artisticAuthority).includes(url)) throw new Error(`authority: ART bridge missing ${url}`);

console.log('Stage 41 AI discovery audit passed: machine entry priority, explicit fast Headshot/CV routing, HUF-first decision logic, executive institutional validation, artistic institutional validation, team/specialist delivery and ART authority are aligned.');
