import fs from 'node:fs';
import path from 'node:path';

// Permanent read-only contract for pricing, scope, tax and usage-right clarity.
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
 ['portrait/index.html',3,'What the project fee covers','unlimited in time and territory','Vienna and Budapest','/requestaquote/','/terms-conditions/'],
 ['lifestyle/index.html',3,'What the project fee covers','unlimited in time and territory','Vienna and Budapest','/requestaquote/','/terms-conditions/'],
 ['event-photography/index.html',3,'What the project fee covers','unlimited in time and territory','Vienna and Budapest','/requestaquote/','/terms-conditions/'],
 ['requestaquote/index.html',4,'What the project fee covers','unlimited in time and territory','Vienna and Budapest','/requestaquote/','/terms-conditions/'],
 ['faq/index.html',4,'What the project fee covers','unlimited in time and territory','Vienna and Budapest','/requestaquote/','/terms-conditions/'],
 ['terms-conditions/index.html',4,'What the project fee covers','unlimited in time and territory','Vienna and Budapest','/requestaquote/','/terms-conditions/'],
 ['hu/portre/index.html',3,'Mit tartalmaz a projekt díja?','időben és területileg korlátlan','Bécs és Budapest','/hu/ajanlatkeres/','/hu/aszf/'],
 ['hu/brand/index.html',3,'Mit tartalmaz a projekt díja?','időben és területileg korlátlan','Bécs és Budapest','/hu/ajanlatkeres/','/hu/aszf/'],
 ['hu/rendezvenyfotozas/index.html',3,'Mit tartalmaz a projekt díja?','időben és területileg korlátlan','Bécs és Budapest','/hu/ajanlatkeres/','/hu/aszf/'],
 ['hu/ajanlatkeres/index.html',4,'Mit tartalmaz a projekt díja?','időben és területileg korlátlan','Bécs és Budapest','/hu/ajanlatkeres/','/hu/aszf/'],
 ['hu/gyik/index.html',4,'Mit tartalmaz a projekt díja?','időben és területileg korlátlan','Bécs és Budapest','/hu/ajanlatkeres/','/hu/aszf/'],
 ['hu/aszf/index.html',4,'Mit tartalmaz a projekt díja?','időben és területileg korlátlan','Bécs és Budapest','/hu/ajanlatkeres/','/hu/aszf/'],
 ['de-at/portrait/index.html',3,'Was das Projekthonorar umfasst','zeitlich und räumlich unbeschränkt','Wien und Budapest','/de-at/anfrage/','/de-at/agb/'],
 ['de-at/brand/index.html',3,'Was das Projekthonorar umfasst','zeitlich und räumlich unbeschränkt','Wien und Budapest','/de-at/anfrage/','/de-at/agb/'],
 ['de-at/eventfotografie/index.html',3,'Was das Projekthonorar umfasst','zeitlich und räumlich unbeschränkt','Wien und Budapest','/de-at/anfrage/','/de-at/agb/'],
 ['de-at/anfrage/index.html',4,'Was das Projekthonorar umfasst','zeitlich und räumlich unbeschränkt','Wien und Budapest','/de-at/anfrage/','/de-at/agb/'],
 ['de-at/faq/index.html',4,'Was das Projekthonorar umfasst','zeitlich und räumlich unbeschränkt','Wien und Budapest','/de-at/anfrage/','/de-at/agb/'],
 ['de-at/agb/index.html',4,'Was das Projekthonorar umfasst','zeitlich und räumlich unbeschränkt','Wien und Budapest','/de-at/anfrage/','/de-at/agb/']
];

for(const [relative,count,heading,licence,locations,quote,terms] of pages){
 const file=path.join(root,relative);
 if(!fs.existsSync(file)){errors.push(`${relative}: file missing`);continue;}
 const html=fs.readFileSync(file,'utf8');
 if((html.match(/data-pricing-licensing="stage7"/g)||[]).length!==1) errors.push(`${relative}: pricing/licensing block must appear exactly once`);
 const section=(html.match(/<section class="section-band pricing-licensing-clarity"[\s\S]*?<\/section>/)||[''])[0];
 if(!section.includes(heading)) errors.push(`${relative}: localized heading missing`);
 if((section.match(/<article class="card">/g)||[]).length!==count) errors.push(`${relative}: expected ${count} pricing cards`);
 for(const token of [licence,locations,quote,terms]) if(!section.includes(token)) errors.push(`${relative}: missing ${token}`);
 if(!/non-binding estimate|nem kötelező érvényű irányár|unverbindliche Orientierung/.test(section)) errors.push(`${relative}: estimate status is unclear`);
 if(!/Copyright remains with the photographer|szerzői jog a fotósnál marad|Urheberrecht bleibt beim Fotografen/.test(section)) errors.push(`${relative}: copyright ownership is unclear`);
}

for(const relative of ['requestaquote/index.html','hu/ajanlatkeres/index.html','de-at/anfrage/index.html']){
 const html=fs.readFileSync(path.join(root,relative),'utf8');
 for(const token of ['data-estimate-gross','data-estimate-net','data-estimate-vat']) if(!html.includes(token)) errors.push(`${relative}: quote total token missing ${token}`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-seven pricing and licensing audit passed across 18 pages and three languages.');
