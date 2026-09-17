import fs from 'node:fs';

const css = fs.readFileSync('assets/css/site.css','utf8');
const failures = [];
const start = 'APPLE-RESPONSIVE-CONTRACT-V1:START';
const end = 'APPLE-RESPONSIVE-CONTRACT-V1:END';
const a = css.lastIndexOf(start);
const b = css.lastIndexOf(end);
if (a < 0 || b <= a) failures.push('Apple responsive contract marker missing');
if (a >= 0 && css.indexOf(start) !== a) failures.push('Apple responsive contract START marker must appear exactly once');
if (b >= 0 && css.indexOf(end) !== b) failures.push('Apple responsive contract END marker must appear exactly once');
if (b >= 0) {
  const markerClose = css.indexOf('*/', b + end.length);
  if (markerClose < 0) failures.push('Apple responsive contract END comment is not closed');
  else if (css.slice(markerClose + 2).trim()) failures.push('Apple responsive contract must be the final CSS authority; rules found after END marker');
}
const contract = a >= 0 && b > a ? css.slice(a,b) : '';

for (const needle of [
  '--apple-page-max:1200px','--apple-reading-max:760px','--apple-gutter:',
  '--apple-section-space:','text-align:left','min-height:44px',
  '.section-head','.prose','.cards','.steps','.timeline','.faq','.form','.legal',
  '.quote-step','.cta-band','.site-footer'
]) if (!contract.includes(needle)) failures.push(`approved baseline missing: ${needle}`);

for (const width of ['1024px','768px','560px']) {
  const re = new RegExp(`@media\\s*\\(\\s*max-width\\s*:\\s*${width.replace('.', '\\.') }\\s*\\)`);
  if (!re.test(contract)) failures.push(`approved baseline missing responsive breakpoint: ${width}`);
}

function rgb(hex){const v=hex.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255)}
function channel(v){return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
function luminance(hex){const [r,g,b]=rgb(hex).map(channel);return .2126*r+.7152*g+.0722*b}
function contrast(x,y){const [hi,lo]=[luminance(x),luminance(y)].sort((m,n)=>n-m);return (hi+.05)/(lo+.05)}
for (const [fg,bg,min,label] of [
  ['#202530','#FFFFFF',7,'primary text / light'],
  ['#6E6E73','#FFFFFF',4.5,'muted text / light'],
  ['#8A681F','#FFFFFF',4.5,'gold text / light'],
  ['#FFFFFF','#202530',7,'white text / dark']
]) if (contrast(fg,bg) < min) failures.push(`${label} contrast ${contrast(fg,bg).toFixed(2)} < ${min}`);
if (contrast('#B79C44','#FFFFFF') >= 4.5) failures.push('brand gold contrast assumption changed; review accent policy');
if (/color\s*:\s*#?B79C44/i.test(contract)) failures.push('#B79C44 may not be used as light-background text in the final contract');

const htmlFiles = [];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(['.git','node_modules','_site'].includes(e.name)) continue; const p=`${dir}/${e.name}`.replace(/^\.\//,''); if(e.isDirectory()) walk(p); else if(p.endsWith('.html')) htmlFiles.push(p)}}
walk('.');
const realPages = htmlFiles.filter(p=>!p.startsWith('redirects/'));
if (realPages.length < 50) failures.push(`unexpectedly low HTML coverage: ${realPages.length}`);

const workflow = fs.readFileSync('.github/workflows/pages.yml','utf8');
if (workflow.includes('home.css')) failures.push('site.css must remain the only production stylesheet; home.css generation detected');
if (workflow.includes('purgecss')) failures.push('homepage PurgeCSS fork detected; single CSS authority must not be split');

if (failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Approved Aug 14 Apple CSS baseline passed for BANHALMI: ${realPages.length} HTML files; one final CSS authority, responsive geometry and contrast guards active.`);
