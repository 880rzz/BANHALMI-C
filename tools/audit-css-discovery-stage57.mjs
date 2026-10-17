import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const skip=new Set(['.git','node_modules','.github']);
const files=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(skip.has(entry.name))continue;
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.name.endsWith('.html'))files.push(file);
  }
}
walk(root);

let audited=0;
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  if(!/<html\b/i.test(html)||!/<\/head\s*>/i.test(html))continue;
  const rel=path.relative(root,file).replaceAll('\\','/');
  const links=[...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css(?:\?[^"']*)?)["'][^>]*>/gi)];
  const canonical=links.filter(match=>match[1].startsWith('/assets/css/site.css?v=design-'));
  audited++;
  if(canonical.length!==1)failures.push(rel+': exactly one versioned canonical site.css link is required');
  if(links.length!==1)failures.push(rel+': only one stylesheet link is allowed');
  if(links.some(match=>/fluid-4k-rhythm|accessibility-stage14|mega-menu\.css|(?:^|\/)style\.css(?:\?|$)/i.test(match[1])))
    failures.push(rel+': retired stylesheet URL found');
  if(['index.html','hu/index.html','de-at/index.html'].includes(rel)&&/<script\b[^>]*src=["']https:\/\/cdn\.trustindex\.io\//i.test(html))
    failures.push(rel+': Trustindex must remain interaction-gated, not static');
}

if(failures.length){
  for(const failure of failures)console.error('FAIL '+failure);
  process.exit(1);
}
console.log('CSS discovery audit passed for '+audited+' HTML pages: one versioned site.css is parser-discovered in the initial head; no retired CSS URL or static Trustindex embed found.');
