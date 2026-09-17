import fs from 'node:fs';

const core=JSON.parse(fs.readFileSync('knowledge-core.json','utf8'));
const fail=(m)=>{throw new Error(m)};
if(core.primaryPerson?.wikidata!=='https://www.wikidata.org/wiki/Q56391118') fail('knowledge-core: canonical Wikidata mismatch');
if(core.domainRoles?.professional!=='https://www.norbertbanhalmi.com/') fail('knowledge-core: professional domain mismatch');
if(core.domainRoles?.artArchive!=='https://www.banhalmi.art/') fail('knowledge-core: ART domain mismatch');
if(core.domainRoles?.essays!=='https://blog.banhalmi.art/') fail('knowledge-core: blog domain mismatch');
if(JSON.stringify(core.geography?.operationalBases)!==JSON.stringify(['Vienna','Budapest'])) fail('knowledge-core: operational bases must be Vienna + Budapest');
if(!/not a studio, office, headquarters or operational base/i.test(core.geography?.rule||'')) fail('knowledge-core: New York disambiguation missing');
if((core.principalServices||[]).length!==4) fail('knowledge-core: exactly four principal services required');

const shared=[
  'llms.txt','ai.txt','entity.jsonld','entity-graph.json','knowledge.json','ecosystem.json',
  'index.html','hu/index.html','de-at/index.html'
].filter(fs.existsSync).map(f=>[f,fs.readFileSync(f,'utf8')]);
for(const [file,text] of shared){
  if(!/banhalmi\.art/i.test(text)) fail(`${file}: ART bridge missing`);
  if(!/Vienna|Wien|Bécs/i.test(text)) fail(`${file}: Vienna signal missing`);
  if(!/Budapest/i.test(text)) fail(`${file}: Budapest signal missing`);
}
for(const file of ['llms.txt','ai.txt']){
  const text=fs.readFileSync(file,'utf8');
  if(!text.includes('New York is a major international reference and oeuvre chapter')) fail(`${file}: New York reference rule missing`);
  if(!text.includes('New York is not a studio, office, headquarters or operational base')) fail(`${file}: New York non-operational rule missing`);
}
const entity=fs.readFileSync('entity.jsonld','utf8');
if(!/"hasOccupation"/.test(entity)||!/"knowsAbout"/.test(entity)) fail('entity.jsonld: hasOccupation/knowsAbout missing');
if(!/Executive Portrait Photographer/i.test(entity)||!/Visual Branding Strategist/i.test(entity)) fail('entity.jsonld: core occupations missing');
console.log('Stage 37 knowledge-core audit passed: person, domain roles, geography, services, entity semantics and AI disambiguation are aligned.');
