import fs from 'node:fs';
import path from 'node:path';

const failures=[];
const htmlFiles=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name==='.git'||entry.name==='node_modules'||entry.name==='_site'||entry.name==='dist')continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.isFile()&&entry.name.endsWith('.html'))htmlFiles.push(file);
  }
}
walk('.');
let officePages=0;
for(const file of htmlFiles){
  const html=fs.readFileSync(file,'utf8');
  if(!/class="[^"]*\bfooter-office\b/.test(html))continue;
  officePages++;
  if(/class="[^"]*\bfooter-location-profile\b/.test(html))failures.push(`${file}: office-specific company profile link remains`);
  if(!/class="[^"]*\bfooter-office\b[^>]*>[\s\S]*?<a\b[^>]*class="[^"]*footer-location-link/.test(html))failures.push(`${file}: office location link was removed with its profile link`);
}
if(officePages!==58)failures.push(`expected the 58 localized/source office footer pages, found ${officePages}`);

const css=fs.readFileSync('assets/css/site.css','utf8');
if(!css.includes('html body .site-footer .footer-accordion>summary{display:flex;align-items:center;justify-content:flex-start;gap:.65em;}'))failures.push('footer disclosure summary must place its marker after its label');
if(!css.includes('html body .site-footer .footer-accordion>summary::after{content:"+";position:static;inset:auto;width:auto;height:auto;border:0;transform:none;color:var(--gold);'))failures.push('footer disclosure marker must be a static gold plus');
if(css.includes('html body main>section.section-band[data-surface]{width:100vw'))failures.push('full-bleed section must not include the scrollbar in a 100vw width');
if(!css.includes('html body main>section.section-band[data-surface]{width:100%!important;max-width:none!important;margin-inline:0!important;}'))failures.push('section surface must align with the document content edge');
if(!css.includes('html body main h1{font-size:clamp(2.5rem,3.2vw,2.75rem)!important;line-height:1.08!important;letter-spacing:-.024em!important;text-wrap:balance;}'))failures.push('shared main H1 scale or balanced line wrapping changed');

if(failures.length){
  console.error(`Footer and design-token contract failed (${failures.length}):`);
  for(const failure of failures)console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Footer and design-token contract passed: ${officePages} localized office footers, trailing gold plus, balanced 40–44px H1 scale and scrollbar-safe section edges.`);
