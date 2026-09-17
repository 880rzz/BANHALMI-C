import fs from 'node:fs';
import path from 'node:path';

// Permanent read-only regression contract for delivery scope, approvals and timing.
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
 ['portrait/index.html','What arrives, when it arrives and how it can be used','high-resolution master files','web-ready versions','Urgent or same-day delivery'],
 ['lifestyle/index.html','What arrives, when it arrives and how it can be used','high-resolution master files','web-ready versions','Urgent or same-day delivery'],
 ['event-photography/index.html','What arrives, when it arrives and how it can be used','high-resolution master files','web-ready versions','Urgent or same-day delivery'],
 ['faq/index.html','What arrives, when it arrives and how it can be used','high-resolution master files','web-ready versions','Urgent or same-day delivery'],
 ['hu/portre/index.html','Mit kap kézhez az ügyfél, mikor és milyen felhasználásra?','nagy felbontású mesterfájlként','webre optimalizált','Sürgős vagy aznapi átadás'],
 ['hu/brand/index.html','Mit kap kézhez az ügyfél, mikor és milyen felhasználásra?','nagy felbontású mesterfájlként','webre optimalizált','Sürgős vagy aznapi átadás'],
 ['hu/rendezvenyfotozas/index.html','Mit kap kézhez az ügyfél, mikor és milyen felhasználásra?','nagy felbontású mesterfájlként','webre optimalizált','Sürgős vagy aznapi átadás'],
 ['hu/gyik/index.html','Mit kap kézhez az ügyfél, mikor és milyen felhasználásra?','nagy felbontású mesterfájlként','webre optimalizált','Sürgős vagy aznapi átadás'],
 ['de-at/portrait/index.html','Was geliefert wird, wann es geliefert wird und wofür es eingesetzt werden kann','hochauflösende Masterdateien','weboptimierte Versionen','Eilige oder taggleiche Lieferung'],
 ['de-at/brand/index.html','Was geliefert wird, wann es geliefert wird und wofür es eingesetzt werden kann','hochauflösende Masterdateien','weboptimierte Versionen','Eilige oder taggleiche Lieferung'],
 ['de-at/eventfotografie/index.html','Was geliefert wird, wann es geliefert wird und wofür es eingesetzt werden kann','hochauflösende Masterdateien','weboptimierte Versionen','Eilige oder taggleiche Lieferung'],
 ['de-at/faq/index.html','Was geliefert wird, wann es geliefert wird und wofür es eingesetzt werden kann','hochauflösende Masterdateien','weboptimierte Versionen','Eilige oder taggleiche Lieferung']
];
for(const [relative,heading,master,web,urgent] of pages){
 const html=fs.readFileSync(path.join(root,relative),'utf8');
 if((html.match(/data-delivery-system="stage9"/g)||[]).length!==1) errors.push(`${relative}: delivery block must appear exactly once`);
 const section=(html.match(/<section class="section-band delivery-system"[\s\S]*?<\/section>/)||[''])[0];
 for(const token of [heading,master,web,urgent]) if(!section.includes(token)) errors.push(`${relative}: missing ${token}`);
 if((section.match(/<article class="card reveal">/g)||[]).length!==4) errors.push(`${relative}: expected four delivery cards`);
 if(!/accepted written offer|elfogadott írásos ajánlat|angenommene schriftliche Angebot/.test(section)) errors.push(`${relative}: written timing contract missing`);
 if(!/preview|előnézet|Vorschau/.test(section)) errors.push(`${relative}: preview stage missing`);
 if(!/selection|válogatás|Auswahl/.test(section)) errors.push(`${relative}: selection stage missing`);
 if(!/final[- ]delivery|végleges átadás|finale Übergabe|finale Liefertermine/.test(section)) errors.push(`${relative}: final delivery stage missing`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-nine delivery audit passed across twelve pages and three languages.');
