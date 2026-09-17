import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages={
  'portrait/index.html':['Project framework','Fees, delivery, rights and contingency'],
  'lifestyle/index.html':['Project framework','Fees, delivery, rights and contingency'],
  'event-photography/index.html':['Project framework','Fees, delivery, rights and contingency'],
  'hu/portre/index.html':['Projektkeretek','Díjazás, átadás, jogok és rendkívüli helyzetek'],
  'hu/brand/index.html':['Projektkeretek','Díjazás, átadás, jogok és rendkívüli helyzetek'],
  'hu/rendezvenyfotozas/index.html':['Projektkeretek','Díjazás, átadás, jogok és rendkívüli helyzetek'],
  'de-at/portrait/index.html':['Projektrahmen','Honorar, Lieferung, Rechte und Ausfallsicherheit'],
  'de-at/brand/index.html':['Projektrahmen','Honorar, Lieferung, Rechte und Ausfallsicherheit'],
  'de-at/eventfotografie/index.html':['Projektrahmen','Honorar, Lieferung, Rechte und Ausfallsicherheit']
};
const markers=[
  "data-pricing-licensing=\"stage7\"",
  "data-delivery-system=\"stage9\"",
  "data-data-retention=\"stage12\"",
  "data-image-rights=\"stage13\"",
  "data-governance-confidentiality=\"stage10\"",
  "data-booking-contingency=\"stage11\""
];
for(const [relative,labels] of Object.entries(pages)){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if((html.match(/data-project-framework="stage20"/g)||[]).length!==1) errors.push(relative+': framework drawer must appear exactly once');
  const start=html.indexOf('<details class="project-framework-drawer" data-project-framework="stage20">');
  const end=html.indexOf('</details>',start);
  const mainClose=html.indexOf('</main>',end);
  const footer=html.indexOf('<footer class="site-footer">',mainClose);
  if(!(start>=0&&end>start&&mainClose>end&&footer>mainClose)) errors.push(relative+': drawer/main/footer order is invalid');
  const drawer=start>=0&&end>start?html.slice(start,end+'</details>'.length):'';
  if(/<details class="project-framework-drawer"[^>]*\sopen(?:\s|>)/.test(drawer)) errors.push(relative+': framework must be initially closed');
  for(const label of labels) if(!drawer.includes(label)) errors.push(relative+': missing localized summary '+label);
  for(const marker of markers){
    if((html.split(marker).length-1)!==1) errors.push(relative+': expected one '+marker);
    if(!drawer.includes(marker)) errors.push(relative+': '+marker+' must be inside framework drawer');
    const markerAt=html.indexOf(marker);
    if(markerAt<start||markerAt>end||markerAt>mainClose) errors.push(relative+': '+marker+' must stay inside drawer and main');
  }
}
for(const relative of ['glamour/index.html','hu/muveszi-fotografia/index.html','de-at/fine-art/index.html']){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if(html.includes('data-project-framework="stage20"')) errors.push(relative+': corporate project framework must not appear on fine-art page');
}
const css=fs.readFileSync(path.join(root,'assets/css/style.css'),'utf8');
for(const token of ['PROJECT-FRAMEWORK-DRAWER:START','.project-framework-drawer > summary','.project-framework-content > .section-band','PROJECT-FRAMEWORK-DRAWER:END']) if(!css.includes(token)) errors.push('assets/css/style.css: missing '+token);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-twenty service framework audit passed: nine commercial service pages use one closed, accessible project-framework drawer inside main.');
