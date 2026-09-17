import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[390,768,1024,1440];
const concurrency=Math.max(1,Number(process.env.VISUAL_AUDIT_CONCURRENCY||4));
const outDir='artifacts/exhaustive-visual';
fs.mkdirSync(outDir,{recursive:true});
function walk(d){const out=[];for(const e of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
const pages=[...new Set(walk(siteDir).filter(file=>{const h=fs.readFileSync(file,'utf8');return /<main\b/i.test(h)&&!/http-equiv=["']refresh["']/i.test(h)&&/assets\/css\//i.test(h)}).map(toUrl))].sort();
const browser=await chromium.launch({headless:true});
const manifest=[];
async function prime(p,viewportHeight){await p.evaluate(()=>{for(const img of document.images){img.loading='eager';img.decoding='async'}});const height=await p.evaluate(()=>Math.max(document.body.scrollHeight,document.documentElement.scrollHeight));for(let y=0;y<height;y+=Math.max(500,viewportHeight*.75)){await p.evaluate(v=>scrollTo(0,v),y);await p.waitForTimeout(35)}await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(180);await p.evaluate(async()=>{await Promise.all([...document.images].filter(i=>i.complete&&i.naturalWidth).map(i=>i.decode?.().catch(()=>{})))})}
async function runPool(items,limit,worker){let next=0;const runners=Array.from({length:Math.min(limit,items.length)},async()=>{for(;;){const i=next++;if(i>=items.length)return;await worker(items[i],i)}});await Promise.all(runners)}
for(const width of widths){const viewportHeight=width===390?900:1000;const ctx=await browser.newContext({viewport:{width,height:viewportHeight},deviceScaleFactor:1});await runPool(pages,concurrency,async pathname=>{const p=await ctx.newPage();try{await p.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});await prime(p,viewportHeight);const safe=pathname==='/'?'home':pathname.replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/gi,'-').slice(0,120);await p.screenshot({path:path.join(outDir,`${width}-${safe}.jpg`),type:'jpeg',quality:72,fullPage:true});const disclosureCount=await p.evaluate(()=>document.querySelectorAll('main details,footer details').length);if(disclosureCount){await p.evaluate(()=>{for(const d of document.querySelectorAll('main details,footer details'))d.open=true;scrollTo(0,0)});await p.waitForTimeout(180);await p.screenshot({path:path.join(outDir,`${width}-${safe}-expanded.jpg`),type:'jpeg',quality:72,fullPage:true})}manifest.push({pathname,width,disclosures:disclosureCount,states:disclosureCount?['default','expanded']:['default']})}finally{await p.close()}});await ctx.close()}
await browser.close();
manifest.sort((a,b)=>a.width-b.width||a.pathname.localeCompare(b.pathname));
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify({repo:'BANHALMI',pages:pages.length,widths,records:manifest},null,2));
console.log(`Captured ${pages.length} BANHALMI content pages at ${widths.join('/')}px with concurrency ${concurrency}; every main/footer disclosure also has an expanded-state full-page capture.`);
await import('./audit-expanded-responsive.mjs');
