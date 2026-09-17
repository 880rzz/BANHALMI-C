import fs from 'node:fs';
import path from 'node:path';

// Permanent read-only contract for localized, verifiable trust evidence.
// This file provides the post-migration and future regression gate.
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
  ['portrait/index.html','Evidence behind the work','Peter-Magyar-portrait-2026.jpg','/partners/'],
  ['lifestyle/index.html','Evidence behind the work','milcclub.com/ambassadors','/partners/'],
  ['event-photography/index.html','Evidence behind the work','amcham.at/members-list/','/partners/'],
  ['hu/portre/index.html','A munka mögötti bizonyítékok','Peter-Magyar-portrait-2026.jpg','/hu/partnerek/'],
  ['hu/brand/index.html','A munka mögötti bizonyítékok','milcclub.com/ambassadors','/hu/partnerek/'],
  ['hu/rendezvenyfotozas/index.html','A munka mögötti bizonyítékok','amcham.at/members-list/','/hu/partnerek/'],
  ['de-at/portrait/index.html','Nachweise hinter der Arbeit','Peter-Magyar-portrait-2026.jpg','/de-at/partner/'],
  ['de-at/brand/index.html','Nachweise hinter der Arbeit','milcclub.com/ambassadors','/de-at/partner/'],
  ['de-at/eventfotografie/index.html','Nachweise hinter der Arbeit','amcham.at/members-list/','/de-at/partner/']
];
for(const [relative,heading,proof,partner] of pages){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if((html.match(/data-trust-proof="stage6"/g)||[]).length!==1) errors.push(`${relative}: trust proof block must appear exactly once`);
  const section=(html.match(/<section class="section-band trust-proof"[\s\S]*?<\/section>/)||[''])[0];
  if(!section.includes(heading)) errors.push(`${relative}: localized trust proof heading missing`);
  if((section.match(/<article class="card">/g)||[]).length!==3) errors.push(`${relative}: trust proof block must contain exactly three evidence cards`);
  if(!section.includes(proof)) errors.push(`${relative}: service-specific proof missing ${proof}`);
  if(!section.includes(partner)) errors.push(`${relative}: localized partner register link missing`);
  if(!section.includes('firmen.wko.at')) errors.push(`${relative}: WKO evidence link missing`);
  if(!section.includes('amcham.at/members-list/')) errors.push(`${relative}: AmCham evidence link missing`);
  const lower=section.toLowerCase();
  const disclaimerOk=relative.startsWith('hu/')
    ? /(nem ajánl|nem támogatói nyilatkozat|nem jelent ajánlást)/.test(lower)
    : relative.startsWith('de-at/')
      ? /(keine empfehlung|keine unterstützung|keine empfehlungsliste)/.test(lower)
      : /(not an endorsement|does not imply endorsement|not an endorsement list)/.test(lower);
  if(!disclaimerOk) errors.push(`${relative}: collaboration-versus-endorsement clarification missing`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-six trust proof audit passed across nine service pages and three languages.');
