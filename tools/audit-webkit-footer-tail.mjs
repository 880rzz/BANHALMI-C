import fs from 'node:fs';
import path from 'node:path';
import { webkit } from 'playwright';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=process.env.AUDIT_SITE_DIR|| (fs.existsSync('_site')?'_site':'.');
const skip=new Set(['.git','node_modules','.github','artifacts','tools','tests']);
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html'))files.push(full)}}
walk(siteDir);
const content=files.filter(file=>{const rel=path.relative(siteDir,file).replaceAll('\\','/');const html=fs.readFileSync(file,'utf8');if(rel.startsWith('redirects/'))return false;if(/http-equiv=["']refresh["']/i.test(html)&&html.length<7000)return false;return /<main\b/i.test(html)&&!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)});
function urlFor(file){let rel=path.relative(siteDir,file).replaceAll('\\','/').replace(/index\.html$/,'');return (base+'/'+rel).replace(/([^:]\/)\/+/g,'$1')}
const critical=new Set(['index.html','portrait/index.html','lifestyle/index.html','event-photography/index.html','hu/index.html','hu/portre/index.html','hu/brand/index.html','hu/rendezvenyfotozas/index.html','de-at/index.html','de-at/portrait/index.html','de-at/brand/index.html','de-at/eventfotografie/index.html']);
const browser=await webkit.launch({headless:true});const failures=[];let checks=0;
for(const width of [1280,1440]){
 const height=width===1280?800:900;
 for(const file of content){
  const rel=path.relative(siteDir,file).replaceAll('\\','/');
  if(width===1280&&!critical.has(rel))continue;
  const page=await browser.newPage({viewport:{width,height}});
  try{
   await page.goto(urlFor(file),{waitUntil:'networkidle',timeout:30000});
   await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
   await page.waitForTimeout(100);
   const s=await page.evaluate(()=>{const footer=document.querySelector('.site-footer'),de=document.documentElement;if(!footer)return{missing:true};const fr=footer.getBoundingClientRect(),footerBottom=fr.bottom+scrollY,kids=[...document.body.children],fi=kids.indexOf(footer);const post=fi<0?[]:kids.slice(fi+1).filter(el=>{if(['SCRIPT','STYLE','LINK','NOSCRIPT'].includes(el.tagName))return false;const cs=getComputedStyle(el),r=el.getBoundingClientRect();if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false;if(['fixed','absolute'].includes(cs.position))return false;return r.width>0&&r.height>0}).map(el=>({tag:el.tagName,cls:el.className||'',pos:getComputedStyle(el).position,h:el.getBoundingClientRect().height}));const beyond=[...document.querySelectorAll('body *')].map(el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect(),bottom=r.bottom+scrollY;if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0||r.width<=0||r.height<=0||footer.contains(el))return null;if(bottom<=footerBottom+2)return null;return{tag:el.tagName,id:el.id||'',cls:typeof el.className==='string'?el.className.slice(0,120):'',pos:cs.position,display:cs.display,top:Number((r.top+scrollY).toFixed(1)),bottom:Number(bottom.toFixed(1)),height:Number(r.height.toFixed(1))}}).filter(Boolean).sort((a,b)=>b.bottom-a.bottom).slice(0,12);return{tail:Math.max(0,de.scrollHeight-footerBottom),viewportGap:Math.max(0,innerHeight-fr.bottom),post,beyond,scrollHeight:de.scrollHeight,footerBottom:Number(footerBottom.toFixed(1)),scrollY:Number(scrollY.toFixed(1))}});
   checks++;
   if(s.missing)failures.push(rel+' @'+width+': footer missing');else{if(s.tail>2)failures.push(rel+' @'+width+': '+s.tail.toFixed(1)+'px document tail after footer; diagnostics='+JSON.stringify({scrollHeight:s.scrollHeight,footerBottom:s.footerBottom,scrollY:s.scrollY,beyond:s.beyond}));if(s.viewportGap>2)failures.push(rel+' @'+width+': '+s.viewportGap.toFixed(1)+'px viewport gap below footer at scroll end');if(s.post.length)failures.push(rel+' @'+width+': in-flow body children after footer '+JSON.stringify(s.post));}
  }catch(err){failures.push(rel+' @'+width+': '+err.message)}finally{await page.close()}
 }
}
await browser.close();
if(failures.length){console.error('Safari/WebKit footer-tail audit failed ('+failures.length+'/'+checks+'):');for(const f of failures)console.error('- '+f);process.exit(1)}
console.log('Safari/WebKit footer-tail audit passed: '+checks+' renders.');
