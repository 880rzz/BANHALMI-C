import fs from 'node:fs';

const errors=[];
const pages={
  'index.html':{heading:'One visual discipline, four clear ways to work together.',cta:'Choose the relevant starting point ↓',facts:['Four principal services:','Executive Portraiture, Brand Photography, C-Level Event Photography and Fine Art Photography','Headshots, employer-branding imagery, press portraits and visual brand strategy','As a member of AmCham Austria','memory, the body and biography']},
  'hu/index.html':{heading:'Egy vizuális szemlélet, négy egyértelmű együttműködési terület.',cta:'A megfelelő kiindulópont kiválasztása ↓',facts:['Négy fő szolgáltatás:','vezetői portréfotózás, brandfotózás, felsővezetői eseményfotózás és művészi fotográfia','Az üzleti portré, a munkáltatói márkaépítés, a sajtóportré és a vizuális márkastratégia egymást kiegészítő eszközök.','Az AmCham Austria tagjaként','emlékezet, a test és az élettörténet']},
  'de-at/index.html':{heading:'Eine visuelle Disziplin, vier klare Formen der Zusammenarbeit.',cta:'Den passenden Einstieg wählen ↓',facts:['Vier Hauptleistungen:','Executive-Porträts, Brandfotografie, C-Level-Eventfotografie und Fine-Art-Fotografie','Headshots, Employer-Branding-Bilder, Presseporträts und visuelle Markenstrategie','Als Mitglied von AmCham Austria','Erinnerung, Körper und Biografie']}
};
for(const [file,expected] of Object.entries(pages)){
  const html=fs.readFileSync(file,'utf8');
  const count=(html.match(/class="section-band client-decision-bridge"/g)||[]).length;
  if(count!==1)errors.push(file+': expected one client decision bridge, found '+count);
  if(html.includes('strategic-positioning-summary'))errors.push(file+': obsolete strategic summary remains');
  if(!html.includes('<h2 id="client-decision-title">'+expected.heading+'</h2>'))errors.push(file+': decision heading missing');
  if(!html.includes('href="#services">'+expected.cta+'</a>'))errors.push(file+': service decision CTA missing');
  for(const fact of expected.facts)if(!html.includes(fact))errors.push(file+': preserved hierarchy fact missing '+fact);
  const presence=html.indexOf('class="section-band presence-thesis"');
  const bridge=html.indexOf('class="section-band client-decision-bridge"');
  const services=html.indexOf('<section id="services">');
  if(!(presence>=0&&bridge>presence&&services>bridge))errors.push(file+': homepage decision order is incorrect');
  for(const old of ['One practice, two forms','Egy gyakorlat, két forma','Eine Praxis, zwei Formen'])if(html.includes(old))errors.push(file+': repetitive legacy heading remains '+old);
}
const ecosystem=JSON.parse(fs.readFileSync('ecosystem.json','utf8'));
if(ecosystem.homepageDecisionPath?.sequence?.length!==8)errors.push('ecosystem.json: decision sequence missing');
if(ecosystem.homepageDecisionPath?.principalServices?.length!==4)errors.push('ecosystem.json: principal services missing');

for(const file of ['ai.txt','llms-full.txt']){
  const text=fs.readFileSync(file,'utf8');
  if((text.split('<!-- HOMEPAGE-DECISION-PATH:START -->').length-1)!==1)errors.push(file+': homepage decision block missing or duplicated');
}
const llms=fs.readFileSync('llms.txt','utf8');
for(const route of [
  '[Portrait photography](https://www.norbertbanhalmi.com/portrait/)',
  '[Brand photography](https://www.norbertbanhalmi.com/lifestyle/)',
  '[C-Level event photography](https://www.norbertbanhalmi.com/event-photography/)',
  '[Fine-art photography](https://www.norbertbanhalmi.com/glamour/)'
]) if(!llms.includes(route)) errors.push('llms.txt: principal service route missing '+route);
for(const invented of ['/brand-photography/','/c-level-event-photography/','/fine-art-photography/']) if(llms.includes(invented)) errors.push('llms.txt: invented/noncanonical service route remains '+invented);

const manifest=JSON.parse(fs.readFileSync('docs/content-migrations/2026-08-06-homepage-hierarchy-stage3.json','utf8'));
if(manifest.pages?.length!==3||manifest.pages.some(page=>page.nonTargetContentPreservedExactly!==true||!page.oldRegion||!page.newRegion))errors.push('migration manifest: preservation evidence incomplete');
if(errors.length){console.error(errors.join(String.fromCharCode(10)));process.exit(1)}
console.log('Homepage hierarchy stage-three audit passed: one decision bridge, four services, detailed AI evidence and canonical existing llms service routing are aligned.');
