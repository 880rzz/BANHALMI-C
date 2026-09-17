import fs from 'node:fs';
import path from 'node:path';

const cssPath=fs.existsSync('assets/css/style.css')?'assets/css/style.css':'assets/css/site.css';
const css=fs.readFileSync(cssPath,'utf8');
const config=fs.readFileSync('assets/js/site-config.js','utf8');
const errors=[];

for(const required of [
  'STAGE48-LAYOUT-CACHE-CONTRACT:START',
  '.trust-proof .grid-3{gap:24px!important;row-gap:24px!important}',
  '@media(max-width:760px){.trust-proof .grid-3{gap:16px!important;row-gap:16px!important}}'
]) if(!css.includes(required)) errors.push(`${cssPath} missing: ${required}`);

// The historical Stage 48 flex + dark-document-floor contract caused footer/document
// overhang on some routes. It is intentionally superseded by the design compiler.
if(cssPath==='assets/css/site.css'){
  for(const legacy of [
    'html{min-height:100%;background:#202530!important}',
    'body{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column}',
    'body>main,#main{flex:1 0 auto;width:100%;min-width:0}',
    'body>.site-footer,.site-footer{flex:0 0 auto;width:100%}'
  ]) if(!css.includes(legacy)) errors.push(`${cssPath} compatibility template unexpectedly lost legacy compiler target: ${legacy}`);
}

const cssToken=config.match(/\/assets\/css\/mega-menu\.css\?v=([^"']+)/)?.[1];
const jsToken=config.match(/\/assets\/js\/mega-menu\.js\?v=([^"']+)/)?.[1];
if(!cssToken) errors.push('site-config.js mega-menu CSS cache token missing');
if(!jsToken) errors.push('site-config.js mega-menu JS cache token missing');
if(cssToken&&jsToken&&cssToken!==jsToken) errors.push(`site-config.js cache token mismatch: CSS=${cssToken}, JS=${jsToken}`);
const token=cssToken||jsToken||'';

const skip=new Set(['.git','node_modules','.github']);
const files=[];
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(e.name)) continue;
    const full=path.join(dir,e.name);
    if(e.isDirectory()) walk(full);
    else if(e.name.endsWith('.html')) files.push(full);
  }
}
walk('.');
let styleRefs=0, configRefs=0;
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  for(const m of html.matchAll(/\/assets\/css\/style\.css\?v=([^"']+)/g)){
    styleRefs++;
    if(token&&m[1]!==token) errors.push(`${file}: stale style.css token ${m[1]} (expected ${token})`);
  }
  for(const m of html.matchAll(/\/assets\/js\/site-config\.js\?v=([^"']+)/g)){
    configRefs++;
    if(token&&m[1]!==token) errors.push(`${file}: stale site-config.js token ${m[1]} (expected ${token})`);
  }
}
if(styleRefs<40) errors.push(`Expected >=40 versioned style.css refs, found ${styleRefs}`);
if(configRefs<40) errors.push(`Expected >=40 versioned site-config refs, found ${configRefs}`);

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Stage 48 compatibility/cache audit passed on ${token}: ${styleRefs} style refs, ${configRefs} site-config refs. Historical flex/dark footer-floor rules remain compiler targets only; rendered footer flow is governed by data/design-authority.json and the production compiler.`);
