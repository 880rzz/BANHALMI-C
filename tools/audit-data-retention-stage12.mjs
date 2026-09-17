import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
  ['portrait/index.html','Storage, access and deletion','Controlled access','Delivered files and working files','Retention and backup','Deletion requests'],
  ['lifestyle/index.html','Storage, access and deletion','Controlled access','Delivered files and working files','Retention and backup','Deletion requests'],
  ['event-photography/index.html','Storage, access and deletion','Controlled access','Delivered files and working files','Retention and backup','Deletion requests'],
  ['faq/index.html','Storage, access and deletion','Controlled access','Delivered files and working files','Retention and backup','Deletion requests'],
  ['privacy-policy/index.html','Storage, access and deletion','Controlled access','Delivered files and working files','Retention and backup','Deletion requests'],
  ['terms-conditions/index.html','Storage, access and deletion','Controlled access','Delivered files and working files','Retention and backup','Deletion requests'],
  ['hu/portre/index.html','Tárolás, hozzáférés és törlés','Szabályozott hozzáférés','Átadott és munkafájlok','Megőrzés és biztonsági mentés','Törlési kérelem'],
  ['hu/brand/index.html','Tárolás, hozzáférés és törlés','Szabályozott hozzáférés','Átadott és munkafájlok','Megőrzés és biztonsági mentés','Törlési kérelem'],
  ['hu/rendezvenyfotozas/index.html','Tárolás, hozzáférés és törlés','Szabályozott hozzáférés','Átadott és munkafájlok','Megőrzés és biztonsági mentés','Törlési kérelem'],
  ['hu/gyik/index.html','Tárolás, hozzáférés és törlés','Szabályozott hozzáférés','Átadott és munkafájlok','Megőrzés és biztonsági mentés','Törlési kérelem'],
  ['hu/adatvedelem/index.html','Tárolás, hozzáférés és törlés','Szabályozott hozzáférés','Átadott és munkafájlok','Megőrzés és biztonsági mentés','Törlési kérelem'],
  ['hu/aszf/index.html','Tárolás, hozzáférés és törlés','Szabályozott hozzáférés','Átadott és munkafájlok','Megőrzés és biztonsági mentés','Törlési kérelem'],
  ['de-at/portrait/index.html','Speicherung, Zugriff und Löschung','Kontrollierter Zugriff','Gelieferte Dateien und Arbeitsdateien','Aufbewahrung und Sicherung','Löschanfragen'],
  ['de-at/brand/index.html','Speicherung, Zugriff und Löschung','Kontrollierter Zugriff','Gelieferte Dateien und Arbeitsdateien','Aufbewahrung und Sicherung','Löschanfragen'],
  ['de-at/eventfotografie/index.html','Speicherung, Zugriff und Löschung','Kontrollierter Zugriff','Gelieferte Dateien und Arbeitsdateien','Aufbewahrung und Sicherung','Löschanfragen'],
  ['de-at/faq/index.html','Speicherung, Zugriff und Löschung','Kontrollierter Zugriff','Gelieferte Dateien und Arbeitsdateien','Aufbewahrung und Sicherung','Löschanfragen'],
  ['de-at/datenschutz/index.html','Speicherung, Zugriff und Löschung','Kontrollierter Zugriff','Gelieferte Dateien und Arbeitsdateien','Aufbewahrung und Sicherung','Löschanfragen'],
  ['de-at/agb/index.html','Speicherung, Zugriff und Löschung','Kontrollierter Zugriff','Gelieferte Dateien und Arbeitsdateien','Aufbewahrung und Sicherung','Löschanfragen']
];

for(const [relative,...tokens] of pages){
  const file=path.join(root,relative);
  if(!fs.existsSync(file)){errors.push(`${relative}: missing file`);continue;}
  const html=fs.readFileSync(file,'utf8');
  if((html.match(/data-data-retention="stage12"/g)||[]).length!==1) errors.push(`${relative}: data-retention block must appear exactly once`);
  const section=(html.match(/<section class="section-band data-retention-clarity"[\s\S]*?<\/section>/)||[''])[0];
  for(const token of tokens) if(!section.includes(token)) errors.push(`${relative}: missing ${token}`);
  if((section.match(/<article class="card reveal">/g)||[]).length!==4) errors.push(`${relative}: expected four data-governance cards`);
  if(!/RAW|RAW-|RAW-Aufnahmen/.test(section)) errors.push(`${relative}: working-file distinction missing`);
  if(!/does not guarantee permanent storage|tartós archiválást nem garantál|garantiert jedoch keine dauerhafte Archivierung/.test(section)) errors.push(`${relative}: no-permanent-archive rule missing`);
  if(!/accounting|számviteli|Buchhaltung/.test(section)) errors.push(`${relative}: lawful-retention exception missing`);
  const marker=html.indexOf('data-data-retention="stage12"');
  const mainClose=html.lastIndexOf('</main>');
  if(marker<0 || marker>mainClose) errors.push(`${relative}: data-retention block must stay inside main`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-twelve data retention audit passed across eighteen pages and three languages.');
