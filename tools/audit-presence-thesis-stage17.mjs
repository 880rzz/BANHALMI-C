import fs from 'node:fs';

const errors=[];
const pages={
  'index.html':{
    heading:'Throughout my life, I have explored presence through photography.',
    archive:'https://www.banhalmi.art/',
    journal:'https://blog.banhalmi.art/en',
    euforia:'https://www.banhalmi.art/exhibitions/euforia.html'
  },
  'hu/index.html':{
    heading:'Egész életemben a fotográfián keresztül a jelenlétet kutattam.',
    archive:'https://www.banhalmi.art/hu/',
    journal:'https://blog.banhalmi.art',
    euforia:'https://www.banhalmi.art/hu/exhibitions/euforia.html'
  },
  'de-at/index.html':{
    heading:'Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.',
    archive:'https://www.banhalmi.art/de-at/',
    journal:'https://blog.banhalmi.art/de',
    euforia:'https://www.banhalmi.art/de-at/exhibitions/euforia.html'
  }
};
function textContent(fragment){
  return fragment.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
}
for(const [file,expected] of Object.entries(pages)){
  const html=fs.readFileSync(file,'utf8');
  const sectionCount=html.split('class="section-band presence-thesis"').length-1;
  if(sectionCount!==1)errors.push(file+': expected one presence thesis section, found '+sectionCount);
  const presenceSection=(html.match(/<section\b[^>]*class="[^"]*section-band presence-thesis[^"]*"[^>]*>[\s\S]*?<\/section>/i)||[''])[0];
  const heading=(presenceSection.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/i)||[''])[0];
  if(textContent(heading)!==expected.heading)errors.push(file+': canonical heading missing or changed');
  for(const [label,url] of Object.entries({archive:expected.archive,journal:expected.journal,euforia:expected.euforia})){
    if(!html.includes('href="'+url+'"'))errors.push(file+': '+label+' link missing');
  }
  const presenceIndex=html.indexOf('class="section-band presence-thesis"');
  const strategyIndex=html.indexOf('class="section-band client-decision-bridge"');
  if(presenceIndex<0||strategyIndex<0||presenceIndex>strategyIndex)errors.push(file+': presence thesis must precede client decision bridge');
  if((html.match(/<section /g)||[]).length<2)errors.push(file+': page structure unexpectedly reduced');
}
const thesis=JSON.parse(fs.readFileSync('presence-thesis.json','utf8'));
if(thesis.canonicalStatement?.hu!=='Egész életemben a fotográfián keresztül a jelenlétet kutattam.')errors.push('presence-thesis.json: Hungarian statement mismatch');
if(thesis.canonicalStatement?.en!=='Throughout my life, I have explored presence through photography.')errors.push('presence-thesis.json: English statement mismatch');
if(thesis.canonicalStatement?.de!=='Mein ganzes Leben lang habe ich durch die Fotografie Präsenz erforscht.')errors.push('presence-thesis.json: German statement mismatch');
const ecosystem=JSON.parse(fs.readFileSync('ecosystem.json','utf8'));
if(ecosystem.corePracticeThesis?.canonicalSource!=='https://www.norbertbanhalmi.com/presence-thesis.json')errors.push('ecosystem.json: canonical thesis source missing');

// The full machine thesis remains mandatory in the detailed machine layers.
for(const file of ['ai.txt','llms-full.txt']){
  const text=fs.readFileSync(file,'utf8');
  if((text.split('<!-- PRESENCE-THESIS:START -->').length-1)!==1)errors.push(file+': presence thesis machine block missing or duplicated');
  if(!text.includes('https://www.norbertbanhalmi.com/presence-thesis.json'))errors.push(file+': canonical thesis URL missing');
}
// llms.txt is intentionally the concise entry index: it must route to the canonical thesis without duplicating its full block.
const llms=fs.readFileSync('llms.txt','utf8');
if(!llms.includes('[Presence thesis](https://www.norbertbanhalmi.com/presence-thesis.json)'))errors.push('llms.txt: canonical presence thesis route missing');
if(!llms.includes('Throughout my life, I have explored presence through photography.'))errors.push('llms.txt: concise canonical thesis statement missing');

const manifest=JSON.parse(fs.readFileSync('docs/content-migrations/2026-08-06-presence-stage1.json','utf8'));
if(manifest.pages?.length!==3||manifest.pages.some(item=>item.originalContentPreservedExactly!==true))errors.push('migration manifest: preservation evidence incomplete');
if(errors.length){console.error(errors.join(String.fromCharCode(10)));process.exit(1)}
console.log('Presence thesis stage-one audit passed: three languages, exact visible heading text, detailed machine evidence and concise llms routing are aligned.');
