import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages={
  "portrait/index.html": {
    "service": "portrait",
    "category": "individual",
    "quote": "/requestaquote/",
    "kind": "commercial"
  },
  "lifestyle/index.html": {
    "service": "brand",
    "category": "brand",
    "quote": "/requestaquote/",
    "kind": "commercial"
  },
  "event-photography/index.html": {
    "service": "event",
    "category": "event",
    "quote": "/requestaquote/",
    "kind": "commercial"
  },
  "hu/portre/index.html": {
    "service": "portrait",
    "category": "individual",
    "quote": "/hu/ajanlatkeres/",
    "kind": "commercial"
  },
  "hu/brand/index.html": {
    "service": "brand",
    "category": "brand",
    "quote": "/hu/ajanlatkeres/",
    "kind": "commercial"
  },
  "hu/rendezvenyfotozas/index.html": {
    "service": "event",
    "category": "event",
    "quote": "/hu/ajanlatkeres/",
    "kind": "commercial"
  },
  "de-at/portrait/index.html": {
    "service": "portrait",
    "category": "individual",
    "quote": "/de-at/anfrage/",
    "kind": "commercial"
  },
  "de-at/brand/index.html": {
    "service": "brand",
    "category": "brand",
    "quote": "/de-at/anfrage/",
    "kind": "commercial"
  },
  "de-at/eventfotografie/index.html": {
    "service": "event",
    "category": "event",
    "quote": "/de-at/anfrage/",
    "kind": "commercial"
  },
  "glamour/index.html": {
    "service": "fine-art",
    "category": "art",
    "quote": "/requestaquote/",
    "kind": "fine-art"
  },
  "hu/muveszi-fotografia/index.html": {
    "service": "fine-art",
    "category": "art",
    "quote": "/hu/ajanlatkeres/",
    "kind": "fine-art"
  },
  "de-at/fine-art/index.html": {
    "service": "fine-art",
    "category": "art",
    "quote": "/de-at/anfrage/",
    "kind": "fine-art"
  }
};
const quotePages=["requestaquote/index.html","hu/ajanlatkeres/index.html","de-at/anfrage/index.html"];
const allowed={portrait:'individual',brand:'brand',event:'event','fine-art':'art'};
const contextualOccurrences=[];
for(const [relative,config] of Object.entries(pages)){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  const expected=config.quote+'?service='+config.service;
  const expectedCount=config.kind==='commercial'?2:1;
  if((html.split('href="'+expected+'"').length-1)!==expectedCount) errors.push(relative+': expected '+expectedCount+' service-context quote links');
  const footer=html.slice(html.indexOf('<footer class="site-footer">'));
  if(!footer.includes('href="'+config.quote+'"')) errors.push(relative+': generic footer quote link missing');
  if(footer.includes('?service=')) errors.push(relative+': service query leaked into footer');
  const head=html.slice(0,html.indexOf('</head>'));
  if(head.includes('?service=')) errors.push(relative+': service query leaked into metadata');
  if(config.kind==='commercial'){
    const selector=(html.match(/<section class="section-band next-step-selector"[\s\S]*?<\/section>/)||[''])[0];
    const framework=(html.match(/<details class="project-framework-drawer"[\s\S]*?<\/details>/)||[''])[0];
    if(!selector.includes('href="'+expected+'"')) errors.push(relative+': final package link lacks service context');
    if(!framework.includes('href="'+expected+'"')) errors.push(relative+': project-framework link lacks service context');
  }else{
    const cta=(html.match(/<section class="cta-band" id="private-conversation">[\s\S]*?<\/section>/)||[''])[0];
    if(!cta.includes('href="'+expected+'"')) errors.push(relative+': Fine Art private CTA lacks service context');
  }
  for(const match of html.matchAll(/href="([^"]+\?service=([^"]+))"/g)) contextualOccurrences.push({file:relative,href:match[1],service:match[2]});
}
if(contextualOccurrences.length!==21) errors.push('expected exactly 21 scoped service-context links, found '+contextualOccurrences.length);
for(const item of contextualOccurrences) if(!Object.prototype.hasOwnProperty.call(allowed,item.service)) errors.push(item.file+': unsupported public service context '+item.service);
const engine=fs.readFileSync(path.join(root,'assets/js/quote-calculator.js'),'utf8');
for(const token of ['serviceContextToCategory','categoryToServiceContext','new URLSearchParams(window.location.search)','Object.prototype.hasOwnProperty.call(serviceContextToCategory','applyRequestedServiceContext(f)','syncServiceContextFromCategory(f,true)','input[name="service_context"]','updateServiceContextLanguageLinks','window.history.replaceState']) if(!engine.includes(token)) errors.push('quote-calculator.js: missing '+token);
for(const [service,category] of Object.entries(allowed)) if(!engine.includes((service.includes('-')?"'"+service+"'":service)+":'"+category+"'")) errors.push('quote-calculator.js: missing allowlist mapping '+service+' → '+category);
for(const relative of quotePages){
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  if(!html.includes('/assets/js/quote-calculator.js?v=20260806-service-context')) errors.push(relative+': current quote engine version missing');
  const head=(html.match(/<head>[\s\S]*?<\/head>/)||[''])[0];
  if(head.includes('?service=')) errors.push(relative+': source metadata must stay query-free');
  const switcher=(html.match(/<div aria-label="[^"]+" class="lang-switch"[\s\S]*?<\/div>/)||[''])[0];
  if(!switcher||switcher.includes('?service=')) errors.push(relative+': source language switch must stay query-free');
  if((html.match(/name="category"[^>]*value="individual"|value="individual"[^>]*name="category"/g)||[]).length<1) errors.push(relative+': individual fallback category missing');
}
const regression=fs.readFileSync(path.join(root,'tools/audit-regression.mjs'),'utf8');
if(!regression.includes('/assets/js/quote-calculator.js?v=20260806-service-context')) errors.push('audit-regression.mjs: current quote engine cache contract missing');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-twenty-four quote service-context audit passed: 21 scoped links map four public services safely across three localized quote builders.');
