import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const errors=[];
const css=fs.readFileSync(path.join(root,'assets/css/style.css'),'utf8');
for(const token of ['STAGE43-INLINE-PRESENTATION:START','.smart-quote-layout .location-cards{margin-top:28px;}','.smart-quote-layout .field.consent label{font-weight:400;}','.form [data-form-note]{margin-top:16px;color:var(--gold-deep);}','STAGE43-INLINE-PRESENTATION:END']){
  if(!css.includes(token)) errors.push(`style.css missing Stage 43 shared presentation contract: ${token}`);
}

const forbidden=[
  /<div\b[^>]*class=["'][^"']*\blocation-cards\b[^"']*["'][^>]*\sstyle=["'][^"']*margin-top\s*:\s*28px/gi,
  /<label\b(?=[^>]*\bfor=["']consent["'])[^>]*\sstyle=["'][^"']*font-weight\s*:\s*400/gi,
  /<p\b(?=[^>]*\bdata-form-note(?:=["'][^"']*["'])?)[^>]*\sstyle=["'][^"']*(?:margin-top\s*:\s*16px|color\s*:\s*var\(--gold-deep\))/gi
];

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(entry.name)) continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()){walk(full);continue;}
    if(!entry.name.endsWith('.html')) continue;
    const html=fs.readFileSync(full,'utf8');
    for(const re of forbidden){
      re.lastIndex=0;
      if(re.test(html)) errors.push(`${path.relative(root,full)} contains deprecated inline form/contact presentation`);
    }
  }
}
walk(root);

if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('Stage 43 inline-presentation audit passed: reusable contact/form presentation is class-based across the repository.');
