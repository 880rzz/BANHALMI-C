import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const pages=[
  ['contact/index.html','Vienna and Budapest — one project system'],
  ['hu/kapcsolat/index.html','Bécs és Budapest — egyetlen projektrendszer'],
  ['de-at/kontakt/index.html','Wien und Budapest — ein Projektsystem']
];
const failures=[];
for(const [relative,removedTitle] of pages){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  const selectors=html.match(/<section class="section-band next-step-selector" data-conversion-path="stage5">[\s\S]*?<\/section>/g)||[];
  if(selectors.length!==1) failures.push(`${relative}: expected one next-step selector, found ${selectors.length}`);
  if(html.includes('contact-quote-entry section-band contact-pathways')) failures.push(`${relative}: obsolete upper duplicate remains`);
  if(html.includes(removedTitle)) failures.push(`${relative}: redundant project-system card remains`);
  if(selectors.length===1){
    const cards=(selectors[0].match(/<article class="card">/g)||[]).length;
    if(cards!==3) failures.push(`${relative}: preferred selector must have three cards, found ${cards}`);
    const selectorPos=html.indexOf(selectors[0]);
    const teamPos=html.indexOf('<section class="section project-team"');
    const formPos=html.indexOf('<section class="contact-form-section"');
    if(selectorPos<0||teamPos<0||formPos<0||selectorPos>teamPos||selectorPos>formPos) failures.push(`${relative}: selector is not in the upper contact position`);
  }
  const team=(html.match(/<section class="section-band team-role-clarity" data-team-roles="stage8">[\s\S]*?<\/section>/)||[''])[0];
  const teamCards=(team.match(/<article class="card reveal">/g)||[]).length;
  if(teamCards!==2) failures.push(`${relative}: team-role section must contain two cards, found ${teamCards}`);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Contact page consolidation audit passed for EN, HU and DE.');
