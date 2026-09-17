import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[375,390,768,1024,1440];
const screenshotWidths=new Set([390,768,1440]);
const outDir='artifacts/expanded-state-visual';
fs.mkdirSync(outDir,{recursive:true});
const failures=[];
let expandedPages=0, screenshots=0, checkedStates=0;
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
const pages=[...new Set(walk(siteDir).filter(file=>{const h=fs.readFileSync(file,'utf8');return /<main\b/i.test(h)&&!/http-equiv=["']refresh["']/i.test(h)&&/assets\/css\//i.test(h)}).map(toUrl))].sort();
const browser=await chromium.launch({headless:true});
for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await ctx.newPage();
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(120)}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    const count=await page.locator('main details, footer details').count();
    if(!count){await page.close();continue}
    if(width===390)expandedPages++;
    await page.evaluate(()=>{for(const d of document.querySelectorAll('main details,footer details'))d.open=true;});
    await page.waitForTimeout(100);
    const issues=await page.evaluate(()=>{
      const out=[];const w=innerWidth;const px=v=>parseFloat(v)||0;
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,90):''}`;
      if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)out.push(`document overflow ${document.documentElement.scrollWidth-document.documentElement.clientWidth}px`);
      for(const d of document.querySelectorAll('main details,footer details')){
        if(!visible(d))continue;if(!d.open)out.push(`${name(d)} did not remain open`);
        const dr=d.getBoundingClientRect();if(dr.left<-1||dr.right>w+1)out.push(`${name(d)} escapes viewport [${dr.left.toFixed(1)},${dr.right.toFixed(1)}]`);
        const summary=d.querySelector(':scope>summary');if(summary&&visible(summary)){const r=summary.getBoundingClientRect();if(w<=768&&r.height<43.5)out.push(`${name(summary)} touch height ${r.height.toFixed(1)}px`);}
        for(const el of d.querySelectorAll('p,li,a,small,span,strong')){
          if(!visible(el)||(el.innerText||'').trim().length<40)continue;const r=el.getBoundingClientRect(),s=getComputedStyle(el);
          if(r.left<-1||r.right>w+1)out.push(`${name(el)} expanded content escapes viewport`);
          if(s.whiteSpace==='nowrap'&&r.width>w-30)out.push(`${name(el)} nowrap risks clipping`);
          if((el.innerText||'').trim().length>120&&r.width<Math.min(250,w-40))out.push(`${name(el)} expanded reading column ${r.width.toFixed(0)}px too narrow`);
        }
      }
      for(const d of document.querySelectorAll('footer details')){
        if(!visible(d))continue;const fs=getComputedStyle(d),fr=d.getBoundingClientRect(),footer=d.closest('footer');const footerStyle=footer?getComputedStyle(footer):null;
        if(footerStyle&&footerStyle.textAlign==='center'){
          const centre=innerWidth/2,dc=(fr.left+fr.right)/2;if(Math.abs(dc-centre)>4)out.push(`${name(d)} footer disclosure off-centre by ${Math.abs(dc-centre).toFixed(1)}px`);
          for(const el of d.querySelectorAll('summary,p,div')){if(!visible(el))continue;const s=getComputedStyle(el);if((el.innerText||'').trim()&&s.textAlign!=='center'&&s.textAlign!=='start')out.push(`${name(el)} unexpected footer alignment ${s.textAlign}`);}
        }
        if(px(fs.maxWidth)>0&&fr.width>px(fs.maxWidth)+2)out.push(`${name(d)} exceeds max-width`);
      }
      return [...new Set(out)].slice(0,120);
    });
    checkedStates+=count;
    if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);
    if(screenshotWidths.has(width)){
      await page.evaluate(()=>{for(const img of document.images){img.loading='eager';img.decoding='async'}});
      await page.waitForTimeout(120);
      const safe=pathname==='/'?'home':pathname.replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/gi,'-').slice(0,110);
      await page.screenshot({path:path.join(outDir,`${width}-${safe}-expanded.jpg`),type:'jpeg',quality:72,fullPage:true});screenshots++;
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir,'expanded-state-report.json'),JSON.stringify({pages:pages.length,expandedPages,widths,checkedStates,screenshots,failures},null,2));
if(failures.length){console.error(`Expanded-state responsive audit found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`Expanded-state responsive audit passed: ${expandedPages} pages with disclosures, ${checkedStates} disclosure states across ${widths.join('/')}px; ${screenshots} expanded screenshots captured at 390/768/1440.`);
