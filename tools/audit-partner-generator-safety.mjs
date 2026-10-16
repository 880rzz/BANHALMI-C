import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root=process.cwd();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'banhalmi-partner-generator-'));
const required=['partners.json','tools/generate-partners-pages.mjs','archive/index.html','de-at/archiv/index.html','hu/archivum/index.html'];
const targets=['partners/index.html','de-at/partner/index.html','hu/partnerek/index.html'];
function copyInputs(dest,includeTargets){
  fs.mkdirSync(dest,{recursive:true});
  for(const rel of required){const target=path.join(dest,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,rel),target);}
  fs.cpSync(path.join(root,'assets/img/partners'),path.join(dest,'assets/img/partners'),{recursive:true});
  if(includeTargets)for(const rel of targets){const target=path.join(dest,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,rel),target);}
}
function run(args,cwd){return spawnSync(process.execPath,['tools/generate-partners-pages.mjs',...args],{cwd,encoding:'utf8'});}
try{
  copyInputs(temp,true);
  const before=new Map(targets.map(rel=>[rel,fs.readFileSync(path.join(temp,rel),'utf8')]));
  const preview=run([],temp);
  assert.equal(preview.status,0,preview.stderr);
  for(const rel of targets)assert.equal(fs.readFileSync(path.join(temp,rel),'utf8'),before.get(rel),rel+': default generator run overwrote a reviewed page');
  const guardedWrite=run(['--write'],temp);
  assert.notEqual(guardedWrite.status,0,'--write must refuse to overwrite a reviewed page that differs from generated output');
  assert.match(guardedWrite.stderr,/Refusing to overwrite reviewed page/);
  for(const rel of targets)assert.equal(fs.readFileSync(path.join(temp,rel),'utf8'),before.get(rel),rel+': guarded --write changed a reviewed page');
  const fresh=path.join(temp,'fresh');
  copyInputs(fresh,false);
  const generated=run(['--write'],fresh);
  assert.equal(generated.status,0,generated.stderr);
  const expected={
    'partners/index.html':{h1:'Clients, collaborations and professional memberships',locale:'en_US'},
    'de-at/partner/index.html':{h1:'Kunden, Kooperationen und professionelle Mitgliedschaften',locale:'de_AT'},
    'hu/partnerek/index.html':{h1:'Partnerek, megbízók és szakmai tagságok',locale:'hu_HU'}
  };
  for(const rel of targets){
    const html=fs.readFileSync(path.join(fresh,rel),'utf8');
    const css=[...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css[^"']*)["'][^>]*>/gi)].map(x=>x[1]);
    assert.equal(css.length,1,rel+': generated output must load one stylesheet');
    assert.match(css[0],/^\/assets\/css\/site\.css\?v=design-[a-z0-9-]+$/,rel+': generated output must use canonical site.css');
    assert.equal((html.match(/property=["']og:locale["']/g)||[]).length,1,rel+': active Open Graph locale missing or duplicated');
    assert.equal((html.match(/property=["']og:locale:alternate["']/g)||[]).length,2,rel+': alternate Open Graph locales missing');
    const h1=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
    assert.equal(h1,expected[rel].h1,rel+': generated H1 changed');
    assert.ok(html.includes('content="'+expected[rel].locale+'" property="og:locale"'),rel+': wrong Open Graph locale');
  }
  console.log('Partner generator safety audit passed: default and guarded --write preserve reviewed pages; new output uses canonical CSS and locale metadata.');
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}
