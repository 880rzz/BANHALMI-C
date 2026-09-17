import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const design=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const approvedPageMax=Number(design.pageMaxPx);
const approvedStructuredMax=Number(design.structuredMaxPx)||approvedPageMax;
const structuredBreakpointPx=1440;
const structuredSelector=':scope > :is(.service-process-grid,.partner-grid,.partner-grid-memberships,.archive-cards,.two-reading-grid,.smart-quote-layout)';
if(!Number.isFinite(approvedPageMax)||approvedPageMax<960||approvedPageMax>1800) throw new Error(`Invalid design-authority pageMaxPx: ${design.pageMaxPx}`);
if(!Number.isFinite(approvedStructuredMax)||approvedStructuredMax<approvedPageMax||approvedStructuredMax>1800) throw new Error(`Invalid design-authority structuredMaxPx: ${design.structuredMaxPx}`);
const widths=[375,390,768,1024,1440];
const failures=[];
const reports=[];
function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
function discover(){const pages=[];for(const file of walk(siteDir)){const html=fs.readFileSync(file,'utf8');if(!/<main\b/i.test(html)||/http-equiv=["']refresh["']/i.test(html)||/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html))continue;pages.push(toUrl(file))}return [...new Set(pages)].sort()}
const pages=discover();
const browser=await chromium.launch({headless:true});
for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await context.newPage();
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(150)}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    const result=await page.evaluate(({approvedPageMax,approvedStructuredMax,structuredBreakpointPx,structuredSelector})=>{
      const issues=[];const px=v=>parseFloat(v)||0;const abs=Math.abs;
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,100):''}`;
      const w=innerWidth,bodyBg=getComputedStyle(document.body).backgroundColor;
      const protectedHomepage=w>=1180&&Boolean(document.querySelector('main[data-homepage-redesign="stage76"]'));
      const left=s=>s.textAlign==='left'||s.textAlign==='start';
      const shortCentered=el=>!!el.closest('.hero,.hero-centered,.cta-band,.statement,.error-page,.site-footer')&&((el.innerText||'').trim().length<=220);
      const isLead=el=>el.classList.contains('lead')||el.closest('.lead');
      const isSecondary=el=>el.matches('.microcopy,.form-data-note,.field-help,.form-submit-wait-note,.quote-disclaimer')||!!el.closest('.microcopy,.form-data-note,.field-help,.form-submit-wait-note,.quote-disclaimer');
      if(document.documentElement.scrollWidth>document.documentElement.clientWidth+1)issues.push(`document horizontal overflow ${document.documentElement.scrollWidth-document.documentElement.clientWidth}px`);

      const text=[...document.querySelectorAll('main p,main li,main blockquote')].filter(visible);
      const longText=text.filter(el=>(el.innerText||'').replace(/\s+/g,' ').trim().length>=120);
      for(const el of longText){
        const s=getComputedStyle(el),r=el.getBoundingClientRect(),fs=px(s.fontSize),lh=px(s.lineHeight)/(fs||1),fw=Number(s.fontWeight)||400,ls=px(s.letterSpacing),lead=isLead(el),secondary=isSecondary(el);
        if(s.textAlign==='justify')issues.push(`${name(el)} uses justified text`);
        if(!left(s)&&!shortCentered(el))issues.push(`${name(el)} long prose text-align=${s.textAlign}`);
        if(lead){
          if(fs<19||fs>28.5)issues.push(`${name(el)} lead font-size ${fs.toFixed(1)}px outside 19–28.5px`);
          if(lh<1.28||lh>1.52)issues.push(`${name(el)} lead line-height ${lh.toFixed(2)} outside 1.28–1.52`);
        }else if(secondary){
          if(fs<14||fs>17.5)issues.push(`${name(el)} secondary font-size ${fs.toFixed(1)}px outside 14–17.5px`);
          if(lh<1.35||lh>1.75)issues.push(`${name(el)} secondary line-height ${lh.toFixed(2)} outside 1.35–1.75`);
        }else{
          if(fs<15.75||fs>21.5)issues.push(`${name(el)} long prose font-size ${fs.toFixed(1)}px outside 16–21.5px`);
          if(lh<1.4||lh>1.72)issues.push(`${name(el)} long prose line-height ${lh.toFixed(2)} outside 1.40–1.72`);
        }
        if(fw<300||fw>600)issues.push(`${name(el)} long prose weight ${fw}`);
        if(abs(ls)>1)issues.push(`${name(el)} long prose tracking ${ls.toFixed(2)}px`);
        if(w>=1024&&!lead&&r.width>860)issues.push(`${name(el)} long prose width ${r.width.toFixed(0)}px > 860px`);
        if(w<=768&&!el.closest('.gallery,.collage,.full-bleed,[data-full-bleed="true"]')&&(r.left<15||r.right>w-15))issues.push(`${name(el)} page gutter [${r.left.toFixed(1)},${(w-r.right).toFixed(1)}]px`);
        if((el.innerText||'').trim().length>500&&r.width<Math.min(280,w-40))issues.push(`${name(el)} reading column too narrow ${r.width.toFixed(0)}px`);
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3,header h1')){
        if(!visible(h))continue;const s=getComputedStyle(h),r=h.getBoundingClientRect(),fs=px(s.fontSize),lh=px(s.lineHeight)/(fs||1),fw=Number(s.fontWeight)||400,ls=px(s.letterSpacing);if(fs<1)continue;
        const tag=h.tagName.toLowerCase(),quoteHeading=!!h.closest('.smart-quote-layout'),homepageHeroH1=protectedHomepage&&tag==='h1'&&!!h.closest('main[data-homepage-redesign="stage76"]>.hero-copy-only'),homepageDecisionH2=protectedHomepage&&tag==='h2'&&!!h.closest('.fp-decision-system')&&h.closest('main')?.dataset.homepageRedesign==='stage76',lim=tag==='h1'?(w<=430?[32,40]:w<=768?[32,44]:[32,58]):tag==='h2'?(w<=430?[22,30]:w<=768?[22,32]:[22,38]):quoteHeading?[16,34]:[17.75,34];
        const lhLim=homepageHeroH1?[0.975,1.18]:tag==='h1'?[0.98,1.18]:[1.02,1.30];
        const trackingLimit=homepageHeroH1?0.055:homepageDecisionH2?0.041:0.025;
        if(fs<lim[0]||fs>lim[1])issues.push(`${name(h)} font-size ${fs.toFixed(1)}px outside ${lim[0]}–${lim[1]}px`);
        if(lh<lhLim[0]||lh>lhLim[1])issues.push(`${name(h)} heading line-height ${lh.toFixed(2)}`);
        if(fw<500||fw>750)issues.push(`${name(h)} heading weight ${fw}`);
        if(fs&&abs(ls/fs)>trackingLimit)issues.push(`${name(h)} heading tracking ${(ls/fs).toFixed(3)}em too strong`);
        const sec=h.closest('section');const sr=sec?.getBoundingClientRect();const viewportDisplay=(r.width>=w-2&&!!sr&&sr.width>=w-2);const centeredViewportDisplay=(s.textAlign==='center'&&viewportDisplay);const fullWidthDisplay=!!h.closest('.text-reveal,.full-bleed,[data-full-bleed="true"]')||h.classList.contains('text-reveal')||viewportDisplay||centeredViewportDisplay;
        if(w<=768&&!fullWidthDisplay&&!h.closest('.gallery,.collage')&&(r.left<15||r.right>w-15))issues.push(`${name(h)} heading violates page gutter [${r.left.toFixed(1)},${(w-r.right).toFixed(1)}]`);
      }

      for(const sec of [...document.querySelectorAll('main>section')].filter(visible)){
        const r=sec.getBoundingClientRect(),s=getComputedStyle(sec),bg=s.backgroundColor,pt=px(s.paddingTop),pb=px(s.paddingBottom);const colored=bg!=='rgba(0, 0, 0, 0)'&&bg!==bodyBg;
        if(colored&&r.width<w-2){const before=getComputedStyle(sec,'::before'),bw=px(before.width),bbg=before.backgroundColor;const visualBleed=before.content!=='none'&&bw>=w-2&&bbg!=='rgba(0, 0, 0, 0)';if(!visualBleed)issues.push(`${name(sec)} colored top-level section not visually full viewport (${r.width.toFixed(0)}/${w})`);}
        if(s.contentVisibility==='auto')issues.push(`${name(sec)} content-visibility:auto can create blank bands`);
        const special=!!sec.closest('.gallery,.collage')||sec.classList.contains('gallery')||sec.classList.contains('hero');
        if(!special&&colored&&((w<=768&&(pt<32||pb<32))||(w>768&&(pt<48||pb<48))))issues.push(`${name(sec)} colored section vertical padding ${pt.toFixed(0)}/${pb.toFixed(0)}px too tight`);
      }

      for(const wrap of document.querySelectorAll('main .wrap,main .container,main .content-wrap')){
        if(!visible(wrap))continue;const r=wrap.getBoundingClientRect(),s=getComputedStyle(wrap),pl=px(s.paddingLeft),pr=px(s.paddingRight),effectiveLeft=r.left+pl,effectiveRight=w-r.right+pr;const isStructured=w>=structuredBreakpointPx&&Boolean(wrap.querySelector(structuredSelector));const allowedMax=isStructured?approvedStructuredMax:approvedPageMax;const allowedWidth=Math.min(w,allowedMax);const splitHeroWrap=protectedHomepage&&(wrap.matches('main[data-homepage-redesign="stage76"]>.hero-visual-only>.wrap')||wrap.matches('main[data-homepage-redesign="stage76"]>.hero-copy-only>.wrap'));if(r.right>w+2||r.left<-2)issues.push(`${name(wrap)} wrap escapes viewport [${r.left.toFixed(1)},${r.right.toFixed(1)}]`);if(w>=1024&&r.width>allowedWidth+2)issues.push(`${name(wrap)} ${isStructured?'structured ':'standard '}content width ${r.width.toFixed(0)}px > design authority ${allowedWidth}px`);if(w<=768&&!wrap.closest('.full-bleed,[data-full-bleed="true"]')&&(effectiveLeft<15||effectiveRight<15))issues.push(`${name(wrap)} mobile/tablet content gutter [${effectiveLeft.toFixed(1)},${effectiveRight.toFixed(1)}]px`);if(w>=1024&&!splitHeroWrap&&r.width<w-80&&abs(r.left-(w-r.right))>5)issues.push(`${name(wrap)} container not centered (${r.left.toFixed(1)} vs ${(w-r.right).toFixed(1)})`);
      }

      if(protectedHomepage){
        const visual=document.querySelector('main[data-homepage-redesign="stage76"]>.hero-visual-only');
        const copy=document.querySelector('main[data-homepage-redesign="stage76"]>.hero-copy-only');
        const visualWrap=visual?.querySelector(':scope>.wrap');
        const copyWrap=copy?.querySelector(':scope>.wrap');
        if(!visible(visual)||!visible(copy)||!visible(visualWrap)||!visible(copyWrap)){
          issues.push('protected split hero is incomplete or hidden');
        }else{
          const vr=visual.getBoundingClientRect(),cr=copy.getBoundingClientRect(),vwr=visualWrap.getBoundingClientRect(),cwr=copyWrap.getBoundingClientRect();
          if(abs(vr.left)>2)issues.push(`protected split hero visual must align viewport left (${vr.left.toFixed(1)}px)`);
          if(abs(w-cr.right)>2)issues.push(`protected split hero copy panel must align viewport right (${(w-cr.right).toFixed(1)}px)`);
          if(vr.right>cr.left+2)issues.push(`protected split hero columns overlap by ${(vr.right-cr.left).toFixed(1)}px`);
          if(abs(vr.top-cr.top)>2||abs(vr.bottom-cr.bottom)>2)issues.push(`protected split hero panel heights/top alignment drift [visual ${vr.top.toFixed(1)}–${vr.bottom.toFixed(1)}, copy ${cr.top.toFixed(1)}–${cr.bottom.toFixed(1)}]`);
          if(abs(vwr.left-vr.left)>2||abs(vwr.right-vr.right)>2)issues.push(`protected split hero visual wrap must fill visual panel [${vwr.left.toFixed(1)},${vwr.right.toFixed(1)} vs ${vr.left.toFixed(1)},${vr.right.toFixed(1)}]`);
          if(cwr.left<cr.left-2||cwr.right>cr.right+2)issues.push(`protected split hero copy wrap escapes copy panel [${cwr.left.toFixed(1)},${cwr.right.toFixed(1)} vs ${cr.left.toFixed(1)},${cr.right.toFixed(1)}]`);
        }
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3')){
        if(!visible(h))continue;let n=h.nextElementSibling;while(n&&!visible(n))n=n.nextElementSibling;if(!n||!n.matches('p,ul,ol,blockquote,.lead,.cards,.steps,.gallery'))continue;const a=h.getBoundingClientRect(),b=n.getBoundingClientRect(),gap=b.top-a.bottom;if(gap<4)issues.push(`${name(h)} → ${name(n)} gap ${gap.toFixed(1)}px too tight`);if(gap>56&&!h.closest('.hero'))issues.push(`${name(h)} → ${name(n)} gap ${gap.toFixed(1)}px too loose`);
      }

      for(const el of document.querySelectorAll('.card,.service-card,.case-card,.fact-card,.quote-step,.category-card,.option-row,.quote-summary-card')){
        if(!visible(el))continue;const s=getComputedStyle(el),r=el.getBoundingClientRect(),pl=px(s.paddingLeft),pr=px(s.paddingRight),pt=px(s.paddingTop),pb=px(s.paddingBottom);const wall=s.backgroundColor!=='rgba(0, 0, 0, 0)'||px(s.borderTopWidth)+px(s.borderRightWidth)+px(s.borderBottomWidth)+px(s.borderLeftWidth)>0;const quoteControl=!!el.closest('.smart-quote-layout')&&el.matches('.category-card,.option-row');const minPad=quoteControl?13:(w<=768?16:20);if(wall&&(pl<minPad||pr<minPad))issues.push(`${name(el)} cell horizontal padding ${pl.toFixed(0)}/${pr.toFixed(0)}px`);if(wall&&px(s.borderRadius)>28)issues.push(`${name(el)} radius ${s.borderRadius} > 28px`);if(r.width<120&&(el.innerText||'').trim().length>80)issues.push(`${name(el)} content cell width ${r.width.toFixed(0)}px`);if(pt>90||pb>90)issues.push(`${name(el)} cell vertical padding ${pt.toFixed(0)}/${pb.toFixed(0)}px`);
      }

      for(const grid of [...document.querySelectorAll('main [style*="grid"],main .grid,main .cards,main .service-grid,main .case-grid')].filter(visible)){
        if(grid.closest('.gallery,.collage'))continue;const gs=getComputedStyle(grid);if(gs.display!=='grid'&&gs.display!=='inline-grid')continue;const minTextColumn=w<=430?160:220;for(const child of [...grid.children].filter(visible)){const r=child.getBoundingClientRect();if((child.innerText||'').trim().length>120&&r.width<minTextColumn)issues.push(`${name(child)} text column too narrow ${r.width.toFixed(0)}px`);}
      }

      if(w<=768){for(const el of [...document.querySelectorAll('button,summary,input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea,.btn,.menu-btn,.nav-cta')].filter(visible)){const r=el.getBoundingClientRect();if(r.height<43.5)issues.push(`${name(el)} touch height ${r.height.toFixed(1)}px < 44px`);if((el.matches('button,.menu-btn')||el.getAttribute('role')==='button')&&r.width<43.5)issues.push(`${name(el)} touch width ${r.width.toFixed(1)}px < 44px`);}}

      for(const el of [...document.querySelectorAll('main .hero a,main .hero button,main .cta-band a,main .cta-band button')].filter(visible)){if((el.innerText||'').trim().length>64)issues.push(`${name(el)} CTA label too long (${(el.innerText||'').trim().length} chars)`);}

      return {issues:[...new Set(issues)].slice(0,240),longText:longText.length,sections:[...document.querySelectorAll('main>section')].filter(visible).length};
    },{approvedPageMax,approvedStructuredMax,structuredBreakpointPx,structuredSelector});
    reports.push({width,pathname,longText:result.longText,sections:result.sections,issues:result.issues.length});if(result.issues.length)failures.push(`${width}px ${pathname}: ${result.issues.join(' | ')}`);await page.close();
  }
  await context.close();
}
await browser.close();
fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/apple-visual-quality.json',JSON.stringify({contract:'design-authority-backed-apple-visual',designVersion:design.version,pageMaxPx:approvedPageMax,structuredMaxPx:approvedStructuredMax,pages:pages.length,widths,reports,failures},null,2));
if(failures.length){console.error(`BANHALMI approved visual contract found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`BANHALMI approved visual contract passed: ${pages.length} pages × ${widths.length} viewports; standard max ${approvedPageMax}px and structured max ${approvedStructuredMax}px plus typography, reading measure, gutters, surfaces, spacing rhythm, controls, grids, protected split-hero geometry and cell geometry verified.`);
