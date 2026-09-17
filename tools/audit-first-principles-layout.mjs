import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const siteDir=path.resolve(process.env.AUDIT_SITE_DIR||'_site');
const widths=[375,390,430,768,1024,1280,1440,1920];
const failures=[];

function walk(dir){const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())out.push(...walk(f));else if(e.isFile()&&e.name.endsWith('.html'))out.push(f)}return out}
function toUrl(file){const rel=path.relative(siteDir,file).split(path.sep).join('/');if(rel==='index.html')return '/';if(rel.endsWith('/index.html'))return `/${rel.slice(0,-10)}`;return `/${rel}`}
function discover(){const pages=[];for(const file of walk(siteDir)){const html=fs.readFileSync(file,'utf8');if(!/<main\b/i.test(html)||/http-equiv=["']refresh["']/i.test(html)||!/assets\/css\//i.test(html))continue;pages.push(toUrl(file))}return [...new Set(pages)].sort()}
const pages=discover();
const browser=await chromium.launch({headless:true});

for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const pathname of pages){
    const page=await context.newPage();
    try{await page.goto(new URL(pathname,base).href,{waitUntil:'domcontentloaded',timeout:30000})}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    await page.waitForTimeout(180);
    const issues=await page.evaluate(()=>{
      const out=[];
      const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const px=v=>parseFloat(v)||0;
      const name=el=>`${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${el.className?'.'+String(el.className).trim().replace(/\s+/g,'.').slice(0,90):''}`;
      const w=innerWidth;
      const centredContext=el=>Boolean(el.closest('.cta-band,.centered,.text-center,[data-align="center"],[data-layout="centered"]'));

      for(const el of document.querySelectorAll('main p,main li')){
        if(!visible(el)||(el.innerText||'').trim().length<140)continue;
        const r=el.getBoundingClientRect();if(w>=1024&&r.width>860)out.push(`${name(el)} long-form width ${r.width.toFixed(0)}px`);
        const lh=px(getComputedStyle(el).lineHeight),fs=px(getComputedStyle(el).fontSize);if(fs>0&&lh/fs<1.38)out.push(`${name(el)} body leading ${(lh/fs).toFixed(2)} < 1.38`);
      }

      for(const el of document.querySelectorAll('main section')){
        if(!visible(el)||el.matches('.hero,.hero-section,.statement,.immersive,.cta-band,[data-layout="immersive"]')||el.closest('.gallery'))continue;
        const r=el.getBoundingClientRect(),text=(el.innerText||'').replace(/\s+/g,' ').trim(),media=el.querySelectorAll('img,video,figure,.gallery').length;
        if(w>=1024&&r.height>1500&&text.length<420&&media<2)out.push(`${name(el)} sparse section ${r.height.toFixed(0)}px / ${text.length} chars`);
        const s=getComputedStyle(el),compact=text.length<700&&media===0;
        const padLimit=compact?(w>=1280?96:108):120;
        if(w>=1024&&(px(s.paddingTop)>padLimit||px(s.paddingBottom)>padLimit))out.push(`${name(el)} excessive section padding ${s.paddingTop}/${s.paddingBottom} for ${compact?'compact':'content'} section`);
        const kids=[...el.children].filter(visible);if(kids.length){const first=kids[0].getBoundingClientRect(),last=kids[kids.length-1].getBoundingClientRect();const topGap=first.top-r.top,bottomGap=r.bottom-last.bottom;const lim=w<=620?100:(compact?132:160);if(topGap>lim)out.push(`${name(el)} unexplained top whitespace ${topGap.toFixed(0)}px`);if(bottomGap>lim)out.push(`${name(el)} unexplained bottom whitespace ${bottomGap.toFixed(0)}px`)}
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3,header h1')){
        if(!visible(h))continue;const fs=px(getComputedStyle(h).fontSize);if(fs<1)continue;
        let min=0,max=999;
        if(h.matches('h1')){min=w<=430?34:w<=768?38:40;max=w<=430?44:w<=768?48:60}
        else if(h.matches('h2')){min=w<=430?24:w<=768?25:26;max=w<=430?34:w<=768?36:40}
        else {min=16;max=28}
        if(fs<min||fs>max)out.push(`${name(h)} type scale ${fs.toFixed(1)}px outside ${min}-${max}px`)
      }

      for(const h of document.querySelectorAll('main h1,main h2,main h3')){
        if(!visible(h)||px(getComputedStyle(h).fontSize)<1)continue;const n=h.nextElementSibling;if(!n||!visible(n)||!n.matches('p,.lead,.description,.section-description,.hero-description,.service-description'))continue;
        const hr=h.getBoundingClientRect(),nr=n.getBoundingClientRect(),gap=nr.top-hr.bottom;const min=10,max=h.matches('h1')?56:h.matches('h2')?36:34;if(gap<min||gap>max)out.push(`${name(h)} → ${name(n)} gap ${gap.toFixed(0)}px outside ${min}-${max}px`)
      }

      for(const intro of document.querySelectorAll('main .section-head,main .section-intro,main .service-intro,main .content-intro')){
        if(!visible(intro))continue;const nodes=[...intro.children].filter(el=>visible(el)&&el.matches('h1,h2,h3,p,.lead,.eyebrow,.label,.kicker,[class*="eyebrow"],[class*="kicker"]'));if(nodes.length<2)continue;
        const lefts=nodes.map(el=>el.getBoundingClientRect().left),spread=Math.max(...lefts)-Math.min(...lefts);if(spread>4)out.push(`${name(intro)} optical-axis drift ${spread.toFixed(1)}px`);
        if(!centredContext(intro)){for(const el of nodes){const a=getComputedStyle(el).textAlign;if(!['left','start'].includes(a))out.push(`${name(intro)} unexpected ${a} alignment on ${name(el)}`)}}
      }

      for(const cell of document.querySelectorAll('main .card,main .step,main .process-card,main .process-step,main .workflow-card,main .service-card,main .evidence-card,main .trust-card,main .panel,main .cell,main .fp-choice')){
        if(!visible(cell))continue;const s=getComputedStyle(cell),r=cell.getBoundingClientRect();const wall=px(s.borderLeftWidth)+px(s.borderRightWidth)+px(s.borderTopWidth)+px(s.borderBottomWidth)>0||s.backgroundColor!=='rgba(0, 0, 0, 0)';if(!wall)continue;
        const pads=[px(s.paddingTop),px(s.paddingRight),px(s.paddingBottom),px(s.paddingLeft)];const minPad=w<=620?18:20;if(Math.min(...pads)<minPad)out.push(`${name(cell)} four-side padding ${pads.map(v=>v.toFixed(0)).join('/')}px`);if(Math.max(...pads)-Math.min(...pads)>12)out.push(`${name(cell)} asymmetric cell inset ${pads.map(v=>v.toFixed(0)).join('/')}px`);
        const kids=[...cell.children].filter(visible);for(const kid of kids.slice(0,5)){const kr=kid.getBoundingClientRect();if(kr.left-r.left<15||r.right-kr.right<15)out.push(`${name(cell)} child touches cell wall (${(kr.left-r.left).toFixed(0)}/${(r.right-kr.right).toFixed(0)}px)`)}if(w<=620&&(cell.innerText||'').trim().length>100&&r.width<236)out.push(`${name(cell)} cramped mobile text cell ${r.width.toFixed(0)}px`)
      }

      for(const choice of document.querySelectorAll('.fp-choice,.quote-choice,[class*="quote-option"]')){
        if(!visible(choice))continue;const radio=choice.querySelector('input[type="radio"],input[type="checkbox"]');const info=choice.querySelector('.info-tip,.info-btn,[data-info],button[aria-label*="info" i]');const text=[...choice.querySelectorAll('strong,b,.choice-title,.option-title,label')].find(el=>visible(el)&&el!==radio);
        if(radio&&text&&visible(radio)&&visible(text)){const rr=radio.getBoundingClientRect(),tr=text.getBoundingClientRect();if(tr.left-rr.right<14)out.push(`${name(choice)} radio/text gap ${(tr.left-rr.right).toFixed(0)}px < 14px`);if(tr.left<rr.right)out.push(`${name(choice)} radio overlaps text`)}
        if(info&&text&&visible(info)&&visible(text)){const ir=info.getBoundingClientRect(),tr=text.getBoundingClientRect();if(tr.right>ir.left-10&&Math.abs(tr.top-ir.top)<Math.max(tr.height,ir.height))out.push(`${name(choice)} text collides with info control`)}
      }

      if(w<=620){for(const layout of document.querySelectorAll('main *')){if(!visible(layout))continue;const s=getComputedStyle(layout);if(!['grid','flex'].includes(s.display))continue;const kids=[...layout.children].filter(visible);if(kids.length<2)continue;const rows=new Set(kids.map(k=>Math.round(k.getBoundingClientRect().top/4)*4));if(rows.size>=kids.length)continue;for(const kid of kids){const text=(kid.innerText||'').replace(/\s+/g,' ').trim();const r=kid.getBoundingClientRect();if(text.length>100&&r.width<236)out.push(`${name(layout)} generic cramped mobile child ${name(kid)} ${r.width.toFixed(0)}px`)}}}

      if(w<=620){for(const grid of document.querySelectorAll('.partner-grid-memberships')){if(!visible(grid))continue;const cards=[...grid.children].filter(visible);if(cards.length>2&&cards.length%2===1){const gr=grid.getBoundingClientRect(),lr=cards.at(-1).getBoundingClientRect(),gc=(gr.left+gr.right)/2,lc=(lr.left+lr.right)/2;if(Math.abs(gc-lc)>8&&lr.width<gr.width*.74)out.push(`membership final card not optically centred (${Math.abs(gc-lc).toFixed(0)}px drift)`)}}}

      // Only components whose information architecture is explicitly wide are
      // required to consume the executive desktop canvas. Location cards and
      // compact event-detail triples are intentionally readable/narrow.
      if(w>=1440){for(const block of document.querySelectorAll('main .service-process-grid,main .partner-grid,main .partner-grid-memberships,main .archive-cards,main .two-reading-grid,main .smart-quote-layout')){if(!visible(block))continue;const r=block.getBoundingClientRect();const required=Math.min(w*.70,1320);if(r.width<required)out.push(`${name(block)} desktop canvas ${r.width.toFixed(0)}px < ${required.toFixed(0)}px at ${w}px`)}}

      const footer=document.querySelector('.site-footer,footer');const main=document.querySelector('main');if(main&&footer&&visible(main)&&visible(footer)){const gap=footer.getBoundingClientRect().top-main.getBoundingClientRect().bottom;if(gap>80)out.push(`main/footer unexplained gap ${gap.toFixed(0)}px`)}
      for(const a of document.querySelectorAll('.site-header a.active,.site-header a[aria-current="page"]')){if(!visible(a))continue;const s=getComputedStyle(a);if(px(s.borderTopWidth)+px(s.borderRightWidth)+px(s.borderBottomWidth)+px(s.borderLeftWidth)>0)out.push(`active navigation framed`)}

      const quote=document.querySelector('[data-smart-quote],#build-package,.smart-quote-layout');if(quote&&visible(quote)&&w>1024){const layout=document.querySelector('.smart-quote-layout'),intro=document.querySelector('.smart-quote-layout>.quote-intro'),form=document.querySelector('.smart-quote-layout>.form');if(layout&&intro&&form&&visible(intro)&&visible(form)){const ir=intro.getBoundingClientRect(),fr=form.getBoundingClientRect();if(fr.width<ir.width*1.55)out.push(`quote workspace too narrow: form ${fr.width.toFixed(0)}px vs intro ${ir.width.toFixed(0)}px`)}}
      for(const card of document.querySelectorAll('.card,.service-card,.case-card,.fact-card,.quote-summary-card')){if(!visible(card))continue;const r=card.getBoundingClientRect(),text=(card.innerText||'').replace(/\s+/g,' ').trim(),media=card.querySelectorAll('img,video,figure').length;if(w>=1024&&r.height>700&&text.length<260&&media===0)out.push(`${name(card)} oversized card ${r.height.toFixed(0)}px/${text.length} chars`)}

      return [...new Set(out)].slice(0,220);
    });
    if(issues.length)failures.push(`${width}px ${pathname}: ${issues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
if(failures.length){console.error(`First-principles BANHALMI layout audit found ${failures.length} failing page/viewport combinations.`);console.error(failures.join('\n'));process.exit(1)}
console.log(`First-principles BANHALMI layout audit passed: ${pages.length} pages across ${widths.length} widths; typography scale, heading-description rhythm, semantic alignment, four-side cell inset, whitespace, reading measure, quote controls, desktop canvas use, mobile density, navigation and footer geometry are within contract.`);
await import('./audit-layout-authority-browser.mjs');
