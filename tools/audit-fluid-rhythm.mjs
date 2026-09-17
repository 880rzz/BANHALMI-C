import { chromium } from 'playwright';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const paths=['/','/portrait/','/de-at/','/de-at/portrait/','/hu/','/hu/portre/'];
const widths=[390,768,1280,1920,2560];
const expectedPageMax=(w)=>w>=2560?1760:w>=1920?1600:w>=1600?1440:1280;
const failures=[];
const reports=[];
const browser=await chromium.launch({headless:true});

for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const pathname of paths){
    const page=await context.newPage();
    await page.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear()}catch(e){}});
    let response;
    try{response=await page.goto(base+pathname,{waitUntil:'domcontentloaded',timeout:30000});await page.waitForTimeout(250)}catch(e){failures.push(`${width}px ${pathname}: navigation ${e.message}`);await page.close();continue}
    if(!response?.ok()) failures.push(`${width}px ${pathname}: HTTP ${response?.status()}`);
    const result=await page.evaluate(({width,pathname,expected})=>{
      const issues=[];
      const px=v=>parseFloat(v)||0;
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
      const textLineCount=el=>{
        const range=document.createRange();
        range.selectNodeContents(el);
        const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
        const lines=[];
        for(const r of rects){if(!lines.some(y=>Math.abs(y-r.top)<1.5))lines.push(r.top);}
        return Math.max(1,lines.length);
      };
      const root=getComputedStyle(document.documentElement);
      const pageMax=px(root.getPropertyValue('--apple-page-max'));
      if(Math.abs(pageMax-expected)>1) issues.push(`--apple-page-max ${pageMax}px, expected ${expected}px`);
      const scrollWidth=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
      if(scrollWidth>innerWidth+1) issues.push(`horizontal overflow ${scrollWidth-innerWidth}px`);
      for(const sec of document.querySelectorAll('main>section')){
        if(getComputedStyle(sec).contentVisibility==='auto') issues.push('top-level content-visibility:auto');
      }
      if(width>=1280){
        for(const p of document.querySelectorAll('main p,main blockquote')){
          if(!visible(p)||p.closest('.card,.archive-card,.site-footer')) continue;
          const text=(p.innerText||'').replace(/\s+/g,' ').trim();
          if(text.length>=120&&p.getBoundingClientRect().width>862) issues.push(`prose ${p.getBoundingClientRect().width.toFixed(0)}px > 860px`);
        }
      }
      const footer=document.querySelector('.site-footer');
      if(footer){
        const legal=[...footer.querySelectorAll('.footer-legal-list strong')].filter(visible);
        for(const el of legal){if(textLineCount(el)>1) issues.push(`legal identifier wraps: ${(el.textContent||'').trim()}`);}
        const legalText=footer.innerText||'';
        for(const token of ['36592951','36593897','ATU80445314','9110037983878']) if(!legalText.includes(token)) issues.push(`legal token missing ${token}`);
        if(pathname==='/portrait/'||pathname==='/de-at/portrait/'||pathname==='/hu/portre/'){
          scrollTo(0,document.documentElement.scrollHeight);
          const fr=footer.getBoundingClientRect();
          const documentGap=document.documentElement.scrollHeight-(fr.bottom+scrollY);
          if(documentGap>2) issues.push(`white/document gap after footer ${documentGap.toFixed(1)}px`);
          if(document.documentElement.scrollHeight<=innerHeight+2&&fr.bottom<innerHeight-2) issues.push(`short-page footer ends ${Math.round(innerHeight-fr.bottom)}px above viewport bottom`);
        }
      }else issues.push('site footer missing');
      if(pathname==='/hu/'||pathname==='/hu/portre/'){
        const social=[...document.querySelectorAll('.site-footer *')].find(el=>(el.textContent||'').trim()==='Közösségi média'&&visible(el));
        if(social&&textLineCount(social)>1) issues.push('HU Közösségi média wraps');
      }
      const cookie=[...document.querySelectorAll('.cookie,[data-cookie-banner],.cookie-banner')].find(visible);
      if(cookie&&footer){
        const targets=[...footer.querySelectorAll('.footer-contact,.footer-legal,.footer-contact-col,.footer-legal-col')].filter(visible);
        for(const t of targets) if(overlap(cookie.getBoundingClientRect(),t.getBoundingClientRect())) issues.push('cookie overlaps footer contact/legal');
      }
      const menuBtn=document.querySelector('.menu-btn,[data-menu-toggle],button[aria-controls*="menu"]');
      return {issues,pageMax,hasMenuBtn:Boolean(menuBtn)};
    },{width,pathname,expected:expectedPageMax(width)});

    if(result.hasMenuBtn&&width>=1280){
      try{
        const btn=page.locator('.menu-btn,[data-menu-toggle],button[aria-controls*="menu"]').first();
        await btn.click();
        await page.waitForTimeout(100);
        const menuIssue=await page.evaluate(()=>{
          const panel=document.querySelector('.bn-mega-panel');
          if(!panel)return 'mega-menu panel missing after open';
          const pt=parseFloat(getComputedStyle(panel).paddingTop)||0;
          return pt>105?`mega-menu top padding ${pt.toFixed(0)}px > 105px`:'';
        });
        if(menuIssue) result.issues.push(menuIssue);
      }catch(e){result.issues.push(`mega-menu open failed: ${e.message}`)}
    }
    reports.push({width,pathname,pageMax:result.pageMax,issues:result.issues});
    if(result.issues.length) failures.push(`${width}px ${pathname}: ${result.issues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
console.log(JSON.stringify({paths,widths,reports,failures},null,2));
if(failures.length){console.error(`Fluid rhythm audit failed (${failures.length} route/viewport combinations).`);process.exit(1)}
console.log('Fluid rhythm audit passed: EN/DE-AT/HU key pages at 390/768/1280/1920/2560, wrapper/prose/footer/menu/overflow contracts verified.');
