import fs from 'node:fs';
import path from 'node:path';

// Permanent read-only gate for the three-way contact and quote decision path.
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=['portrait/index.html','lifestyle/index.html','event-photography/index.html','hu/portre/index.html','hu/brand/index.html','hu/rendezvenyfotozas/index.html','de-at/portrait/index.html','de-at/brand/index.html','de-at/eventfotografie/index.html','contact/index.html','hu/kapcsolat/index.html','de-at/kontakt/index.html'];
for(const relative of pages){
 const html=fs.readFileSync(path.join(root,relative),'utf8');
 if((html.match(/data-conversion-path="stage5"/g)||[]).length!==1) errors.push(`${relative}: conversion selector must appear exactly once`);
 const section=(html.match(/<section class="section-band next-step-selector"[\s\S]*?<\/section>/)||[''])[0];
 if((section.match(/<article class="card">/g)||[]).length!==3) errors.push(`${relative}: conversion selector must contain three choices`);
 if(!section.includes('meet.bookipi.com/zk5ly35r')) errors.push(`${relative}: booking link missing`);
 if(relative.startsWith('hu/')&&!section.includes('A foglalási felület angol nyelvű.')) errors.push(`${relative}: Hungarian English-interface notice missing`);
 if(relative.startsWith('de-at/')&&!section.includes('Die Buchungsoberfläche ist auf Englisch.')) errors.push(`${relative}: German English-interface notice missing`);
}
for(const relative of ['requestaquote/index.html','hu/ajanlatkeres/index.html','de-at/anfrage/index.html']){
 const html=fs.readFileSync(path.join(root,relative),'utf8');
 for(const token of ['data-quote-root','data-estimate-gross','data-estimate-net','data-estimate-vat']) if(!html.includes(token)) errors.push(`${relative}: quote interface token missing ${token}`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-five conversion audit passed across 12 decision pages and 3 quote pages.');
