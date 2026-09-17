// Permanent regression guard for the localized Fine Art press and blog buttons.
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const pages=[
  {
    "file": "glamour/index.html",
    "labels": [
      "Press",
      "Blog"
    ],
    "urls": [
      "https://www.banhalmi.art/press.html",
      "https://blog.banhalmi.art/en"
    ],
    "group": "Further resources"
  },
  {
    "file": "hu/muveszi-fotografia/index.html",
    "labels": [
      "Sajtó",
      "Blog"
    ],
    "urls": [
      "https://www.banhalmi.art/hu/press.html",
      "https://blog.banhalmi.art"
    ],
    "group": "További tartalmak"
  },
  {
    "file": "de-at/fine-art/index.html",
    "labels": [
      "Presse",
      "Blog"
    ],
    "urls": [
      "https://www.banhalmi.art/de-at/press.html",
      "https://blog.banhalmi.art/de"
    ],
    "group": "Weitere Inhalte"
  }
];

for(const page of pages){
  const html=fs.readFileSync(path.join(root,page.file),'utf8');
  const blocks=html.match(/<div class="hero-actions fine-art-resource-actions reveal"[\s\S]*?<\/div>/g)||[];
  if(blocks.length!==1){
    failures.push(page.file+': expected one fine-art resource button group, found '+blocks.length);
    continue;
  }
  const block=blocks[0];
  if(!block.includes('aria-label="'+page.group+'"')) failures.push(page.file+': localized group label missing');
  const links=[...block.matchAll(/<a class="([^"]+)" data-fine-art-resource="(press|blog)" href="([^"]+)" target="_blank" rel="noopener noreferrer" aria-label="[^"]+">([^<]+)<\/a>/g)];
  if(links.length!==2){
    failures.push(page.file+': expected two resource buttons, found '+links.length);
  }else{
    const expectedRoles=['press','blog'];
    const expectedClasses=['btn btn-primary','btn btn-ghost'];
    links.forEach((match,index)=>{
      if(match[1]!==expectedClasses[index]) failures.push(page.file+': wrong button style for '+expectedRoles[index]);
      if(match[2]!==expectedRoles[index]) failures.push(page.file+': wrong resource order at '+(index+1));
      if(match[3]!==page.urls[index]) failures.push(page.file+': wrong '+expectedRoles[index]+' URL '+match[3]);
      if(match[4]!==page.labels[index]) failures.push(page.file+': wrong localized label '+match[4]);
    });
  }
  const heroStart=html.indexOf('<section class="hero service-hero service-editorial-hero">');
  const heroEnd=html.indexOf('</section>',heroStart);
  const hero=html.slice(heroStart,heroEnd+'</section>'.length);
  if(hero.includes('data-fine-art-resource=')) failures.push(page.file+': archive resource buttons must not remain in hero');
  const archiveStart=html.indexOf('<section class="section-band" id="archive-references">');
  const archiveEnd=html.indexOf('</section>',archiveStart);
  const archive=html.slice(archiveStart,archiveEnd+'</section>'.length);
  const cardGridEnd=archive.indexOf('</div>',archive.indexOf('<div class="card-grid">'));
  const blockPos=archive.indexOf(block);
  if(archiveStart<0||archiveEnd<0||cardGridEnd<0||blockPos<cardGridEnd) failures.push(page.file+': resource buttons must follow archive cards inside archive-references');
}

if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Fine-art press and blog CTA audit passed in English, Hungarian and German at the archive-reference location.');
