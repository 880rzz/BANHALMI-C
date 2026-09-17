import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const errors=[];
const main=read('assets/js/main.js');
const a11y=read('assets/css/accessibility-stage14.css');
const stage29=read('tools/audit-mobile-menu-and-footer-stage29.mjs');

if(main.includes('getBoundingClientRect()') && main.includes('--hero-scroll-y')) errors.push('main.js still contains the legacy scroll-linked hero layout read/write loop');
if(main.includes('window.addEventListener(\"scroll\", requestUpdate')) errors.push('main.js still registers the legacy hero scroll requestUpdate handler');
if(!main.includes('Hero remains static by design: no scroll-linked layout reads or parallax writes.')) errors.push('main.js missing the static-hero performance contract');
if(!a11y.includes('/* STAGE52-PAGESPEED-RUNTIME:START */')) errors.push('accessibility-stage14.css missing Stage 52 runtime hardening');
if(!a11y.includes('.nav-links{transition:none!important;}')) errors.push('mobile navigation still lacks the no-layout-transition guard');
if(/color:#B79C44!important;[\s\S]{0,160}background:transparent!important;/.test(a11y)) errors.push('brand gold #B79C44 is still used as active mobile text on a light background');
if(!stage29.includes("'color:#8A681F!important'")) errors.push('Stage 29 must guard the AA-safe active navigation text color');
for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=read(file);
  if(!/class=\"hero-center-logo\"[^>]*fetchpriority=\"low\"|fetchpriority=\"low\"[^>]*class=\"hero-center-logo\"/.test(html)) errors.push(file+': decorative hero logo must use low fetch priority');
  if(!/data-banhalmi-lcp-preload=\"\"[^>]*fetchpriority=\"high\"|fetchpriority=\"high\"[^>]*data-banhalmi-lcp-preload=\"\"/.test(html)) errors.push(file+': photographic LCP preload must remain high priority');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Stage 52 PageSpeed runtime audit passed: no scroll-linked hero reflow, no mobile layout transition, AA active navigation gold, and one high-priority LCP candidate.');
