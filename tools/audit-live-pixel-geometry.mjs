import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const base=(process.env.LIVE_PIXEL_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const viewports=authority.visualGeometry?.requiredDesktopViewports||[];
const maxHeroFraction=Number(authority.visualGeometry?.homepageHeroMaxViewportFraction||0.92);
const heroReduction=Number(authority.visualGeometry?.homepageHeroMedia?.reductionFraction||0);
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
      const reviews=document.querySelector('main .reviews-drawer-section');
      const data={footer:footer&&isVisible(footer)?rect(footer):null,reviews:null,hero:null,cards:[],gallery:null,mega:null,document:{scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}};
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

    let disclosure=null;
    if(width<1180){
      const summary=page.locator('.site-footer details.footer-accordion summary').first();
      if(await summary.count()){
        await summary.click();
        await page.waitForTimeout(50);
        disclosure=await page.evaluate(()=>{
          const d=document.querySelector('.site-footer details.footer-accordion');
          const ul=d?.querySelector('ul');
          const r=ul?.getBoundingClientRect();
          return d&&ul?{open:d.open,hidden:Boolean(ul.hidden),display:getComputedStyle(ul).display,height:r?.height||0,runtime:d.getAttribute('data-footer-disclosure-runtime'),lastAction:d.getAttribute('data-footer-disclosure-last-action'),ariaExpanded:d.querySelector('summary')?.getAttribute('aria-expanded')||null}:null;
        });
        if(disclosure?.open) await summary.click();
      }
    }
    const issues=[];
    if(!result.footer) issues.push('footer missing');
    else {
      const allowed=Math.min(Number(vp.footerMaxPx||footerAbsolute),footerAbsolute,height*footerFraction);
      if(result.footer.height>allowed+2) issues.push(`footer ${result.footer.height.toFixed(1)}px > ${allowed.toFixed(1)}px`);
      const tailGap=result.document.scrollHeight-result.footer.bottom;
      if(tailGap>2) issues.push(`white document tail after footer ${tailGap.toFixed(1)}px > 2px`);
      const horizontalOverflow=result.document.scrollWidth-result.document.clientWidth;
      if(horizontalOverflow>1) issues.push(`document horizontal overflow ${horizontalOverflow.toFixed(1)}px > 1px`);
    }
    if(result.reviews&&(result.reviews.paddingTop>reviewsPaddingMax+1||result.reviews.paddingBottom>reviewsPaddingMax+1)) issues.push(`reviews padding ${result.reviews.paddingTop.toFixed(1)}/${result.reviews.paddingBottom.toFixed(1)}px > ${reviewsPaddingMax}px`);
    if(target.kind==='home'){
      if(!result.hero) issues.push('split homepage hero missing');
      else {
        const allowed=Math.min(Number(vp.homepageHeroMaxPx),height*maxHeroFraction);
        const heroMediaAuthority=authority.visualGeometry?.homepageHeroMedia||{};
        if(heroMediaAuthority.desktopLayout==='stacked'){
          if(result.hero.visual.height>allowed+2) issues.push(`homepage hero media ${result.hero.visual.height.toFixed(1)}px > ${allowed.toFixed(1)}px`);
          if(result.hero.copy.top<result.hero.visual.bottom-2) issues.push('stacked hero copy overlaps hero media');
          if(Math.abs(result.hero.visual.left)>2||Math.abs(result.hero.visual.right-width)>2) issues.push('stacked hero media is not viewport width');
        }else{
          if(result.hero.height>allowed+2) issues.push(`homepage hero ${result.hero.height.toFixed(1)}px > ${allowed.toFixed(1)}px`);
          const actualMediaRatio=result.hero.copy.height>0?result.hero.visual.height/result.hero.copy.height:0;
          const expectedMediaRatio=heroMediaAuthority.copyPanelMatchesMediaHeight===true?1:1-heroReduction;
          if(heroReduction>0&&Math.abs(actualMediaRatio-expectedMediaRatio)>0.015) issues.push(`hero media/copy ratio ${actualMediaRatio.toFixed(3)} != intended ${expectedMediaRatio.toFixed(3)}`);
          if(heroMediaAuthority.copyPanelMatchesMediaHeight===true&&result.hero.visual.height>result.hero.copy.height+2) issues.push('hero media exceeds unchanged copy panel height');
        }
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
      await page.waitForSelector('#bn-mega-menu',{state:'attached',timeout:5000}).catch(()=>{});
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
const compactFooterSmokeViewports=[{width:768,height:1024},{width:820,height:1180},{width:1024,height:1366}];
const compactFooterSmokePages=pages.filter(p=>p.kind==='home');
for(const vp of compactFooterSmokeViewports){
  const context=await browser.newContext({viewport:vp,deviceScaleFactor:1});
  for(const target of compactFooterSmokePages){
    const page=await context.newPage();
    await page.goto(new URL(target.pathname,base).href,{waitUntil:'networkidle',timeout:45000});
    const state=await page.evaluate(()=>{
      const footer=document.querySelector('.site-footer');
      const fr=footer?.getBoundingClientRect();
      const accordions=[...document.querySelectorAll('details.footer-accordion')].map(d=>{
        const ul=d.querySelector('ul'),ur=ul?.getBoundingClientRect(),dr=d.getBoundingClientRect();
        return {label:d.querySelector('summary')?.textContent?.trim()||'',open:d.open,hidden:Boolean(ul?.hidden),display:ul?getComputedStyle(ul).display:null,ulHeight:ur?.height||0,detailsHeight:dr.height};
      });
      const blocks=[...document.querySelectorAll('.site-footer .footer-grid>*')].map(el=>{const r=el.getBoundingClientRect();return {name:el.matches('details')?(el.querySelector('summary')?.textContent?.trim()||'details'):(el.querySelector('.footer-heading')?.textContent?.trim()||el.className||el.tagName),left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height}});
      const overlaps=[];for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++){const a=blocks[i],b=blocks[j],x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(x>2&&y>2)overlaps.push({a:a.name,b:b.name,x,y});}
      return {footerHeight:fr?.height||0,accordions,blocks,overlaps};
    });
    const compactIssues=[];
    if(state.footerHeight>footerAbsolute+2) compactIssues.push(`compact footer ${state.footerHeight.toFixed(1)}px > ${footerAbsolute}px; accordions=${state.accordions.map(a=>`${a.label}:${a.open?'open':'closed'}/${a.display}/${a.ulHeight.toFixed(0)}`).join(',')}`);
    for(const o of state.overlaps) compactIssues.push(`compact footer overlap ${o.a} ↔ ${o.b} ${o.x.toFixed(1)}x${o.y.toFixed(1)}px`);
    const slug=`${vp.width}x${vp.height}-${target.lang}-compact-footer`;
    await page.screenshot({path:path.join(outDir,`${slug}.png`),fullPage:true});
    reports.push({viewport:vp,...target,kind:'compact-footer-smoke',geometry:state,issues:compactIssues});
    if(compactIssues.length) failures.push(`${slug}: ${compactIssues.join(' | ')}`);
    await page.close();
  }
  await context.close();
}

const responsiveWidths=authority.visualGeometry?.mobileProductionViewports||[];
const requiredResponsiveWidths=[375,390,393,414,430,621,720,721,768,820,1024,1179,1180,1280,1440,1920,2560,3840];
for(const w of requiredResponsiveWidths) if(!responsiveWidths.map(Number).includes(w)) failures.push(`responsive authority missing ${w}px`);
const responsiveHeight=w=>w<=430?844:w<=720?932:w<=820?1180:w<=1179?1366:w<=1440?900:w<=1920?1080:w<=2560?1440:2160;
for(const width of requiredResponsiveWidths){
  const height=responsiveHeight(width);
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
  for(const target of pages){
    const page=await context.newPage();
    try{await page.goto(new URL(target.pathname,base).href,{waitUntil:'networkidle',timeout:45000});}
    catch(error){failures.push(`${width}x${height} ${target.pathname}: responsive navigation ${error.message}`);await page.close();continue;}
    const state=await page.evaluate(({kind})=>{
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0};
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top+scrollY,bottom:r.bottom+scrollY,width:r.width,height:r.height}};
      const footer=document.querySelector('.site-footer'),grid=footer?.querySelector('.footer-grid'),brand=footer?.querySelector('.footer-brand-col'),entity=footer?.querySelector('.footer-entity');
      const blocks=grid?[...grid.children].filter(visible).map(el=>({name:el.matches('details')?(el.querySelector('summary')?.textContent?.trim()||'details'):(el.querySelector('.footer-heading')?.textContent?.trim()||el.className||el.tagName),...rect(el)})):[];
      const intersections=[];
      for(let i=0;i<blocks.length;i++)for(let j=i+1;j<blocks.length;j++){const a=blocks[i],b=blocks[j],x=Math.min(a.right,b.right)-Math.max(a.left,b.left),y=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);if(x>1&&y>1)intersections.push({a:a.name,b:b.name,x,y});}
      const fr=footer?rect(footer):null,gr=grid?rect(grid):null,br=brand?rect(brand):null,er=entity?rect(entity):null,es=entity?getComputedStyle(entity):null;
      let hero=null;
      if(kind==='home'){
        const visual=document.querySelector('main[data-homepage-redesign="stage76"]>.hero-visual-only'),figure=visual?.querySelector('.hero-figure'),copy=document.querySelector('main[data-homepage-redesign="stage76"]>.hero-copy-only');
        if(visual&&figure&&copy){const vr=rect(visual),fg=rect(figure),cr=rect(copy),ps=getComputedStyle(figure,'::after');hero={figureToCopyGap:cr.top-fg.bottom,visualToFigureGap:vr.bottom-fg.bottom,pseudoBottom:parseFloat(ps.bottom)||0,pseudoHeight:parseFloat(ps.height)||0,pseudoBackground:ps.backgroundColor,pseudoBorderTopWidth:parseFloat(ps.borderTopWidth)||0,pseudoBorderTopColor:ps.borderTopColor,pseudoBorderRadius:ps.borderTopLeftRadius};}
      }
      const footerBottom=footer?.querySelector('.footer-bottom');
      const legalControls=footerBottom?[...footerBottom.querySelectorAll(':scope>span:last-child a,:scope>span:last-child button')].filter(visible).map(el=>({tag:el.tagName,label:el.textContent?.trim()||'',...rect(el)})):[];
      const legalLineTops=[...new Set(legalControls.map(x=>Math.round(x.top)))];
      return {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,scrollHeight:document.documentElement.scrollHeight,footer:fr,grid:gr,brand:br,entity:er,blocks,intersections,gridTemplateColumns:grid?getComputedStyle(grid).gridTemplateColumns:'',entityWordBreak:es?.wordBreak||'',entityOverflowWrap:es?.overflowWrap||'',summaries:[...(footer?.querySelectorAll('details.footer-accordion>summary')||[])].filter(visible).map(el=>rect(el).height),footerTail:fr?document.documentElement.scrollHeight-fr.bottom:null,rootBackground:getComputedStyle(document.documentElement).backgroundColor,legalControls,legalLineCount:legalLineTops.length,hero};
    },{kind:target.kind});
    let disclosure=null;
    if(width<1180){
      const summary=page.locator('.site-footer details.footer-accordion summary').first();
      if(await summary.count()){
        await summary.click();
        await page.waitForTimeout(50);
        disclosure=await page.evaluate(()=>{
          const d=document.querySelector('.site-footer details.footer-accordion');
          const ul=d?.querySelector('ul');
          const r=ul?.getBoundingClientRect();
          return d&&ul?{open:d.open,hidden:Boolean(ul.hidden),display:getComputedStyle(ul).display,height:r?.height||0,runtime:d.getAttribute('data-footer-disclosure-runtime'),lastAction:d.getAttribute('data-footer-disclosure-last-action'),ariaExpanded:d.querySelector('summary')?.getAttribute('aria-expanded')||null}:null;
        });
        if(disclosure?.open) await summary.click();
      }
    }
    const issues=[];
    if(state.scrollWidth>state.clientWidth+1) issues.push(`horizontal overflow ${(state.scrollWidth-state.clientWidth).toFixed(1)}px`);
    if(state.footerTail!=null&&state.footerTail>2) issues.push(`footer tail ${state.footerTail.toFixed(1)}px > 2px`);
    for(const x of state.intersections) issues.push(`footer block intersection ${x.a} ↔ ${x.b} ${x.x.toFixed(1)}x${x.y.toFixed(1)}px`);
    if(state.summaries.some(h=>h<43.5)) issues.push('footer accordion touch target below 44px');
    if(width>=1440&&state.legalLineCount!==1) issues.push(`desktop legal controls wrap to ${state.legalLineCount} lines`);
    if(width>=1440&&!state.legalControls.some(x=>/cookie|süti/i.test(x.label))) issues.push('desktop cookie settings control missing from legal row');
    if(width>=1180&&state.rootBackground!=='rgb(29, 35, 45)') issues.push(`Safari root overscroll background ${state.rootBackground} does not match footer`);
    if(width<1180&&(!disclosure||disclosure.runtime!=='v43'||disclosure.lastAction!=='open'||disclosure.ariaExpanded!=='true'||!disclosure.open||disclosure.hidden||disclosure.display==='none'||disclosure.height<1)) issues.push('footer accordion interaction failed: '+JSON.stringify(disclosure));
    if(width<=720){
      const tracks=state.gridTemplateColumns.trim().split(/\s+/).filter(Boolean);
      if(tracks.length!==1) issues.push(`mobile footer computed ${tracks.length} columns: ${state.gridTemplateColumns}`);
      if(state.grid&&state.brand&&state.brand.width<state.grid.width-2) issues.push(`mobile brand width ${state.brand.width.toFixed(1)} < grid ${state.grid.width.toFixed(1)}`);
      if(state.grid) for(const b of state.blocks) if(b.width<state.grid.width-2) issues.push(`mobile block ${b.name} width ${b.width.toFixed(1)} < grid ${state.grid.width.toFixed(1)}`);
      if(state.entity&&state.grid&&state.entity.width<Math.max(180,state.grid.width*.75)) issues.push(`mobile entity width ${state.entity.width.toFixed(1)} implausibly narrow`);
      if(state.entityWordBreak!=='normal') issues.push(`mobile entity word-break=${state.entityWordBreak}`);
      if(!['normal',''].includes(state.entityOverflowWrap)) issues.push(`mobile entity overflow-wrap=${state.entityOverflowWrap}`);
      if(target.kind==='home'){
        if(!state.hero) issues.push('mobile homepage hero geometry missing');
        else{
          const maxGap=Number(authority.visualGeometry?.homepageHeroMedia?.mobileHeroClosureGapMaxPx||2);
          const ruleHeight=Number(authority.visualGeometry?.homepageHeroMedia?.mobileGoldRuleHeightPx||64);
          const ruleBottom=Number(authority.visualGeometry?.homepageHeroMedia?.mobileGoldRuleBottomPx??-28);
          const ruleBorder=Number(authority.visualGeometry?.homepageHeroMedia?.mobileGoldRuleBorderTopPx||4);
          if(Math.abs(state.hero.figureToCopyGap)>maxGap) issues.push(`mobile hero figure-copy gap ${state.hero.figureToCopyGap.toFixed(1)}px`);
          if(Math.abs(state.hero.visualToFigureGap)>maxGap) issues.push(`mobile hero visual-figure gap ${state.hero.visualToFigureGap.toFixed(1)}px`);
          if(Math.abs(state.hero.pseudoBottom-ruleBottom)>.5) issues.push(`mobile curved gold bottom ${state.hero.pseudoBottom.toFixed(1)}px != ${ruleBottom}px`);
          if(Math.abs(state.hero.pseudoHeight-ruleHeight)>.5) issues.push(`mobile curved sweep height ${state.hero.pseudoHeight.toFixed(1)}px != ${ruleHeight}px`);
          if(Math.abs(state.hero.pseudoBorderTopWidth-ruleBorder)>.5) issues.push(`mobile gold border width ${state.hero.pseudoBorderTopWidth.toFixed(1)}px != ${ruleBorder}px`);
          if(state.hero.pseudoBorderTopColor!=='rgb(183, 156, 68)') issues.push(`mobile gold border color ${state.hero.pseudoBorderTopColor}`);
          if(state.hero.pseudoBackground!=='rgb(255, 255, 255)') issues.push(`mobile curved sweep background ${state.hero.pseudoBackground}`);
          if(!state.hero.pseudoBorderRadius||state.hero.pseudoBorderRadius==='0px') issues.push('mobile curved sweep lost border radius');
        }
      }
    }
    const slug=`${width}x${height}-${target.lang}-${target.kind}-responsive-v43`;
    if(issues.length){await page.screenshot({path:path.join(outDir,`${slug}-FAIL.png`),fullPage:true});failures.push(`${slug}: ${issues.join(' | ')}`);}
    else if(width<=430&&target.kind==='home') await page.screenshot({path:path.join(outDir,`${slug}.png`),fullPage:true});
    reports.push({viewport:{width,height},...target,kind:'production-responsive-v43',geometry:state,issues});
    await page.close();
  }
  await context.close();
}

await browser.close();
const report={contract:'BANHALMI-LIVE-PIXEL-GEOMETRY-V43',designVersion:authority.version,base,viewports,pages,reports,failures};
fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));
if(failures.length){
  console.error(`BANHALMI live pixel geometry failed (${failures.length} page/viewport combinations):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log(`BANHALMI live pixel geometry passed: ${pages.length} pages across ${viewports.length} desktop/4K viewports with hero, footer, reviews, card, portrait-gallery and mega-menu geometry verified.`);
