import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const errors=[];
const css=read('assets/css/style.css');
const a11y=read('assets/css/accessibility-stage14.css');
const llms=read('llms.txt');
const pkg=JSON.parse(read('package.json'));

for(const token of [
  '--footer-gold:#CBB45F',
  '.site-footer .footer-accordion summary',
  '.site-footer .footer-bottom{color:#AEB4C2!important;}'
]) if(!css.includes(token)) errors.push(`style.css missing PageSpeed footer contract: ${token}`);

for(const token of ['.lang-switch a','.site-footer a','.banhalmi-ecosystem a','min-height:44px']){
  if(!a11y.includes(token)) errors.push(`accessibility-stage14.css missing touch-target contract: ${token}`);
}

if(!llms.startsWith('# BANHALMI\n\n>')) errors.push('llms.txt must begin with H1 then blockquote summary for agent discovery');
for(const token of [
  'Vienna and Budapest are the two active operational bases',
  'New York is a major international reference and oeuvre chapter',
  'New York is not a studio, office, headquarters or operational base'
]){
  if(!llms.includes(token)) errors.push(`llms.txt missing geography distinction: ${token}`);
}
if(!pkg.scripts.audit.includes('audit-internal-anchor-targets-stage31.mjs')) errors.push('Stage 31 internal-fragment audit is not wired into the main audit chain');

const home={
  'index.html':'with a substantial New York reference archive.',
  'hu/index.html':'jelentős New York-i referenciaanyaggal.',
  'de-at/index.html':'einem umfangreichen New-York-Referenzarchiv.'
};
for(const [file,token] of Object.entries(home)){
  const html=read(file);
  if(!html.includes(token)) errors.push(`${file}: New York reference context missing from footer`);
  if(/New York (?:studio|operational base)/i.test(html)) errors.push(`${file}: New York must not be represented as an operational studio/base`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Stage 32 PageSpeed audit passed: footer contrast/hierarchy, mobile touch targets, concise agent entry format, fragment auditing and New York reference geography are guarded.');
