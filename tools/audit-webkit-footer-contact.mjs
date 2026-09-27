import fs from 'node:fs';
import path from 'node:path';
import { webkit } from 'playwright';

const base=process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173';
const outDir='artifacts/webkit-footer-contact';
fs.mkdirSync(outDir,{recursive:true});
const failures=[];
const desktopRoutes=['/','/portrait/','/lifestyle/','/event-photography/','/hu/','/hu/portre/','/de-at/','/de-at/portrait/'];
const mobileRoutes=['/','/portrait/'];
const browser=await webkit.launch({headless:true});

for(const width of [1280,1440,1920]){
  const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1});
  for(const route of desktopRoutes){
    const page=await context.newPage();
    const response=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded',timeout:30000});
    if(!response?.ok()){failures.push(`${width}px ${route}: HTTP ${response?.status()??'none'}`);await page.close();continue;}
    await page.waitForTimeout(250);
    const state=await page.evaluate(()=>{
      const footer=document.querySelector('.site-footer');
      const contact=document.querySelector('.footer-grid>div:has(.footer-contact-list)>.footer-heading');
      const memberships=document.querySelector('details.footer-accordion[data-memberships-footer]>summary');
      const legal=document.querySelector('.footer-grid>div:has(.footer-legal-list)>.footer-heading');
      const rect=e=>e?e.getBoundingClientRect():null;
      const bodyStyle=getComputedStyle(document.body),htmlStyle=getComputedStyle(document.documentElement);
      const footerRect=rect(footer);
      const bodyScrollTop=document.body.scrollTop||0;
      const tail=footerRect?Math.max(0,document.body.scrollHeight-(footerRect.bottom+bodyScrollTop)):null;
      return {
        safariClass:document.documentElement.classList.contains('banhalmi-desktop-safari'),
        htmlOverflowY:htmlStyle.overflowY,
        bodyOverflowY:bodyStyle.overflowY,
        tail,
        tops:[contact,memberships,legal].map(e=>e?Math.round(e.getBoundingClientRect().top):null),
        footerWidth:footerRect?.width||0,
        viewport:innerWidth,
        scrollWidth:document.documentElement.scrollWidth
      };
    });
    if(!state.safariClass)failures.push(`${width}px ${route}: WebKit did not activate Safari desktop root containment`);
    if(!['hidden','clip'].includes(state.htmlOverflowY))failures.push(`${width}px ${route}: html overflow-y=${state.htmlOverflowY}, expected hidden/clip`);
    if(!['auto','scroll'].includes(state.bodyOverflowY))failures.push(`${width}px ${route}: body overflow-y=${state.bodyOverflowY}, expected auto/scroll`);
    if(state.tail==null||state.tail>2)failures.push(`${width}px ${route}: ${state.tail}px in-flow document tail remains after footer`);
    if(state.tops.some(v=>v==null)||Math.max(...state.tops)-Math.min(...state.tops)>2)failures.push(`${width}px ${route}: Contact/Memberships/Legal heading tops differ ${JSON.stringify(state.tops)}`);
    if(state.scrollWidth>width+2)failures.push(`${width}px ${route}: horizontal overflow ${state.scrollWidth-width}px`);
    if(Math.abs(state.footerWidth-width)>2)failures.push(`${width}px ${route}: footer width ${state.footerWidth} != viewport ${width}`);
    if(width===1440&&['/','/portrait/'].includes(route))await page.screenshot({path:path.join(outDir,`desktop-${route==='/'?'home':'portrait'}.png`),fullPage:true});
    await page.close();
  }
  await context.close();
}

{
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1});
  for(const route of mobileRoutes){
    const page=await context.newPage();
    const response=await page.goto(new URL(route,base).href,{waitUntil:'domcontentloaded',timeout:30000});
    if(!response?.ok()){failures.push(`390px ${route}: HTTP ${response?.status()??'none'}`);await page.close();continue;}
    await page.waitForTimeout(250);
    const trigger=page.locator('.banhalmi-contact-trigger');
    await trigger.click();
    await page.waitForTimeout(80);
    const openState=await page.evaluate(()=>{
      const panel=document.querySelector('.banhalmi-contact-panel'),trigger=document.querySelector('.banhalmi-contact-trigger');
      const p=panel?.getBoundingClientRect(),t=trigger?.getBoundingClientRect();
      return {
        hidden:panel?.hidden,
        expanded:trigger?.getAttribute('aria-expanded'),
        panel:p&&{top:p.top,bottom:p.bottom,left:p.left,right:p.right,height:p.height},
        trigger:t&&{top:t.top,bottom:t.bottom,left:t.left,right:t.right,height:t.height},
        titleTop:document.querySelector('.banhalmi-contact-head')?.getBoundingClientRect().top??null
      };
    });
    if(openState.hidden||openState.expanded!=='true')failures.push(`390px ${route}: contact panel did not open`);
    if(!openState.panel||!openState.trigger)failures.push(`390px ${route}: contact panel/trigger geometry missing`);
    else{
      if(openState.panel.bottom>openState.trigger.top-4)failures.push(`390px ${route}: panel overlaps Contact trigger (${openState.panel.bottom.toFixed(1)} > ${openState.trigger.top.toFixed(1)})`);
      if(openState.panel.top<8||openState.titleTop<8)failures.push(`390px ${route}: contact panel title clipped above viewport`);
      if(openState.panel.left<8||openState.panel.right>382)failures.push(`390px ${route}: contact panel escapes viewport`);
      if(openState.trigger.height<44)failures.push(`390px ${route}: Contact trigger below 44px`);
    }
    await trigger.click();
    const closed=await page.evaluate(()=>({hidden:document.querySelector('.banhalmi-contact-panel')?.hidden,expanded:document.querySelector('.banhalmi-contact-trigger')?.getAttribute('aria-expanded')}));
    if(!closed.hidden||closed.expanded!=='false')failures.push(`390px ${route}: second Contact-trigger click did not close panel`);
    await page.screenshot({path:path.join(outDir,`mobile-${route==='/'?'home':'portrait'}.png`),fullPage:false});
    await page.close();
  }
  await context.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify({failures},null,2));
if(failures.length){console.error('WebKit footer/contact audit failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('WebKit footer/contact audit passed: Safari desktop root tail, footer heading baseline and mobile Contact Dock V2 verified.');
