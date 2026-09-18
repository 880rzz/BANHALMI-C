import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const base=(process.env.LIVE_PIXEL_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const authorityViewports=authority.visualGeometry?.requiredDesktopViewports||[];
const compactViewports=[
  {width:1180,height:800,homepageHeroMaxPx:760,footerMaxPx:760,portraitGalleryColumns:4},
  {width:1280,height:800,homepageHeroMaxPx:760,footerMaxPx:760,portraitGalleryColumns:4},
  {width:1366,height:768,homepageHeroMaxPx:760,footerMaxPx:760,portraitGalleryColumns:4},
  {width:1439,height:900,homepageHeroMaxPx:760,footerMaxPx:760,portraitGalleryColumns:4}
];
const viewports=[...compactViewports,...authorityViewports];
const maxHeroFraction=Number(authority.visualGeometry?.homepageHeroMaxViewportFraction||0.92);
const footerFraction=Number(authority.layout?.documentFlow?.footerMaxViewportFractionOnTabletDesktop||0.54);
const footerAbsolute=Number(authority.layout?.documentFlow?.footerAbsoluteMaxPx||480);
const cardTolerance=Number(authority.visualGeometry?.sameRowCardHeightTolerancePx||2);
const reviewsPaddingMax=Number(authority.visualGeometry?.reviewsSectionPaddingMaxPx||72);
const megaFirstMax=Number(authority.visualGeometry?.megaMenuFirstContentMaxPx||132);
const megaBottomMax=Number(authority.visualGeometry?.megaMenuBottomWhitespaceMaxPx||104);
const pages=[
  {lang:'en',kind:'home',pathname:'/'},
  {lang:'en',kind:'portrait',pathname:'/portrait/'},
  {lang:'en',kind:'brand',pathname:'/lifestyle/'},
  {lang:'hu',kind:'home',pathname:'/hu/'},
  {lang:'hu',kind:'portrait',pathname:'/hu/portre/'},
  {lang:'hu',kind:'brand',pathname:'/hu/brand/'},
  {lang:'de',kind:'home',pathname:'/de-at/'},
  {lang:'de',kind:'portrait',pathname:'/de-at/portrait/'},
  {lang:'de',kind:'brand',pathname:'/de-at/brand/'}
];
const requiredWidths=[1440,1920,2560,3840];
const actualWidths=viewports.map(v=>Number(v.width));
for(const w of requiredWidths){if(!actualWidths.includes(w)) throw new Error(`Live pixel authority missing ${w}px viewport`)}
if(authority.visualGeometry?.runtimeGeometryOverridesAllowed!==false) throw new Error('Runtime geometry overrides must be prohibited');

const outDir=path.resolve('artifacts/live-pixel-geometry');
fs.mkdirSync(outDir,{recursive:true});
const failures=[];
const reports=[];
const browser=await chromium.launch({headless:true});

function sameRowHeightIssues(cards,tolerance){
  const rows=[];
  for(const card of cards){
    let row=rows.find(r=>Math.abs(r.top-card.top)<=2);
    if(!row){row={top:card.top,items:[]};rows.push(row)}
    row.items.push(card);
  }
  const issues=[];
  for(const row of rows){
    if(row.items.length<2) continue;
    const hs=row.items.map(i=>i.height);
    const delta=Math.max(...hs)-Math.min(...hs);
    if(delta>tolerance) issues.push({top:row.top,delta,heights:hs});
  }
  return issues;
}

for(const vp of viewports){
  const width=Number(vp.width),height=Number(vp.height);
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  for(const target of pages){
    const page=await context.newPage();
    const url=new URL(target.pathname,base).href;
    try{
      await page.goto(url,{waitUntil:'networkidle',timeout:45000});
    }catch(error){
      failures.push(`${width}x${height} ${target.pathname}: navigation ${error.message}`);
      await page.close();
      continue;
    }
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';});
    const result=await page.evaluate(({kind})=>{
      const px=v=>parseFloat(v)||0;
      const isVisible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&r.width>0&&r.height>0};
      const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,left:r.left,width:r.width,height:r.height,bottom:r.bottom+scrollY,right:r.right}};
      const footer=document.querySelector('.site-footer');
      const footerPrimary=footer?.querySelector('.footer-grid');
      const footerBottom=footer?.querySelector('.footer-bottom');
      const footerEcosystem=footer?.querySelector('.banhalmi-ecosystem')||document.querySelector('body>.banhalmi-ecosystem');
      const reviews=document.querySelector('main .reviews-drawer-section');
      const renderedRows=grid=>{
        if(!grid)return 0;
        const tops=[...grid.children].filter(isVisible).map(el=>el.getBoundingClientRect().top).sort((a,b)=>a-b);
        const rows=[];
        for(const top of tops)if(!rows.some(row=>Math.abs(row-top)<=2))rows.push(top);
        return rows.length;
      };
      const footerRect=footer&&isVisible(footer)?rect(footer):null;
      const data={
        documentOverflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth,
        footer:footerRect?{...footerRect,primaryRows:renderedRows(footerPrimary),visualBands:[footerPrimary,footerBottom,footerEcosystem].filter(isVisible).length,columns:footerPrimary?getComputedStyle(footerPrimary).gridTemplateColumns:''}:null,
        reviews:null,hero:null,cards:[],gallery:null,mega:null
      };
      if(reviews&&isVisible(reviews)){const s=getComputedStyle(reviews);data.reviews={...rect(reviews),paddingTop:px(s.paddingTop),paddingBottom:px(s.paddingBottom)}}
      if(kind==='home'){
        const main=document.querySelector('main[data-homepage-redesign="stage76"]');
        const visual=main?.querySelector(':scope>.hero-visual-only');
        const copy=main?.querySelector(':scope>.hero-copy-only');
        if(isVisible(visual)&&isVisible(copy)){const vr=rect(visual),cr=rect(copy);data.hero={visual:vr,copy:cr,height:Math.max(vr.height,cr.height)}}
        const grid=main?.querySelector('.fp-decision-grid');
        if(grid){data.cards=[...grid.children].filter(isVisible).map(rect)}
      }
      if(kind==='portrait'){
        const gallery=document.querySelector('main .collage-gallery');
        if(gallery&&isVisible(gallery)){
          const s=getComputedStyle(gallery),r=rect(gallery);
          data.gallery={...r,columns:Math.round(px(s.columnCount)),imageCount:gallery.querySelectorAll('img').length,className:String(gallery.className||''),columnGap:px(s.columnGap)};
        }
      }
      return data;
    },{kind:target.kind});

    const issues=[];
    if(result.documentOverflow>2) issues.push(`document horizontal overflow ${result.documentOverflow.toFixed(1)}px`);
    if(!result.footer) issues.push('footer missing');
    else {
      const allowed=Math.min(Number(vp.footerMaxPx||footerAbsolute),footerAbsolute,height*footerFraction);
      if(result.footer.height>allowed+2) issues.push(`footer ${result.footer.height.toFixed(1)}px > ${allowed.toFixed(1)}px`);
      const expectedRows=width<1440?Number(authority.layout?.footer?.smallDesktopContentRows||2):Number(authority.layout?.footer?.desktopContentRows||2);
      if(result.footer.primaryRows!==expectedRows) issues.push(`footer primary rows ${result.footer.primaryRows} != ${expectedRows}`);
      if(result.footer.visualBands!==3) issues.push(`footer visual bands ${result.footer.visualBands} != 3`);
    }
    if(result.reviews&&(result.reviews.paddingTop>reviewsPaddingMax+1||result.reviews.paddingBottom>reviewsPaddingMax+1)) issues.push(`reviews padding ${result.reviews.paddingTop.toFixed(1)}/${result.reviews.paddingBottom.toFixed(1)}px > ${reviewsPaddingMax}px`);
    if(target.kind==='home'){
      if(!result.hero) issues.push('split homepage hero missing');
      else {
        const allowed=Math.min(Number(vp.homepageHeroMaxPx),height*maxHeroFraction);
        if(result.hero.height>allowed+2) issues.push(`homepage hero ${result.hero.height.toFixed(1)}px > ${allowed.toFixed(1)}px`);
        if(Math.abs(result.hero.visual.height-result.hero.copy.height)>2) issues.push(`hero panels differ by ${Math.abs(result.hero.visual.height-result.hero.copy.height).toFixed(1)}px`);
      }
      const rowIssues=sameRowHeightIssues(result.cards,cardTolerance);
      if(rowIssues.length) issues.push(`decision-card row height delta ${Math.max(...rowIssues.map(x=>x.delta)).toFixed(1)}px > ${cardTolerance}px`);
    }
    if(target.kind==='portrait'){
      if(!result.gallery) issues.push('portrait collage gallery not found');
      else if(result.gallery.columns<Number(vp.portraitGalleryColumns)) issues.push(`portrait gallery ${result.gallery.columns} columns < ${vp.portraitGalleryColumns}`);
    }

    const slug=`${width}x${height}-${target.lang}-${target.kind}`;
    if(target.lang==='en'&&target.kind==='home'){
      const button=page.locator('.menu-btn').first();
      if(await button.count()){
        await button.click();
        await page.waitForTimeout(350);
        const mega=await page.evaluate(()=>{
          const panel=document.querySelector('.bn-mega-panel');
          if(!panel)return null;
          const s=getComputedStyle(panel),pr=panel.getBoundingClientRect();
          if(s.display==='none'||s.visibility==='hidden'||pr.height<=0)return null;
          const candidates=[...panel.querySelectorAll('h2,h3,a,p')].filter(el=>{const x=getComputedStyle(el),r=el.getBoundingClientRect();return x.display!=='none'&&x.visibility!=='hidden'&&r.width>0&&r.height>0});
          if(!candidates.length)return {height:pr.height,firstContent:null,bottomWhitespace:null};
          const rs=candidates.map(el=>el.getBoundingClientRect());
          return {height:pr.height,firstContent:Math.min(...rs.map(r=>r.top))-pr.top,bottomWhitespace:pr.bottom-Math.max(...rs.map(r=>r.bottom))};
        });
        result.mega=mega;
        if(!mega) issues.push('mega menu panel not measurable');
        else {
          if(mega.firstContent!=null&&mega.firstContent>megaFirstMax) issues.push(`mega first content ${mega.firstContent.toFixed(1)}px > ${megaFirstMax}px`);
          if(mega.bottomWhitespace!=null&&mega.bottomWhitespace>megaBottomMax) issues.push(`mega bottom whitespace ${mega.bottomWhitespace.toFixed(1)}px > ${megaBottomMax}px`);
        }
        await page.screenshot({path:path.join(outDir,`${slug}-mega-open.png`),fullPage:false});
        await page.keyboard.press('Escape');
      } else issues.push('mega menu button missing');
    }

    await page.screenshot({path:path.join(outDir,`${slug}.png`),fullPage:true});
    reports.push({viewport:{width,height},...target,geometry:result,issues});
    if(issues.length) failures.push(`${slug}: ${issues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
const report={contract:'BANHALMI-LIVE-PIXEL-GEOMETRY-20260918',designVersion:authority.version,base,viewports,pages,reports,failures};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
if(failures.length){
  console.error(`BANHALMI live pixel geometry failed (${failures.length} page/viewport combinations):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`BANHALMI live pixel geometry passed: ${pages.length} EN/HU/DE home/portrait/brand pages across ${viewports.length} compact-desktop/desktop/4K viewports; footer rows/bands/overflow, hero, cards, portrait gallery and mega-menu geometry verified.`);
