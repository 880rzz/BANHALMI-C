import fs from 'node:fs';
import path from 'node:path';

const errors=[];
const core=JSON.parse(fs.readFileSync('data/machine-core.json','utf8'));
const overlay=JSON.parse(fs.readFileSync('llm-canonical-overlay.json','utf8'));
const ai=JSON.parse(fs.readFileSync('ai-entry.json','utf8'));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const req=(ok,msg)=>{if(!ok)errors.push(msg)};

req(core.brand?.name==='BANHALMI','Canonical primary brand drift');
req(core.brand?.positioning==='Photography Team','Canonical brand positioning is not Photography Team');
req(!(JSON.stringify(core).includes('"positioning":"Professional Photography Team"')),'Retired brand positioning remains in canonical machine core');
req(overlay.forbiddenBrandValues?.includes('Professional Photography Team'),'Overlay no longer forbids retired brand positioning');
req(ai?.identity?.brand?.positioning==='Photography Team','Committed AI entry still contains retired brand positioning');
req(!/<lastmod>/.test(sitemap),'Source sitemap must remain lastmod-free unless freshness can be derived truthfully from production source history');
req(fs.existsSync('external-photography-evidence.json')&&fs.existsSync('press-institutional-evidence.json')&&fs.existsSync('media-usage-evidence.json'),'Protected evidence registry missing');

for(const [file,destination] of [
  ['redirects/at/vercel.json','https://www.norbertbanhalmi.com/de-at/:path*'],
  ['redirects/hu/vercel.json','https://www.norbertbanhalmi.com/hu/:path*']
]){
  let config;
  try{config=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){errors.push(`${file}: invalid or missing (${error.message})`);continue;}
  req(config?.git?.deploymentEnabled===true,`${file}: Git deployment must be enabled on the active BANHALMI-C redirect project`);
  const redirects=Array.isArray(config.redirects)?config.redirects:[];
  const rule=redirects.find((candidate)=>candidate?.source==='/:path*'&&candidate?.destination===destination&&candidate?.permanent===true);
  req(Boolean(rule),`${file}: canonical permanent catch-all redirect missing`);
}

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
console.log(`Strict E-E-A-T / Search Console source readiness passed: canonical brand semantics, stable sitemap source, dedicated Vercel entry-domain projects and ${profilePageCount} ProfilePage node(s) are coherent; ${profileDateCreatedCount} optional dateCreated value(s) validated.`);
