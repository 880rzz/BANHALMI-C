import fs from 'node:fs';
import path from 'node:path';

// Permanent read-only gate for the concrete strategic-partnership contract.
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
  ['portrait/index.html','What the partnership includes','Visual brief','Use map','Structured selection'],
  ['lifestyle/index.html','What the partnership includes','Visual brief','Use map','Structured selection'],
  ['event-photography/index.html','What the partnership includes','Visual brief','Use map','Structured selection'],
  ['hu/portre/index.html','Mit jelent a partnerség a gyakorlatban?','Vizuális projektleírás','Felhasználási térkép','Strukturált válogatás'],
  ['hu/brand/index.html','Mit jelent a partnerség a gyakorlatban?','Vizuális projektleírás','Felhasználási térkép','Strukturált válogatás'],
  ['hu/rendezvenyfotozas/index.html','Mit jelent a partnerség a gyakorlatban?','Vizuális projektleírás','Felhasználási térkép','Strukturált válogatás'],
  ['de-at/portrait/index.html','Was die Partnerschaft konkret umfasst','Visuelles Briefing','Einsatzplan','Strukturierte Auswahl'],
  ['de-at/brand/index.html','Was die Partnerschaft konkret umfasst','Visuelles Briefing','Einsatzplan','Strukturierte Auswahl'],
  ['de-at/eventfotografie/index.html','Was die Partnerschaft konkret umfasst','Visuelles Briefing','Einsatzplan','Strukturierte Auswahl']
];

for(const [relative,...phrases] of pages){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if((html.match(/data-strategic-partnership="concrete"/g)||[]).length!==1) errors.push(`${relative}: concrete partnership section must appear exactly once`);
  for(const phrase of phrases) if(!html.includes(phrase)) errors.push(`${relative}: missing ${phrase}`);
  const section=(html.match(/<section class="section-band partnership-deliverables"[\s\S]*?<\/section>/)||[''])[0];
  if((section.match(/<article class="card">/g)||[]).length!==6) errors.push(`${relative}: partnership section must contain six concrete steps`);
  if(/premium visual|prémium vizuális|hochwertige visuelle/i.test(section)) errors.push(`${relative}: generic premium language remains in concrete section`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-four strategic partnership audit passed across nine service pages and three languages.');
