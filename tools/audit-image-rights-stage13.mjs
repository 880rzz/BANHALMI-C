import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
  ['portrait/index.html','Image use, approvals and reference rights','Agreed use','People and permissions','Approval before release','Portfolio and later restrictions'],
  ['lifestyle/index.html','Image use, approvals and reference rights','Agreed use','People and permissions','Approval before release','Portfolio and later restrictions'],
  ['event-photography/index.html','Image use, approvals and reference rights','Agreed use','People and permissions','Approval before release','Portfolio and later restrictions'],
  ['faq/index.html','Image use, approvals and reference rights','Agreed use','People and permissions','Approval before release','Portfolio and later restrictions'],
  ['privacy-policy/index.html','Image use, approvals and reference rights','Agreed use','People and permissions','Approval before release','Portfolio and later restrictions'],
  ['terms-conditions/index.html','Image use, approvals and reference rights','Agreed use','People and permissions','Approval before release','Portfolio and later restrictions'],
  ['hu/portre/index.html','Képfelhasználás, jóváhagyás és referenciajog','Egyeztetett felhasználás','Szereplők és hozzájárulások','Jóváhagyás publikálás előtt','Portfólió és későbbi korlátozás'],
  ['hu/brand/index.html','Képfelhasználás, jóváhagyás és referenciajog','Egyeztetett felhasználás','Szereplők és hozzájárulások','Jóváhagyás publikálás előtt','Portfólió és későbbi korlátozás'],
  ['hu/rendezvenyfotozas/index.html','Képfelhasználás, jóváhagyás és referenciajog','Egyeztetett felhasználás','Szereplők és hozzájárulások','Jóváhagyás publikálás előtt','Portfólió és későbbi korlátozás'],
  ['hu/gyik/index.html','Képfelhasználás, jóváhagyás és referenciajog','Egyeztetett felhasználás','Szereplők és hozzájárulások','Jóváhagyás publikálás előtt','Portfólió és későbbi korlátozás'],
  ['hu/adatvedelem/index.html','Képfelhasználás, jóváhagyás és referenciajog','Egyeztetett felhasználás','Szereplők és hozzájárulások','Jóváhagyás publikálás előtt','Portfólió és későbbi korlátozás'],
  ['hu/aszf/index.html','Képfelhasználás, jóváhagyás és referenciajog','Egyeztetett felhasználás','Szereplők és hozzájárulások','Jóváhagyás publikálás előtt','Portfólió és későbbi korlátozás'],
  ['de-at/portrait/index.html','Bildnutzung, Freigaben und Referenzrechte','Vereinbarte Nutzung','Abgebildete Personen und Einwilligungen','Freigabe vor Veröffentlichung','Portfolio und spätere Einschränkungen'],
  ['de-at/brand/index.html','Bildnutzung, Freigaben und Referenzrechte','Vereinbarte Nutzung','Abgebildete Personen und Einwilligungen','Freigabe vor Veröffentlichung','Portfolio und spätere Einschränkungen'],
  ['de-at/eventfotografie/index.html','Bildnutzung, Freigaben und Referenzrechte','Vereinbarte Nutzung','Abgebildete Personen und Einwilligungen','Freigabe vor Veröffentlichung','Portfolio und spätere Einschränkungen'],
  ['de-at/faq/index.html','Bildnutzung, Freigaben und Referenzrechte','Vereinbarte Nutzung','Abgebildete Personen und Einwilligungen','Freigabe vor Veröffentlichung','Portfolio und spätere Einschränkungen'],
  ['de-at/datenschutz/index.html','Bildnutzung, Freigaben und Referenzrechte','Vereinbarte Nutzung','Abgebildete Personen und Einwilligungen','Freigabe vor Veröffentlichung','Portfolio und spätere Einschränkungen'],
  ['de-at/agb/index.html','Bildnutzung, Freigaben und Referenzrechte','Vereinbarte Nutzung','Abgebildete Personen und Einwilligungen','Freigabe vor Veröffentlichung','Portfolio und spätere Einschränkungen']
];

for(const [relative,...tokens] of pages){
  const file=path.join(root,relative);
  if(!fs.existsSync(file)){errors.push(`${relative}: missing file`);continue;}
  const html=fs.readFileSync(file,'utf8');
  if((html.match(/data-image-rights="stage13"/g)||[]).length!==1) errors.push(`${relative}: image-rights block must appear exactly once`);
  const section=(html.match(/<section class="section-band image-rights-clarity"[\s\S]*?<\/section>/)||[''])[0];
  for(const token of tokens) if(!section.includes(token)) errors.push(`${relative}: missing ${token}`);
  if((section.match(/<article class="card reveal">/g)||[]).length!==4) errors.push(`${relative}: expected four image-rights cards`);
  if(!/does not by itself authorise BANHALMI|önmagában nem jogosítja fel a BANHALMI-t|allein berechtigt BANHALMI nicht/.test(section)) errors.push(`${relative}: independent portfolio permission rule missing`);
  if(!/Contact sheets|kontaktívek|Kontaktbögen/.test(section)) errors.push(`${relative}: preview publication restriction missing`);
  if(!/later restriction or removal request|Későbbi korlátozási vagy eltávolítási kérelem|spätere Einschränkung oder Entfernung/.test(section)) errors.push(`${relative}: later restriction route missing`);
  const marker=html.indexOf('data-image-rights="stage13"');
  const mainClose=html.lastIndexOf('</main>');
  if(marker<0 || marker>mainClose) errors.push(`${relative}: image-rights block must stay inside main`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-thirteen image-rights audit passed across eighteen pages and three languages.');
