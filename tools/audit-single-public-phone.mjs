import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const NORBERT={compact:'+4367761655592',display:'+43 677 616 55592'};
const VIKO={compact:'+4367764733262',display:'+43 677 647 332 62'};
const RETIRED=['+36704698397','+36 70 469 8397','+36 70 469 83 97'];
const SKIP=new Set(['.git','.github','node_modules','_site','artifacts']);
const failures=[];

function files(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
    if(SKIP.has(e.name)) return [];
    const full=path.join(dir,e.name);
    return e.isDirectory()?files(full):[full];
  });
}
function read(rel){const p=path.join(ROOT,rel);return fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';}

for(const file of files(ROOT)){
  if(!file.endsWith('.html')) continue;
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('class="site-footer"')) continue;
  const rel=path.relative(ROOT,file).replaceAll('\\','/');
  const lang=(html.match(/<html[^>]*lang="([^"]+)"/i)||[])[1]||'en';
  const hu=/^hu/i.test(lang);
  const expected=hu?NORBERT:VIKO;
  const forbidden=hu?VIKO:NORBERT;
  const phones=[...html.matchAll(/<a class="footer-phone" href="tel:([^"]+)">([^<]+)<\/a>/g)];
  if(phones.length<1) failures.push(`${rel}: footer phone missing`);
  for(const m of phones){
    if(m[1]!==expected.compact||m[2]!==expected.display) failures.push(`${rel}: footer phone drift ${m[2]} / ${m[1]}`);
  }
  if(html.includes(forbidden.display)&&phones.some(m=>m[2]===forbidden.display)) failures.push(`${rel}: wrong locale footer phone ${forbidden.display}`);
  if(!html.includes('https://wa.me/4367761655592')) failures.push(`${rel}: canonical Norbert WhatsApp missing`);
  for(const token of RETIRED) if(html.includes(token)) failures.push(`${rel}: retired Hungarian public phone token ${token}`);
}

for(const rel of ['assets/js/main.js','js/main.js']){
  const text=read(rel);
  for(const token of [NORBERT.compact,NORBERT.display,VIKO.compact,VIKO.display]) if(!text.includes(token)) failures.push(`${rel}: Contact Dock authority missing ${token}`);
  if(!text.includes('locale === "hu" ? "+4367761655592" : "+4367764733262"')) failures.push(`${rel}: Contact Dock locale routing missing`);
  if(!text.includes('var whatsappHref = "+4367761655592"')) failures.push(`${rel}: Contact Dock WhatsApp drift`);
  for(const token of RETIRED) if(text.includes(token)) failures.push(`${rel}: retired phone token ${token}`);
}

const generator=read('tools/normalize-executive-footer.mjs');
for(const token of [NORBERT.compact,NORBERT.display,VIKO.compact,VIKO.display]) if(!generator.includes(token)) failures.push(`tools/normalize-executive-footer.mjs: canonical phone contract missing ${token}`);

const core=JSON.parse(read('data/machine-core.json'));
const auth=core.organization?.contactAuthority;
if(auth?.whatsapp!==NORBERT.compact) failures.push('machine-core: WhatsApp must be Norbert');
if(auth?.telephoneByLanguage?.en!==VIKO.compact||auth?.telephoneByLanguage?.['de-AT']!==VIKO.compact||auth?.telephoneByLanguage?.['hu-HU']!==NORBERT.compact) failures.push('machine-core: locale telephone mapping drift');
if(auth?.googleBusinessProfilePhoneRule?.austriaLocations!==VIKO.compact||auth?.googleBusinessProfilePhoneRule?.budapestLocation!==NORBERT.compact) failures.push('machine-core: Google Business Profile phone rule drift');

if(failures.length){
  console.error('Locale phone authority contract failed:\n'+failures.join('\n'));
  process.exit(1);
}
console.log('Locale phone authority contract OK: every Professional footer and Contact Dock uses EN/DE=Viko, HU=Norbert, WhatsApp=Norbert; GBP location rule preserved.');
