import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const siteDir=process.env.AUDIT_SITE_DIR||'_site';
const widths=(process.env.BANHALMI_DESIGN_WIDTHS||'320,360,375,390,412,430,768,820,1024,1280,1366,1440,1920,2560,3840').split(',').map(Number).filter(Boolean);
const viewportHeights=new Map([[320,568],[360,800],[375,812],[390,844],[412,915],[430,932],[768,1024],[820,1180],[1024,1366],[1280,800],[1366,768],[1440,900],[1920,1080],[2560,1440],[3840,2160]]);
const designAuthority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const basePageMaxPx=Number(designAuthority.pageMaxPx)||1280;
const baseStructuredMaxPx=Number(designAuthority.structuredMaxPx)||basePageMaxPx;
const structuredBreakpointPx=1440;
const pageMaxForWidth=(width)=>width>=2560?1760:width>=1920?1600:width>=1600?1440:basePageMaxPx;
const structuredMaxForWidth=(width)=>width>=1600?pageMaxForWidth(width):baseStructuredMaxPx;
const flow=designAuthority.layout?.documentFlow||{};
const touchTargetPx=Number(designAuthority.responsive?.touchTargetPx)||44;
const footerAbsoluteMaxPx=Number(flow.footerAbsoluteMaxPx)||760;
const structuredSelector=':scope > :is(.service-process-grid,.partner-grid,.partner-grid-memberships,.archive-cards,.two-reading-grid,.smart-quote-layout)';
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html'))files.push(full)}}
walk(siteDir);
const contentFiles=files.filter(file=>{const rel=path.relative(siteDir,file).replaceAll('\\','/');const html=fs.readFileSync(file,'utf8');if(rel.startsWith('redirects/'))return false;if(/http-equiv=["']refresh["']/i.test(html)&&html.length<7000)return false;return /<main\b/i.test(html)&&!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)});
function urlFor(file){let rel=path.relative(siteDir,file).replaceAll('\\','/');rel=rel.replace(/index\.html$/,'');return `${baseUrl}/${rel}`.replace(/([^:]\/)\/+/g,'$1')}
const browser=await chromium.launch({headless:true});const failures=[];let checks=0;
for(const width of widths){
  const height=viewportHeights.get(width)||1100;
  const pageMaxPx=pageMaxForWidth(width);
  const structuredMaxPx=structuredMaxForWidth(width);
  const page=await browser.newPage({viewport:{width,height}});
  for(const file of contentFiles){
    const rel=path.relative(siteDir,file).replaceAll('\\','/');
    await page.goto(urlFor(file),{waitUntil:'networkidle'});
    const r=await page.evaluate(({pageMaxPx,structuredMaxPx,structuredBreakpointPx,structuredSelector,touchTargetPx})=>{
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),b=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)!==0&&b.width>0&&b.height>0};
      const de=document.documentElement,body=document.body,bodyStyle=getComputedStyle(body),header=document.querySelector('.site-header'),main=document.querySelector('main'),footer=document.querySelector('.site-footer');
      const homepageSplit=innerWidth>=1180&&main?.getAttribute('data-homepage-redesign')==='stage76';
      const heroVisual=homepageSplit?main.querySelector(':scope > .hero-visual-only'):null;
      const heroCopy=homepageSplit?main.querySelector(':scope > .hero-copy-only'):null;
      const splitHero=homepageSplit&&visible(heroVisual)&&visible(heroCopy)?{visual:heroVisual.getBoundingClientRect(),copy:heroCopy.getBoundingClientRect()}:null;
      const surfaces=[];for(const el of document.querySelectorAll('main>section[data-surface]')){if(!visible(el))continue;const s=getComputedStyle(el);surfaces.push({surfaceName:el.getAttribute('data-surface'),bg:s.backgroundColor,color:s.color});}
      const wraps=[];for(const w of document.querySelectorAll('main .wrap')){if(!visible(w))continue;const b=w.getBoundingClientRect();const isStructured=innerWidth>=structuredBreakpointPx&&Boolean(w.querySelector(structuredSelector));const allowedMax=isStructured?structuredMaxPx:pageMaxPx;const isSplitHeroWrap=homepageSplit&&Boolean(w.closest('.hero-visual-only,.hero-copy-only'));const isHomepageFullBleed=homepageSplit&&b.width>innerWidth-4;if(b.width>Math.min(innerWidth,allowedMax)+4&&!isHomepageFullBleed)wraps.push({width:b.width,allowedMax,isStructured});if(!isSplitHeroWrap&&!isHomepageFullBleed&&innerWidth>=1024&&b.width<innerWidth-80&&Math.abs(b.left-(innerWidth-b.right))>5)wraps.push({axis:true,left:b.left,right:innerWidth-b.right});}
      const info=[...document.querySelectorAll('.smart-quote-layout .info-tip[data-tooltip]')].filter(visible).map(el=>({position:getComputedStyle(el).position,b:el.getBoundingClientRect(),card:el.closest('.category-card,.option-row')?.getBoundingClientRect()||null}));
      const mainBox=visible(main)?main.getBoundingClientRect():null,footerBox=visible(footer)?footer.getBoundingClientRect():null,footerBottomDocument=footerBox?footerBox.bottom+scrollY:null,bodyPaddingBottom=parseFloat(bodyStyle.paddingBottom)||0,rawAfterFooter=footerBottomDocument==null?null:Math.max(0,de.scrollHeight-footerBottomDocument),unreservedAfterFooter=rawAfterFooter==null?null:Math.max(0,rawAfterFooter-bodyPaddingBottom);
      const media=[];for(const el of document.querySelectorAll('main img,main video,main iframe,main svg')){if(!visible(el))continue;const b=el.getBoundingClientRect();if(b.left<-2||b.right>innerWidth+2||b.width>innerWidth+2)media.push(`${el.tagName.toLowerCase()} ${b.left.toFixed(1)}..${b.right.toFixed(1)}`);if(media.length>=8)break;}
      const touch=[];if(innerWidth<=1024){for(const el of document.querySelectorAll('button,summary,.btn,.menu-btn,.nav-cta,.site-header a,input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]),select,textarea')){if(!visible(el))continue;const b=el.getBoundingClientRect();if(b.height<touchTargetPx-0.5)touch.push(`${el.tagName.toLowerCase()} height=${b.height.toFixed(1)}`);if((el.matches('button,.menu-btn')||el.getAttribute('role')==='button')&&b.width<touchTargetPx-0.5)touch.push(`${el.tagName.toLowerCase()} width=${b.width.toFixed(1)}`);if(touch.length>=8)break;}}
      const activeNav=[];for(const a of document.querySelectorAll('.site-header .nav-links a.active:not(.nav-cta),.site-header .nav-links a[aria-current="page"]:not(.nav-cta),.site-header .nav-links .active>a:not(.nav-cta)')){if(!visible(a))continue;const s=getComputedStyle(a),border=parseFloat(s.borderTopWidth)+parseFloat(s.borderRightWidth)+parseFloat(s.borderBottomWidth)+parseFloat(s.borderLeftWidth);if(border>0||s.boxShadow!=='none'||(s.backgroundColor!=='rgba(0, 0, 0, 0)'&&s.backgroundColor!=='transparent')||parseFloat(s.borderRadius)>1)activeNav.push('active navigation is boxed');}
      return {overflow:de.scrollWidth-de.clientWidth,headerHeight:visible(header)?header.getBoundingClientRect().height:0,surfaces,wraps,homepageSplit,splitHero,info,bodyDisplay:bodyStyle.display,htmlBackground:getComputedStyle(de).backgroundColor,mainRight:mainBox?.right??0,footerRight:footerBox?.right??0,footerLeft:footerBox?.left??0,footerTop:footerBox?.top??null,mainBottom:mainBox?.bottom??null,rawAfterFooter,unreservedAfterFooter,media,touch,activeNav,footerHeight:footerBox?.height??0};
    },{pageMaxPx,structuredMaxPx,structuredBreakpointPx,structuredSelector,touchTargetPx});
    if(r.overflow>1)failures.push(`${rel} @${width}x${height}: document horizontal overflow ${r.overflow}px`);
    if(r.headerHeight&&(r.headerHeight<48||r.headerHeight>110))failures.push(`${rel} @${width}x${height}: header height ${r.headerHeight.toFixed(1)}px`);
    if(flow.layoutMode&&r.bodyDisplay!==flow.layoutMode)failures.push(`${rel} @${width}x${height}: body document flow is ${r.bodyDisplay}, expected ${flow.layoutMode}`);
    if(flow.documentBackground==='#ffffff'&&r.htmlBackground!=='rgb(255, 255, 255)')failures.push(`${rel} @${width}x${height}: html document floor rendered ${r.htmlBackground}, expected white`);
    if(r.mainRight>width+2)failures.push(`${rel} @${width}x${height}: main escapes viewport (${r.mainRight.toFixed(1)}px)`);
    if(r.footerRight>width+2||r.footerLeft<-2)failures.push(`${rel} @${width}x${height}: footer escapes viewport [${r.footerLeft.toFixed(1)},${r.footerRight.toFixed(1)}]`);
    if(r.footerTop!=null&&r.mainBottom!=null&&r.footerTop<r.mainBottom-Number(flow.mainToFooterOverlapTolerancePx||2))failures.push(`${rel} @${width}x${height}: footer overlaps main content by ${(r.mainBottom-r.footerTop).toFixed(1)}px`);
    if(r.unreservedAfterFooter!=null&&r.unreservedAfterFooter>Number(flow.footerAfterDocumentGapMaxPx||2))failures.push(`${rel} @${width}x${height}: ${r.unreservedAfterFooter.toFixed(1)}px unreserved document overhang remains after footer`);
    if(r.footerHeight>footerAbsoluteMaxPx&&width>=768)failures.push(`${rel} @${width}x${height}: footer occupies ${(r.footerHeight/height*100).toFixed(0)}% of viewport (${r.footerHeight.toFixed(1)}px > ${footerAbsoluteMaxPx}px contract)`);
    for(const w of r.wraps){if(w.axis)failures.push(`${rel} @${width}x${height}: wrapper not centered ${w.left.toFixed(1)}/${w.right.toFixed(1)}`);else failures.push(`${rel} @${width}x${height}: ${w.isStructured?'structured ':''}.wrap exceeds canonical max ${w.allowedMax}px (${w.width.toFixed(1)}px)`);}
    if(r.homepageSplit){
      if(!r.splitHero)failures.push(`${rel} @${width}x${height}: homepage stage76 split hero panels are not both visible`);
      else{
        const v=r.splitHero.visual,c=r.splitHero.copy;
        if(Math.abs(v.left)>2)failures.push(`${rel} @${width}x${height}: split hero visual must anchor to viewport left (${v.left.toFixed(1)}px)`);
        if(Math.abs(c.right-width)>2)failures.push(`${rel} @${width}x${height}: split hero copy must anchor to viewport right (${c.right.toFixed(1)}px of ${width}px)`);
        const verticalOverlap=v.bottom>c.top+2&&c.bottom>v.top+2;
        // Stage76 intentionally stacks the full-width visual and copy panels.
        // Horizontal geometry is comparable only when the panels share vertical space.
        if(verticalOverlap){
          if(v.right>c.left+2)failures.push(`${rel} @${width}x${height}: split hero panels overlap by ${(v.right-c.left).toFixed(1)}px`);
          if(Math.abs(v.top-c.top)>2)failures.push(`${rel} @${width}x${height}: split hero panel tops diverge by ${Math.abs(v.top-c.top).toFixed(1)}px`);
          if(Math.abs(v.height-c.height)>4)failures.push(`${rel} @${width}x${height}: split hero panel heights diverge by ${Math.abs(v.height-c.height).toFixed(1)}px`);
        }
      }
    }
    for(const s of r.surfaces){if(s.surfaceName==='white'&&s.bg!=='rgb(255, 255, 255)')failures.push(`${rel} @${width}x${height}: white surface rendered ${s.bg}`);if(s.surfaceName==='soft'&&s.bg!=='rgb(245, 245, 247)')failures.push(`${rel} @${width}x${height}: soft surface rendered ${s.bg}`);if(s.surfaceName==='dark'&&!['rgb(13, 27, 46)','rgb(32, 37, 48)','rgb(28, 31, 38)'].includes(s.bg))failures.push(`${rel} @${width}x${height}: dark surface rendered ${s.bg}`);}
    for(const i of r.info){if(i.position!=='static')failures.push(`${rel} @${width}x${height}: quote info-tip position=${i.position}`);if(i.card&&(i.b.left<i.card.left-1||i.b.right>i.card.right+1||i.b.top<i.card.top-1||i.b.bottom>i.card.bottom+1))failures.push(`${rel} @${width}x${height}: quote info-tip escapes its option card`);}
    for(const x of r.media)failures.push(`${rel} @${width}x${height}: media ${x}`);for(const x of r.touch)failures.push(`${rel} @${width}x${height}: touch target ${x}`);for(const x of r.activeNav)failures.push(`${rel} @${width}x${height}: ${x}`);
    checks++;
  }
  await page.close();
}
await browser.close();
if(failures.length){console.error(`BANHALMI exhaustive design audit failed (${failures.length} issue(s), ${checks} route/viewport checks):`);for(const f of failures.slice(0,350))console.error(`- ${f}`);if(failures.length>350)console.error(`... ${failures.length-350} more`);process.exit(1)}
console.log(`BANHALMI exhaustive design audit passed: ${contentFiles.length} content pages × ${widths.length} device-class viewports = ${checks} checks from 320×568 through 3840×2160; canonical stepped canvases, ${touchTargetPx}px touch targets, overflow, media, centering, protected split-hero geometry, footer flow and active navigation verified.`);
