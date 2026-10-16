import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'banhalmi-partner-generator-'));
try{
  const required=['partners.json','tools/generate-partners-pages.mjs','archive/index.html','de-at/archiv/index.html','hu/archivum/index.html'];
  for(const rel of required){const dest=path.join(temp,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,rel),dest);}
  fs.cpSync(path.join(root,'assets/img/partners'),path.join(temp,'assets/img/partners'),{recursive:true});
  const targets=['partners/index.html','de-at/partner/index.html','hu/partnerek/index.html'];
  const before=new Map();
  for(const rel of targets){const dest=path.join(temp,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,rel),dest);before.set(rel,fs.readFileSync(dest,'utf8'));}
  execFileSync(process.execPath,['tools/generate-partners-pages.mjs'],{cwd:temp,stdio:'pipe'});
  for(const rel of targets)assert.equal(fs.readFileSync(path.join(temp,rel),'utf8'),before.get(rel),rel+': default generator run overwrote a reviewed page');
  execFileSync(process.execPath,['tools/generate-partners-pages.mjs','--write'],{cwd:temp,stdio:'pipe'});
  const expected={
    'partners/index.html':{h1:'Clients, collaborations and professional memberships',locale:'en_US'},
    'de-at/partner/index.html':{h1:'Kunden, Kooperationen und professionelle Mitgliedschaften',locale:'de_AT'},
    'hu/partnerek/index.html':{h1:'Partnerek, megbízók és szakmai tagságok',locale:'hu_HU'}
  };
  for(const rel of targets){
    const html=fs.readFileSync(path.join(temp,rel),'utf8');
    const css=[...html.matchAll(/<link\\b[^>]*href=[\"']([^\"']+\\.css[^\"']*)[\"'][^>]*>/gi)].map(x=>x[1]);
    assert.equal(css.length,1,rel+': generated output must load one stylesheet');
    assert.match(css[0],/^\\/assets\\/css\\/site\\.css\\?v=design-[a-z0-9-]+$/,rel+': generated output must use canonical site.css');
    assert.equal((html.match(/property=[\"']og:locale[\"']/g)||[]).length,1,rel+': active Open Graph locale missing or duplicated');
    assert.equal((html.match(/property=[\"']og:locale:alternate[\"']/g)||[]).length,2,rel+': alternate Open Graph locales missing');
    const h1=html.match(/<h1[^>]*>([\\s\\S]*?)<\\/h1>/i)?.[1]?.replace(/<[^>]+>/g,'').replace(/\\s+/g,' ').trim();
    assert.equal(h1,expected[rel].h1,rel+': generated H1 changed');
    assert.ok(html.includes('content=\"'+expected[rel].locale+'\" property=\"og:locale\"'),rel+': wrong Open Graph locale');
  }
  console.log('Partner generator safety audit passed: default is non-mutating; explicit output retains one CSS authority, localized H1s and Open Graph locales.');
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}
