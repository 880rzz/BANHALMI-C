import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
 ['portrait/index.html','Approval, confidentiality and publication','authorised approver','confidential by default','written permission'],
 ['lifestyle/index.html','Approval, confidentiality and publication','authorised approver','confidential by default','written permission'],
 ['event-photography/index.html','Approval, confidentiality and publication','authorised approver','confidential by default','written permission'],
 ['faq/index.html','Approval, confidentiality and publication','authorised approver','confidential by default','written permission'],
 ['terms-conditions/index.html','Approval, confidentiality and publication','authorised approver','confidential by default','written permission'],
 ['hu/portre/index.html','Jóváhagyás, titoktartás és publikálás','jóváhagyásra jogosult személy','alapértelmezetten bizalmas','írásos engedély'],
 ['hu/brand/index.html','Jóváhagyás, titoktartás és publikálás','jóváhagyásra jogosult személy','alapértelmezetten bizalmas','írásos engedély'],
 ['hu/rendezvenyfotozas/index.html','Jóváhagyás, titoktartás és publikálás','jóváhagyásra jogosult személy','alapértelmezetten bizalmas','írásos engedély'],
 ['hu/gyik/index.html','Jóváhagyás, titoktartás és publikálás','jóváhagyásra jogosult személy','alapértelmezetten bizalmas','írásos engedély'],
 ['hu/aszf/index.html','Jóváhagyás, titoktartás és publikálás','jóváhagyásra jogosult személy','alapértelmezetten bizalmas','írásos engedély'],
 ['de-at/portrait/index.html','Freigabe, Vertraulichkeit und Veröffentlichung','freigabeberechtigte Person','standardmäßig vertraulich','schriftlich'],
 ['de-at/brand/index.html','Freigabe, Vertraulichkeit und Veröffentlichung','freigabeberechtigte Person','standardmäßig vertraulich','schriftlich'],
 ['de-at/eventfotografie/index.html','Freigabe, Vertraulichkeit und Veröffentlichung','freigabeberechtigte Person','standardmäßig vertraulich','schriftlich'],
 ['de-at/faq/index.html','Freigabe, Vertraulichkeit und Veröffentlichung','freigabeberechtigte Person','standardmäßig vertraulich','schriftlich'],
 ['de-at/agb/index.html','Freigabe, Vertraulichkeit und Veröffentlichung','freigabeberechtigte Person','standardmäßig vertraulich','schriftlich']
];
for(const [relative,heading,approver,confidential,permission] of pages){
 const file=path.join(root,relative);
 if(!fs.existsSync(file)){errors.push(`${relative}: missing file`);continue;}
 const html=fs.readFileSync(file,'utf8');
 if((html.match(/data-governance-confidentiality="stage10"/g)||[]).length!==1) errors.push(`${relative}: governance block must appear exactly once`);
 const section=(html.match(/<section class="section-band governance-confidentiality"[\s\S]*?<\/section>/)||[''])[0];
 for(const token of [heading,approver,confidential,permission]) if(!section.includes(token)) errors.push(`${relative}: missing ${token}`);
 if((section.match(/<article class="card reveal">/g)||[]).length!==4) errors.push(`${relative}: expected four governance cards`);
 if(!/single consolidated feedback|egyetlen összevont visszajelzés|gebündelte Rückmeldung/.test(section)) errors.push(`${relative}: consolidated feedback rule missing`);
 if(!/third part|harmadik fél|Dritte/.test(section)) errors.push(`${relative}: third-party rule missing`);
 const marker=html.indexOf('data-governance-confidentiality="stage10"');
 const mainClose=html.lastIndexOf('</main>');
 if(marker<0 || marker>mainClose) errors.push(`${relative}: block must stay inside main`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-ten governance and confidentiality audit passed across fifteen pages and three languages.');
