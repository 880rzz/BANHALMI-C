import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const cssPath=path.join(root,'assets/css/accessibility-stage14.css');
if(!fs.existsSync(cssPath))errors.push('accessibility stylesheet missing');
else{const css=fs.readFileSync(cssPath,'utf8');for(const token of [':focus-visible','min-height:44px','aria-invalid','prefers-reduced-motion','forced-colors'])if(!css.includes(token))errors.push(`stylesheet missing ${token}`);}
const pages=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules'].includes(entry.name))continue;const p=path.join(dir,entry.name);if(entry.isDirectory())walk(p);else if(entry.name.endsWith('.html'))pages.push(p)}}
walk(root);
const homePages=new Set(['index.html','hu/index.html','de-at/index.html']);
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  if(!html.includes('</head>'))continue;
  const relative=path.relative(root,file).replaceAll('\\','/');
  if(homePages.has(relative)){
    if(!html.includes('data-banhalmi-home-a11y'))errors.push(`${relative}: homepage critical accessibility CSS not inlined`);
    if(html.includes('<link href="/assets/css/accessibility-stage14.css'))errors.push(`${relative}: render-blocking accessibility stylesheet must not remain on the homepage`);
    for(const token of [':focus-visible','min-height:44px','prefers-reduced-motion','PAGESPEED-STAGE56-PAINT','STAGE52-PAGESPEED-RUNTIME','PAGESPEED-STAGE57-MOBILE-HERO-VIDEO']) if(!html.includes(token))errors.push(`${relative}: inline accessibility contract missing ${token}`);
  }else if(!html.includes('/assets/css/accessibility-stage14.css'))errors.push(`${relative}: accessibility stylesheet not linked`);
}
for(const relative of ['contact/index.html','hu/kapcsolat/index.html','de-at/kontakt/index.html','requestaquote/index.html','hu/ajanlatkeres/index.html','de-at/anfrage/index.html']){const file=path.join(root,relative);if(!fs.existsSync(file))errors.push(`${relative}: missing key form page`);else{const html=fs.readFileSync(file,'utf8');if(!/<form\b/i.test(html))errors.push(`${relative}: form missing`);if(!/required/i.test(html))errors.push(`${relative}: required fields missing`);}}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Stage fourteen accessibility audit passed for ${pages.length} HTML files; EN/HU/DE homepages inline the critical accessibility layer to remove one render-blocking request.`);
