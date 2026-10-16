/**
 * Measure design axes and typography on canonical HU/EN/DE routes.
 * Keeps observations separate from assertions while CSS authority is migrated.
 * Executed against the exact _site artifact AFTER CSS consolidation.
 */
import fs from 'node:fs';
import { chromium } from '@playwright/test';

const base=(process.env.AUDIT_BASE_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const routes=[
  '/', '/hu/', '/de-at/',
  '/portrait/', '/hu/portre/', '/de-at/portrait/',
  '/lifestyle/', '/hu/brand/', '/de-at/brand/',
  '/event-photography/', '/hu/rendezvenyfotozas/', '/de-at/eventfotografie/',
  '/fine-art/', '/hu/muveszi-fotografia/', '/de-at/fine-art/'
];
const widths=[390,768,1440];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[], errors=[];
try{
  for(const width of widths){
    const serviceTypographyBaseline={};
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    for(const route of routes){
      const response=await page.goto(base+route,{waitUntil:'networkidle',timeout:30000});
      if(!response?.ok()){errors.push(route+' @ '+width+': HTTP '+response?.status());continue;}
      const m=await page.evaluate(()=>{
        const find=(sel)=>document.querySelector(sel);
        const pos=(sel)=>{
          const e=find(sel);
          if(!e)return null;
          const b=e.getBoundingClientRect(),c=getComputedStyle(e);
          return {x:Math.round(b.left*10)/10,y:Math.round(b.top*10)/10,bottom:Math.round(b.bottom*10)/10,right:Math.round(b.right*10)/10,width:Math.round(b.width*10)/10,font:c.fontSize,line:c.lineHeight,weight:c.fontWeight,
            textX:Math.round((b.left+parseFloat(c.paddingLeft||0))*10)/10};
        };
        const cssLinks=[...document.querySelectorAll('link[rel="stylesheet"]')].map(x=>x.getAttribute('href'));
        const cssResources=performance.getEntriesByType('resource').filter(x=>/\/assets\/css\/[^?#]+\.css(?:[?#]|$)/.test(x.name)).map(x=>x.name.split('/').slice(-1)[0]);
        return {
          h1:pos('main h1'),h2:pos('main h2'),eyebrow:pos('main .hero .eyebrow'),
          lead:pos('main .hero .lead'),heroWrap:pos('main .hero .wrap'),
          pricing:pos('main .service-pricing-section .quote-decision-guide'),
          footerWrap:pos('.site-footer>.wrap'),footerFirst:pos('.site-footer .footer-grid>*:first-child'),
          bodyWidth:document.body.scrollWidth,docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
          cssLinks,cssResources
        };
      });
      const row={route,width,...m};
      report.push(row);
      if(m.cssLinks.filter(h=>/\/assets\/css\/.+\.css/.test(h)).length!==1)errors.push(route+' @ '+width+': expected one local CSS link, got '+JSON.stringify(m.cssLinks));
      if(m.cssLinks.some(h=>h?.includes('fluid-4k-rhythm.css')))errors.push(route+' @ '+width+': legacy fluid CSS still loaded');
      if(m.cssResources.some(x=>x.includes('fluid-4k-rhythm.css')))errors.push(route+' @ '+width+': legacy fluid CSS requested at runtime');
      if(m.docWidth>width+2)errors.push(route+' @ '+width+': horizontal overflow document='+m.docWidth);
      if(m.h1&&m.eyebrow&&Math.abs(m.h1.x-m.eyebrow.x)>5)errors.push(route+' @ '+width+': H1/eyebrow axis differs: '+m.h1.x+'/'+m.eyebrow.x);
      if(!['/','/hu/','/de-at/'].includes(route)){
        for(const [name,target] of [['description',m.lead],['pricing disclosure',m.pricing],['footer start',m.footerFirst]]){
          if(!target)errors.push(route+' @ '+width+': missing '+name+' for content-axis test');
          else if(m.h1&&Math.abs(m.h1.x-target.x)>4)errors.push(route+' @ '+width+': '+name+' axis '+target.x+' differs from H1 '+m.h1.x);
        }
        for(const role of ['h1','lead']){
          const size=Number.parseFloat(m[role]?.font);
          if(!Number.isFinite(size))errors.push(route+' @ '+width+': invalid '+role+' font size');
          else if(serviceTypographyBaseline[role]===undefined)serviceTypographyBaseline[role]=size;
          else if(Math.abs(size-serviceTypographyBaseline[role])>.6)
            errors.push(route+' @ '+width+': '+role+' font size '+size+' differs from service contract '+serviceTypographyBaseline[role]);
        }
      }
      console.log('CSS-AXIS',JSON.stringify({route,width,h1:m.h1?.x,h1Font:m.h1?.font,h2:m.h2?.x,h2Font:m.h2?.font,eyebrow:m.eyebrow?.x,lead:m.lead?.x,leadFont:m.lead?.font,pricing:m.pricing?.x,footer:m.footerWrap?.x,footerFirst:m.footerFirst?.x,links:m.cssLinks.length,overflow:m.docWidth-width}));
    }
    await page.close();
  }
}finally{await browser.close();}
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/css-axis-report.json',JSON.stringify({report,errors},null,2)+'\n');
console.log('CSS-axis report: '+report.length+' route/viewport samples; errors '+errors.length);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
