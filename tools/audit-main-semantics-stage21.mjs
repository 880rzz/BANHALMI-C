import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
  "faq/index.html",
  "terms-conditions/index.html",
  "hu/gyik/index.html",
  "hu/aszf/index.html",
  "de-at/faq/index.html",
  "de-at/agb/index.html"
];
const markers=[
  "data-governance-confidentiality=\"stage10\"",
  "data-booking-contingency=\"stage11\""
];
for(const relative of pages){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  const mainClose=html.indexOf('</main>');
  const footer=html.indexOf('<footer class="site-footer">',mainClose);
  if(!(mainClose>=0&&footer>mainClose)) errors.push(relative+': main/footer order is invalid');
  for(const marker of markers){
    const markerAt=html.indexOf(marker);
    if((html.split(marker).length-1)!==1) errors.push(relative+': expected one '+marker);
    if(markerAt<0||markerAt>mainClose) errors.push(relative+': '+marker+' must stay inside main');
  }
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-twenty-one main semantics audit passed: governance and booking remain inside main on localized FAQ and terms pages.');
