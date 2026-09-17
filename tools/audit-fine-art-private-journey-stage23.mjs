import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/content-migrations/2026-08-06-fine-art-private-journey-stage7.json'),'utf8'));
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const pageConfig={
  "glamour/index.html": {
    "secondary": "View selected work",
    "newHeader": [
      "Selected personal work",
      "Fine-art portraits and studies of the body",
      "The visible selection focuses on personal work about identity, biography and the body. A broader artistic archive remains available below."
    ],
    "archive": [
      "Extended artistic archive",
      "Urban, architectural and travel studies",
      "Open archive"
    ]
  },
  "hu/muveszi-fotografia/index.html": {
    "secondary": "Válogatott munkák megtekintése",
    "newHeader": [
      "Válogatott személyes munkák",
      "Művészi portrék és testtanulmányok",
      "A látható válogatás az identitásról, az élettörténetről és a testről szóló személyes munkákra összpontosít. A tágabb művészeti archívum külön nyitható meg alatta."
    ],
    "archive": [
      "Bővített művészeti archívum",
      "Városi, építészeti és utazási tanulmányok",
      "Archívum megnyitása"
    ]
  },
  "de-at/fine-art/index.html": {
    "secondary": "Ausgewählte Arbeiten ansehen",
    "newHeader": [
      "Ausgewählte persönliche Arbeiten",
      "Fine-Art-Porträts und Studien des Körpers",
      "Die sichtbare Auswahl konzentriert sich auf persönliche Arbeiten über Identität, Biografie und den Körper. Ein breiteres Kunstarchiv lässt sich darunter separat öffnen."
    ],
    "archive": [
      "Erweitertes Kunstarchiv",
      "Urbane, architektonische und Reise-Studien",
      "Archiv öffnen"
    ]
  }
};
for(const record of manifest.pages){
  const relative=record.file;
  const config=pageConfig[relative];
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  const heroStart=html.indexOf('<section class="hero service-hero service-editorial-hero">');
  const heroEnd=html.indexOf('</section>',heroStart);
  const hero=html.slice(heroStart,heroEnd+'</section>'.length);
  if((hero.match(/data-fine-art-private-journey="stage23"/g)||[]).length!==1) errors.push(relative+': private hero actions must appear exactly once');
  if(!hero.includes('href="#private-conversation"')) errors.push(relative+': hero primary anchor missing');
  if(!hero.includes('href="#fine-art-selected-work"')) errors.push(relative+': hero selected-work anchor missing');
  if(!hero.includes(record.privateCta.label)) errors.push(relative+': existing private CTA label not reused in hero');
  if(!hero.includes(config.secondary)) errors.push(relative+': localized selected-work label missing');
  if(hero.includes('data-fine-art-resource=')) errors.push(relative+': Press or Blog remains in hero');
  if((html.match(/id="fine-art-selected-work"/g)||[]).length!==1) errors.push(relative+': selected-work ID must appear exactly once');
  if((html.match(/id="private-conversation"/g)||[]).length!==1) errors.push(relative+': private-conversation ID must appear exactly once');
  for(const value of config.newHeader) if(!html.includes(value)) errors.push(relative+': new gallery framing missing '+value);
  const detailsMatch=html.match(/<details class="fine-art-archive-drawer" data-fine-art-archive="stage23">[\s\S]*?<\/details>/);
  if(!detailsMatch){errors.push(relative+': extended archive drawer missing');continue;}
  const details=detailsMatch[0];
  if(/<details class="fine-art-archive-drawer"[^>]*\sopen(?:\s|>)/.test(details)) errors.push(relative+': archive drawer must be initially closed');
  for(const value of config.archive) if(!details.includes(value)) errors.push(relative+': localized archive summary missing '+value);
  const allFigures=[...html.matchAll(/<figure class="editorial-image gallery-lightbox-item[\s\S]*?<\/figure>/g)].map(match=>match[0]);
  const hashes=allFigures.map(sha256);
  if(JSON.stringify(hashes)!==JSON.stringify(record.gallery.originalFigureHashes)) errors.push(relative+': gallery figure bytes or order changed');
  if(allFigures.length!==record.gallery.totalFigures) errors.push(relative+': total gallery figure count changed');
  const extended=[...details.matchAll(/<figure class="editorial-image gallery-lightbox-item[\s\S]*?<\/figure>/g)].map(match=>match[0]);
  if(extended.length!==record.gallery.extendedFigures) errors.push(relative+': extended archive figure count changed');
  if(extended.some(figure=>!figure.includes('data-archive-extended=""'))) errors.push(relative+': non-archive figure entered extended drawer');
  const galleryStart=html.indexOf('id="fine-art-selected-work"');
  const detailsStart=html.indexOf('data-fine-art-archive="stage23"',galleryStart);
  if((html.slice(galleryStart,detailsStart).match(/data-archive-extended=""/g)||[]).length) errors.push(relative+': extended archive figure remains in visible core selection');
  const ageRestricted=(html.match(/data-age-restricted="true"/g)||[]).length;
  const agePreview=(html.match(/class="age-restricted-preview"/g)||[]).length;
  if(agePreview!==record.gallery.ageRestrictedFigures) errors.push(relative+': age-restricted preview count changed');
  if(ageRestricted<agePreview*2) errors.push(relative+': age-restricted item/button contract weakened');
  const archiveStart=html.indexOf('<section class="section-band" id="archive-references">');
  const archiveEnd=html.indexOf('</section>',archiveStart);
  const archive=html.slice(archiveStart,archiveEnd+'</section>'.length);
  const resourceMatch=archive.match(/<div class="hero-actions fine-art-resource-actions reveal"[\s\S]*?<\/div>/);
  if(!resourceMatch||sha256(resourceMatch[0])!==record.resourceGroup.sha256) errors.push(relative+': Press/Blog group was not preserved byte-for-byte');
  const sequence=[html.indexOf('data-fine-art-private-journey="stage23"'),html.indexOf('id="fine-art-selected-work"'),html.indexOf('data-fine-art-archive="stage23"'),archiveStart,html.indexOf('id="reviews"'),html.indexOf('id="private-conversation"'),html.indexOf('</main>')];
  if(sequence.some(value=>value<0)||sequence.some((value,index)=>index>0&&value<=sequence[index-1])) errors.push(relative+': private-client journey order is invalid');
}
const css=fs.readFileSync(path.join(root,'assets/css/style.css'),'utf8');
for(const token of ['FINE-ART-PRIVATE-JOURNEY:START','.fine-art-private-actions','.fine-art-archive-drawer > summary','.fine-art-extended-grid','FINE-ART-PRIVATE-JOURNEY:END']) if(!css.includes(token)) errors.push('assets/css/style.css: missing '+token);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-twenty-three Fine Art private journey audit passed: three localized pages preserve every image, age gate and archive resource while prioritizing the private conversation.');
