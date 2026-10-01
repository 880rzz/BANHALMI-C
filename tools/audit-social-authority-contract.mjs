import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();
const SKIP=new Set(['.git','.github','node_modules','artifacts','_site']);
const retired=[
  'https://www.saatchiart.com/norbertbanhalmi',
  'https://www.tiktok.com/@banhalmi.norbert',
  'https://x.com/norbertbanhalmi'
];
const personal=[
  'https://www.linkedin.com/in/norbertbanhalmi/',
  'https://www.instagram.com/norbert.banhalmi/',
  'https://www.facebook.com/banhalmi.norbert',
  'https://www.youtube.com/@norbert.banhalmi',
  'https://www.pinterest.com/norbertbanhalmi/'
];
const company=[
  'https://www.linkedin.com/company/banhalmi/',
  'https://cherrydeck.com/norbert.banhalmi'
];
const personForbiddenProfessional=[
  'https://cherrydeck.com/profile/norbert.banhalmi'
];
const errors=[];

function files(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
    if(SKIP.has(e.name)) return [];
    const full=path.join(dir,e.name);
    return e.isDirectory()?files(full):[full];
  });
}
function read(rel){return fs.readFileSync(path.join(ROOT,rel),'utf8');}

for(const file of files(ROOT)){
  if(!file.endsWith('.html')) continue;
  const rel=path.relative(ROOT,file).replaceAll('\\','/');
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('class="site-footer"')) continue;
  for(const url of [...retired,...personal,...personForbiddenProfessional]) if(html.includes(url)) errors.push(`${rel}: stale/personal social authority ${url}`);
  for(const url of company) if(!html.includes(url)) errors.push(`${rel}: company social authority missing ${url}`);
  const social=html.match(/<details class="footer-accordion" data-social-footer="">[\s\S]*?<\/details>/)?.[0]||'';
  if(!social) errors.push(`${rel}: social footer missing`);
  else{
    for(const url of company) if(!social.includes(url)) errors.push(`${rel}: social footer missing ${url}`);
    for(const url of [...retired,...personal]) if(social.includes(url)) errors.push(`${rel}: social footer contains forbidden ${url}`);
  }
}

for(const rel of ['entity.jsonld','person-authority.jsonld']){
  const text=read(rel);
  for(const url of [...retired,...personal,...personForbiddenProfessional]) if(text.includes(url)) errors.push(`${rel}: forbidden active identity ${url}`);
  for(const url of company) if(!text.includes(url)) errors.push(`${rel}: organization authority missing ${url}`);
}

const core=JSON.parse(read('data/machine-core.json'));
const orgProfiles=core.authorityOwnership?.professionalOrganization?.activeProfiles||[];
for(const url of company) if(!orgProfiles.includes(url)) errors.push(`machine-core: professional organization missing ${url}`);
for(const url of retired) if(orgProfiles.includes(url)) errors.push(`machine-core: retired profile active ${url}`);
const artProfiles=core.authorityOwnership?.artisticPerson?.activeProfiles||[];
for(const url of personal.slice(0,4)) if(!artProfiles.includes(url)) errors.push(`machine-core: ART person ownership missing ${url}`);

const evidence=read('service-trust-evidence.json');
if(evidence.includes('https://www.saatchiart.com/norbertbanhalmi')) errors.push('service-trust-evidence.json: deleted Saatchi profile must not remain LIVE evidence');
if(evidence.includes('https://x.com/norbertbanhalmi')) errors.push('service-trust-evidence.json: retired personal X profile must not be active evidence');

if(errors.length){
  console.error('Social/entity authority contract failed:\n- '+errors.join('\n- '));
  process.exit(1);
}
console.log('Social/entity authority contract OK: Professional uses company LinkedIn + Cherrydeck; retired/personal profiles are absent from active Professional identity while ART ownership remains declared in machine-core.');
