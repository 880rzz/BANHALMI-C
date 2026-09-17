import fs from 'node:fs';
import path from 'node:path';

// Permanent read-only gate for the merged three-language homepage positioning contract.
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages={
'index.html':{h1:'I photograph leaders and organisations for the places where their images actually need to work.',services:['Executive Portraiture','Brand Photography','C-Level Event Photography','Fine Art Photography'],ctas:['See portrait work ›','See brand photography ›','See event coverage ›','Explore fine-art work ›']},
'hu/index.html':{h1:'Vezetői portrék és vizuális pozicionálás vezetőknek és szervezeteknek.',services:['vezetői portréfotózás','brandfotózás','felsővezetői eseményfotózás','művészi fotográfia'],ctas:['Portrémunkák megtekintése ›','Brandfotózás megtekintése ›','Eseményfotózás megtekintése ›','Művészi munkák megtekintése ›']},
'de-at/index.html':{h1:'Ich fotografiere Führungskräfte und Organisationen für die Situationen, in denen ihre Bilder tatsächlich funktionieren müssen.',services:['Executive-Porträts','Brandfotografie','C-Level-Eventfotografie','Fine-Art-Fotografie'],ctas:['Porträtarbeiten ansehen ›','Brandfotografie ansehen ›','Eventreportagen ansehen ›','Fine-Art-Arbeiten ansehen ›']}
};
function textContent(fragment){
 return fragment.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}
for(const [relative,c] of Object.entries(pages)){
 const html=fs.readFileSync(path.join(root,relative),'utf8');
 const h1=(html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)||[''])[0];
 if(textContent(h1)!==c.h1) errors.push(`${relative}: clear homepage H1 missing or changed`);
 for(const s of c.services) if(!html.includes(s)) errors.push(`${relative}: principal service missing ${s}`);
 for(const t of c.ctas) if(!html.includes(t)) errors.push(`${relative}: unique CTA missing ${t}`);
 const old=[...html.matchAll(/<span class="more">(?:Read the approach|A megközelítés|Zur Arbeitsweise) ›<\/span>/g)];
 if(old.length) errors.push(`${relative}: repeated generic service CTA remains`);
 const cards=(html.match(/<section id="services">[\s\S]*?<\/section>/)||[''])[0];
 if((cards.match(/<a class="card reveal"/g)||[]).length!==4) errors.push(`${relative}: service card count is not four`);
 if(!html.includes('client-decision-bridge')) errors.push(`${relative}: client decision bridge missing`);
 if(html.includes('strategic-positioning-summary')) errors.push(`${relative}: obsolete strategic summary remains`);
}
const services=JSON.parse(fs.readFileSync(path.join(root,'services.json'),'utf8'));
if(services.numberOfItems!==4 || services.itemListElement?.length!==4) errors.push('services.json: principal service count is not four');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-three homepage positioning audit passed: three languages, four principal services, exact visible H1 text and unique service CTAs are aligned.');
