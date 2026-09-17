import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages={
  "portrait/index.html": {
    "secondary": "View selected work"
  },
  "lifestyle/index.html": {
    "secondary": "View selected work"
  },
  "event-photography/index.html": {
    "secondary": "View selected work"
  },
  "hu/portre/index.html": {
    "secondary": "Válogatott munkák megtekintése"
  },
  "hu/brand/index.html": {
    "secondary": "Válogatott munkák megtekintése"
  },
  "hu/rendezvenyfotozas/index.html": {
    "secondary": "Válogatott munkák megtekintése"
  },
  "de-at/portrait/index.html": {
    "secondary": "Ausgewählte Arbeiten ansehen"
  },
  "de-at/brand/index.html": {
    "secondary": "Ausgewählte Arbeiten ansehen"
  },
  "de-at/eventfotografie/index.html": {
    "secondary": "Ausgewählte Arbeiten ansehen"
  }
};
for(const [relative,labels] of Object.entries(pages)){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if((html.match(/data-service-hero-actions="stage22"/g)||[]).length!==1) errors.push(relative+': stage22 hero actions must appear exactly once');
  const actions=(html.match(/<div class="hero-actions service-hero-actions"[\s\S]*?<\/div>/)||[''])[0];
  if(!actions.includes('href="#next-step"')) errors.push(relative+': hero primary action must target #next-step');
  if(!actions.includes('href="#selected-work"')) errors.push(relative+': hero secondary action must target #selected-work');
  if(!actions.includes(labels.secondary)) errors.push(relative+': localized selected-work label missing');
  if((html.match(/id="selected-work"/g)||[]).length!==1) errors.push(relative+': selected-work ID must appear exactly once');
  if((html.match(/id="next-step"/g)||[]).length!==1) errors.push(relative+': next-step ID must appear exactly once');
  if((html.match(/<section class="cta-band">/g)||[]).length!==0) errors.push(relative+': duplicate one-button CTA band must not remain');
  const positions=[
    html.indexOf('data-service-hero-actions="stage22"'),
    html.indexOf('id="selected-work"'),
    html.indexOf('data-third-party-reviews="true"'),
    html.indexOf('data-trust-proof="stage6"'),
    html.indexOf('id="next-step"'),
    html.indexOf('data-project-framework="stage20"'),
    html.indexOf('</main>')
  ];
  if(positions.some(value=>value<0)||positions.some((value,index)=>index>0&&value<=positions[index-1])) errors.push(relative+': hero → work → reviews → trust → selector → framework order is invalid');
  const selector=(html.match(/<section class="section-band next-step-selector"[\s\S]*?<\/section>/)||[''])[0];
  if((selector.match(/<article class="card">/g)||[]).length!==3) errors.push(relative+': the final selector must retain exactly three choices');
}
for(const relative of ['glamour/index.html','hu/muveszi-fotografia/index.html','de-at/fine-art/index.html']){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if(html.includes('data-service-hero-actions="stage22"')) errors.push(relative+': commercial stage22 actions must not appear on fine-art pages');
}
const css=fs.readFileSync(path.join(root,'assets/css/style.css'),'utf8');
for(const token of ['SERVICE-CONVERSION-PATH:START','.service-hero-actions','#selected-work,#next-step','SERVICE-CONVERSION-PATH:END']) if(!css.includes(token)) errors.push('assets/css/style.css: missing '+token);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-twenty-two service conversion audit passed: nine pages use one early anchor pair and one final three-way selector without duplicate CTA bands.');
