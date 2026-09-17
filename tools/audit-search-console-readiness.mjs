import fs from 'node:fs';
import path from 'node:path';

const errors=[];
const core=JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const overlay=JSON.parse(fs.readFileSync('llm-canonical-overlay.json','utf8'));
const ai=JSON.parse(fs.readFileSync('ai-entry.json','utf8'));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const pages=fs.readFileSync('.github/workflows/pages.yml','utf8');
const pr=fs.readFileSync('.github/workflows/desktop-regression.yml','utf8');
const emergency=fs.readFileSync('.github/workflows/emergency-pages-deploy.yml','utf8');
const req=(ok,msg)=>{if(!ok)errors.push(msg)};

req(core.brand?.name==='BANHALMI','Canonical primary brand drift');
req(core.brand?.positioning==='Photography Team','Canonical brand positioning is not Photography Team');
req(!(JSON.stringify(core).includes('"positioning":"Professional Photography Team"')),'Retired brand positioning remains in canonical machine core');
req(overlay.forbiddenBrandValues?.includes('Professional Photography Team'),'Overlay no longer forbids retired brand positioning');
req(ai?.identity?.brand?.positioning==='Photography Team','Committed AI entry still contains retired brand positioning');
req(!/<lastmod>/.test(sitemap),'Source sitemap must remain a lastmod-free template; production lastmod is Git-history rendered');
req(pages.includes('fetch-depth: 0'),'Production deploy checkout lacks full history for truthful sitemap lastmod');
req(pages.includes('render-production-sitemap-lastmod.mjs _site'),'Production deploy does not render truthful sitemap lastmod');
req(pr.includes('render-production-sitemap-lastmod.mjs _site'),'PR artifact does not exercise production sitemap rendering');
req(emergency.includes('fetch-depth: 0'),'Emergency deploy checkout lacks full history for truthful sitemap lastmod');
req(emergency.includes('render-production-sitemap-lastmod.mjs _site'),'Emergency deploy does not render truthful sitemap lastmod');
req(emergency.includes("grep -Eq '<lastmod>")&&emergency.includes('_site/sitemap.xml'),'Emergency deploy does not assert rendered sitemap lastmod');
req(fs.existsSync('external-photography-evidence.json')&&fs.existsSync('press-institutional-evidence.json')&&fs.existsSync('media-usage-evidence.json'),'Protected evidence registry missing');

// Google Search Console ProfilePage hardening.
// dateCreated is optional, but if present it must be a real ISO 8601 date/date-time.
const skipDirs=new Set(['.git','node_modules','_site','dist','coverage','.vercel']);
const htmlFiles=[];
function collectHtml(dir='.'){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.') && entry.name!=='.well-known') continue;
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()){
      if(!skipDirs.has(entry.name)) collectHtml(p);
    } else if(entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(p);
  }
}
collectHtml();

const isoDate=/^\d{4}-\d{2}-\d{2}$/;
const isoDateTime=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const isValidSchemaDate=value=>{
  if(typeof value!=='string') return false;
  if(!(isoDate.test(value)||isoDateTime.test(value))) return false;
  return Number.isFinite(Date.parse(value));
};
const types=node=>Array.isArray(node?.['@type'])?node['@type']:[node?.['@type']].filter(Boolean);
let profilePageCount=0;
let profileDateCreatedCount=0;
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  const scripts=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for(const [index,match] of scripts.entries()){
    let json;
    try{json=JSON.parse(match[1]);}catch{continue;}
    const roots=Array.isArray(json)?json:[json];
    const nodes=[];
    for(const root of roots){
      nodes.push(root);
      if(Array.isArray(root?.['@graph'])) nodes.push(...root['@graph']);
    }
    for(const node of nodes){
      if(!types(node).includes('ProfilePage')) continue;
      profilePageCount++;
      if(Object.prototype.hasOwnProperty.call(node,'dateCreated')){
        profileDateCreatedCount++;
        req(isValidSchemaDate(node.dateCreated),`${file}: JSON-LD block ${index+1} ProfilePage has invalid dateCreated: ${JSON.stringify(node.dateCreated)}`);
      }
      if(Object.prototype.hasOwnProperty.call(node,'dateModified')){
        req(isValidSchemaDate(node.dateModified),`${file}: JSON-LD block ${index+1} ProfilePage has invalid dateModified: ${JSON.stringify(node.dateModified)}`);
      }
    }
  }
}
req(profilePageCount>0,'No ProfilePage schema found; Search Console ProfilePage contract is no longer exercised');

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Strict E-E-A-T / Search Console source readiness passed: canonical brand semantics, truthful normal/emergency sitemap contracts and ${profilePageCount} ProfilePage node(s) are coherent; ${profileDateCreatedCount} optional dateCreated value(s) validated.`);
