/**
 * Verify the one maintained BANHALMI stylesheet in immutable artifacts and
 * over HTTP on the actual custom domain. This is a release gate, not a CSS
 * generator: it never modifies files or tolerates a second style authority.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const marker='/* BANHALMI-CANONICAL-FLUID-COMPONENTS-20261016 */';
const routes=[
  '/', '/hu/', '/de-at/',
  '/portrait/', '/hu/portre/', '/de-at/portrait/',
  '/lifestyle/', '/hu/brand/', '/de-at/brand/',
  '/event-photography/', '/hu/rendezvenyfotozas/', '/de-at/eventfotografie/',
  '/fine-art/', '/hu/muveszi-fotografia/', '/de-at/fine-art/'
];

function attr(tag,name){
  const expression=new RegExp('\\b'+name+'\\s*=\\s*(["\'])(.*?)\\1','i');
  return tag.match(expression)?.[2]??null;
}
function stylesheetHref(html,label){
  if(html.includes('/assets/css/fluid-4k-rhythm.css')||html.includes('data-fluid-4k-rhythm'))
    throw Error(label+': retired stylesheet authority returned');
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(x=>x[0]);
  const styles=links.filter(tag=>(attr(tag,'rel')||'').toLowerCase().split(/\s+/).includes('stylesheet'));
  if(styles.length!==1)throw Error(label+': expected one stylesheet, got '+styles.length);
  const href=attr(styles[0],'href');
  if(!/^\/assets\/css\/site\.css\?v=design-[a-f0-9]{16}$/.test(href||''))
    throw Error(label+': invalid canonical CSS URL '+String(href));
  return href;
}
function fingerprint(bytes){
  return 'design-'+createHash('sha256').update(bytes).digest('hex').slice(0,16);
}
function confirmCss(bytes,version){
  const source=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);
  const text=source.toString('utf8');
  if(text.split(marker).length!==2)throw Error('CSS component boundary is absent or duplicated');
  const actual=fingerprint(source);
  if(version!==actual)throw Error('CSS content hash mismatch: URL='+version+' bytes='+actual);
}
function allHtml(root){
  const files=[];
  function walk(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory())walk(full);
      else if(entry.isFile()&&entry.name.endsWith('.html'))files.push(full);
    }
  }
  walk(root);
  return files;
}
function checkArtifact(root){
  const cssDir=path.join(root,'assets/css');
  const names=fs.readdirSync(cssDir).filter(name=>name.endsWith('.css'));
  assert.deepEqual(names,['site.css'],'Artifact must contain exactly one CSS source');
  const bytes=fs.readFileSync(path.join(cssDir,'site.css'));
  const version=fingerprint(bytes);
  confirmCss(bytes,version);
  const files=allHtml(root);
  if(files.length<100)throw Error('Insufficient HTML coverage: '+files.length);
  const target='/assets/css/site.css?v='+version;
  for(const file of files){
    const rel=path.relative(root,file).replaceAll('\\','/');
    if(stylesheetHref(fs.readFileSync(file,'utf8'),rel)!==target)
      throw Error(rel+': HTML CSS token disagrees with emitted CSS bytes');
  }
  console.log('SINGLE-CSS ARTIFACT PASS: '+files.length+' pages, one CSS file, SHA-256 token '+version);
}
async function get(url){
  const res=await fetch(url,{
    redirect:'follow',
    headers:{'Cache-Control':'no-cache','Pragma':'no-cache'},
    signal:AbortSignal.timeout(30000)
  });
  if(!res.ok)throw Error(url+': HTTP '+res.status);
  return res;
}
async function checkLive(origin){
  const base=new URL(origin);
  if(base.protocol!=='https:')throw Error('Exact-live CSS gate requires HTTPS');
  const versions=new Set();
  for(let i=0;i<routes.length;i+=5){
    const batch=routes.slice(i,i+5);
    await Promise.all(batch.map(async route=>{
      const url=new URL(route,base);
      const html=await (await get(url.toString())).text();
      const href=stylesheetHref(html,route);
      versions.add(href);
    }));
  }
  if(versions.size!==1)throw Error('Localized pages advertise different CSS tokens: '+[...versions].join(', '));
  const href=[...versions][0];
  const bytes=Buffer.from(await (await get(new URL(href,base).toString())).arrayBuffer());
  confirmCss(bytes,href.split('?v=')[1]);
  console.log('SINGLE-CSS EXACT-LIVE PASS: '+routes.length+' routes, one identical CSS link, verified served CSS SHA-256');
}
function selfTest(){
  const href='/assets/css/site.css?v=design-'+'a'.repeat(16);
  const good='<html><head><link rel="stylesheet" href="'+href+'"></head></html>';
  assert.equal(stylesheetHref(good,'valid'),href);
  assert.throws(()=>stylesheetHref(good.replace('</head>','<link rel="stylesheet" href="'+href+'"></head>'),'duplicate'),/one stylesheet/);
  assert.throws(()=>stylesheetHref(good.replace(href,'/assets/css/fluid-4k-rhythm.css'),'legacy'),/retired stylesheet/);
  assert.throws(()=>stylesheetHref(good.replace('design-'+ 'a'.repeat(16),'invalid'),'broken'),/invalid canonical/);
  console.log('SINGLE-CSS SELF-TEST PASS');
}

try{
  if(process.argv[2]==='--self-test')selfTest();
  else if(process.argv[2]==='--live')await checkLive(process.argv[3]||'');
  else checkArtifact(path.resolve(process.argv[2]||'_site'));
}catch(error){console.error('SINGLE-CSS GATE FAILED: '+error.message);process.exitCode=1;}
