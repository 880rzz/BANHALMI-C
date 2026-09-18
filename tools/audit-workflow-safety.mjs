import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const workflowDir=path.join(root,'.github/workflows');
const errors=[];
const workflows=new Map();

async function exists(target){
  try{await stat(target);return true;}catch{return false;}
}

if(await exists(workflowDir)){
  for(const name of await readdir(workflowDir)){
    if(!/\.ya?ml$/.test(name)||name.startsWith('_')) continue;
    const text=await readFile(path.join(workflowDir,name),'utf8');
    workflows.set(name,text);
    if(/contents:\s*write/i.test(text)) errors.push(name+': contents write permission is forbidden');
    if(/git\s+push/i.test(text)) errors.push(name+': permanent workflow must not push');
    if(/git\s+commit/i.test(text)) errors.push(name+': permanent workflow must not commit');
    for(const forbidden of [/npm\s+run\s+fix:/i,/npm\s+run\s+sync:/i,/sync-sitemap-lastmod\.mjs/i,/\s--write(?:\s|$)/i]){
      if(forbidden.test(text)) errors.push(name+': permanent workflow invokes a source-mutating maintenance command: '+forbidden);
    }
  }
}

const packageText=await readFile(path.join(root,'package.json'),'utf8');
if(!packageText.includes('git diff --exit-code')) errors.push('package.json test contract must prove tracked source remains identical to committed HEAD after audits');

for(const [relativePath,destination] of [
  ['redirects/at/vercel.json','https://www.norbertbanhalmi.com/de-at/:path*'],
  ['redirects/hu/vercel.json','https://www.norbertbanhalmi.com/hu/:path*']
]){
  let config;
  try{config=JSON.parse(await readFile(path.join(root,relativePath),'utf8'));}catch(error){errors.push(`${relativePath}: invalid or missing (${error.message})`);continue;}
  if(config?.git?.deploymentEnabled!==true) errors.push(`${relativePath}: Git deployment must remain enabled for BANHALMI-C`);
  const serialized=JSON.stringify(config);
  for(const forbidden of ['sync-sitemap-lastmod.mjs','optimize-production-artifact.mjs','restore-production-design-authority.mjs','harden-production-artifact.mjs']){
    if(serialized.includes(forbidden)) errors.push(`${relativePath}: must not invoke source/artifact mutator ${forbidden}`);
  }
  const redirects=Array.isArray(config.redirects)?config.redirects:[];
  const rule=redirects.find((candidate)=>candidate?.source==='/:path*'&&candidate?.destination===destination&&candidate?.permanent===true);
  if(!rule) errors.push(`${relativePath}: missing permanent canonical catch-all redirect`);
}

if(workflows.size){
  const pages=workflows.get('pages.yml');
  if(pages){
    if(!/git archive --format=tar HEAD \| tar -xf - -C _site/.test(pages)) errors.push('pages.yml must build the public artifact from committed HEAD');
    if(!/printf '%s\\n' \"\$GITHUB_SHA\" > _site\/deployment-sha\.txt/.test(pages)) errors.push('pages.yml must stamp the exact source SHA into the artifact');
  }
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Deployment safety audit passed: dedicated Vercel entry-domain configs are canonical and source-safe${workflows.size?'; optional GitHub workflows also satisfy mutation guards':''}.`);
