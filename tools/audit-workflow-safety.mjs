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

const vercel=JSON.parse(await readFile(path.join(root,'vercel.json'),'utf8'));
if(vercel?.git?.deploymentEnabled!==true) errors.push('vercel.json must keep Git deployment enabled');

const serializedVercel=JSON.stringify(vercel);
for(const forbidden of ['sync-sitemap-lastmod.mjs','optimize-production-artifact.mjs','restore-production-design-authority.mjs','harden-production-artifact.mjs']){
  if(serializedVercel.includes(forbidden)) errors.push(`vercel.json must not invoke source/artifact mutator: ${forbidden}`);
}

const aliases=new Map([
  ['banhalmi.at','https://www.norbertbanhalmi.com/de-at/:path*'],
  ['www.banhalmi.at','https://www.norbertbanhalmi.com/de-at/:path*'],
  ['banhalminorbert.hu','https://www.norbertbanhalmi.com/hu/:path*'],
  ['www.banhalminorbert.hu','https://www.norbertbanhalmi.com/hu/:path*']
]);
const redirects=Array.isArray(vercel.redirects)?vercel.redirects:[];
for(const [host,destination] of aliases){
  const rule=redirects.find((candidate)=>
    candidate?.source==='/:path*'&&candidate?.destination===destination&&candidate?.permanent===true&&
    Array.isArray(candidate?.has)&&candidate.has.some((condition)=>condition?.type==='header'&&String(condition?.key||'').toLowerCase()==='host'&&condition?.value===host)
  );
  if(!rule) errors.push(`vercel.json missing permanent canonical alias route for ${host}`);
}

if(workflows.size){
  const pages=workflows.get('pages.yml');
  if(pages){
    if(!/git archive --format=tar HEAD \| tar -xf - -C _site/.test(pages)) errors.push('pages.yml must build the public artifact from committed HEAD');
    if(!/printf '%s\\n' \"\$GITHUB_SHA\" > _site\/deployment-sha\.txt/.test(pages)) errors.push('pages.yml must stamp the exact source SHA into the artifact');
  }
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Deployment safety audit passed: Vercel routing is canonical and source-safe${workflows.size?'; optional GitHub workflows also satisfy mutation guards':''}.`);
