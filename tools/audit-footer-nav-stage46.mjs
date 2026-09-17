import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const css=fs.readFileSync('assets/css/style.css','utf8');
for(const token of [
  '/* STAGE46-FOOTER-VIEWPORT-AND-NAV-CLARITY */',
  'body{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column}',
  'body>.site-footer{margin-top:auto;width:100%}',
  '.site-footer .brand,.site-footer .brand span,.site-footer .brand-word{color:#CBB45F}'
]) if(!css.includes(token)) failures.push(`Missing Stage 46 CSS contract: ${token}`);

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules','.github'].includes(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) walk(full,out); else if(e.name.endsWith('.html')) out.push(full);
  }
  return out;
}
const files=walk('.');
const old=['Build Your Package','Projekt összeállítása','Paket zusammenstellen'];
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  for(const label of old) if(html.includes(label)) failures.push(`${file}: obsolete navigation label remains: ${label}`);
}

const checks=[
  ['index.html','Pricing & quote'],
  ['hu/index.html','Árak és ajánlat'],
  ['de-at/index.html','Preise & Angebot']
];
for(const [file,label] of checks){
  const html=fs.readFileSync(file,'utf8');
  const re=new RegExp(`<a[^>]*class=["'][^"']*nav-cta[^"']*["'][^>]*>${label.replace('&','&amp;|&')}</a>`);
  if(!html.includes(`>${label}</a>`)) failures.push(`${file}: nav CTA is not '${label}'`);
}

if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`Stage 46 footer/nav audit passed across ${files.length} HTML files.`);
