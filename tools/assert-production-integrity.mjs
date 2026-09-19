import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const artifact=path.resolve(process.argv[2]||'_site');
const excludedTop=new Set(['.git','.github','tools','tests','node_modules','artifacts','_site']);
const excludedRootFiles=new Set(['package.json','package-lock.json']);
const failures=[];

function walk(dir,base=dir){
  const out=[];
  if(!fs.existsSync(dir)) return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    const rel=path.relative(base,full).split(path.sep).join('/');
    if(entry.isDirectory()){
      if(base===root&&excludedTop.has(entry.name)) continue;
      out.push(...walk(full,base));
    }else if(entry.isFile()){
      if(base===root&&excludedRootFiles.has(rel)) continue;
      out.push(rel);
    }
  }
  return out.sort();
}
function hash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}

if(!fs.existsSync(artifact)) failures.push(`artifact missing: ${artifact}`);
const expected=walk(root);
const actual=fs.existsSync(artifact)?walk(artifact,artifact).filter(x=>x!=='deployment-sha.txt'):[];
const expectedSet=new Set(expected),actualSet=new Set(actual);

for(const rel of expected) if(!actualSet.has(rel)) failures.push(`artifact missing committed public file: ${rel}`);
for(const rel of actual) if(!expectedSet.has(rel)) failures.push(`artifact contains non-source file: ${rel}`);
for(const rel of expected){
  if(!actualSet.has(rel)) continue;
  const src=path.join(root,rel),dst=path.join(artifact,rel);
  if(hash(src)!==hash(dst)) failures.push(`artifact byte drift: ${rel}`);
}

const shaFile=path.join(artifact,'deployment-sha.txt');
if(!fs.existsSync(shaFile)) failures.push('deployment-sha.txt missing from artifact');
else{
  const actualSha=fs.readFileSync(shaFile,'utf8').trim();
  const expectedSha=(process.env.GITHUB_SHA||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()).trim();
  if(actualSha!==expectedSha) failures.push(`deployment SHA mismatch: ${actualSha} != ${expectedSha}`);
}

if(failures.length){
  console.error(`BANHALMI immutable production integrity failed (${failures.length}):`);
  failures.forEach(x=>console.error(`- ${x}`));
  process.exit(1);
}
console.log(`BANHALMI immutable production integrity passed: ${expected.length} committed public files are byte-identical in the deployment artifact.`);
