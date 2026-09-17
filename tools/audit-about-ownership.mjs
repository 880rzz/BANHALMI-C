import fs from 'node:fs';

const pages=['about/index.html','hu/eletmu/index.html','de-at/werk/index.html'];
const forbidden=['id="exhibitions"','id="permanent-exhibition"','id="curatorial-programme"','id="books"','id="media"','id="professional-articles"','id="video-media"'];
const failures=[];
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  for(const token of forbidden) if(html.includes(token)) failures.push(`${file}: ART-owned full archive section survived: ${token}`);
  if(!html.includes('id="artistic-archive"')) failures.push(`${file}: canonical ART archive bridge missing`);
  const artLinks=(html.match(/https:\/\/www\.banhalmi\.art\//g)||[]).length;
  if(artLinks<2) failures.push(`${file}: archive bridge must expose both archive and press/source path`);
  const h1=(html.match(/<h1\b/gi)||[]).length;
  if(h1!==1) failures.push(`${file}: expected exactly one H1, found ${h1}`);
}
if(failures.length){console.error('BANHALMI/ART ownership audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('BANHALMI/ART ownership audit passed: professional biography keeps context; detailed oeuvre remains canonical on BANHALMI ART.');
