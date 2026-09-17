import fs from 'node:fs';
const css=fs.readFileSync('assets/css/site.css','utf8');
const fail=[];
const start='/* APPLE-RESPONSIVE-CONTRACT-V1:START */';
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const a=css.indexOf(start), b=css.indexOf(end);
const contract=a>=0&&b>a?css.slice(a,b):'';
if(a<0||b<=a) fail.push('single Apple responsive contract missing');
if(css.indexOf(start,a+1)!==-1||css.indexOf(end,b+1)!==-1) fail.push('multiple Apple responsive authorities detected');
for(const needle of [
  '--apple-page-max:1200px','--apple-reading-max:760px','--apple-gutter:',
  '--apple-section-space:','.section-head','.prose','.cards','.steps','.faq','.form','.site-footer'
]) if(!contract.includes(needle)) fail.push('approved layout baseline missing: '+needle);
for(const width of ['1024px','768px','560px']){
  const re=new RegExp(`@media\\s*\\(\\s*max-width\\s*:\\s*${width}\\s*\\)`);
  if(!re.test(contract)) fail.push('approved responsive breakpoint missing: '+width);
}
if(/home\.css|visual-rhythm-20260825\.css/.test(css)) fail.push('secondary CSS authority reference returned');
const markerClose=b>=0?css.indexOf('*/',b+end.length):-1;
if(markerClose>=0&&css.slice(markerClose+2).trim()) fail.push('rules found after final Apple authority');
if(fail.length){console.error('Layout authority audit failed:\n- '+fail.join('\n- '));process.exit(1)}
console.log('Layout authority audit passed: approved Aug 14 Apple baseline is the single final responsive CSS authority.');
