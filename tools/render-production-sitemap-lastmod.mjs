import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const siteRoot=path.resolve(process.argv[2]||'_site');
const sitemapPath=path.join(siteRoot,'sitemap.xml');
const origin='https://www.norbertbanhalmi.com';
let xml=fs.readFileSync(sitemapPath,'utf8');
let sourceBacked=0;
let withoutSource=0;
function sourcePathFor(urlString){
  const url=new URL(urlString);
  if(url.origin!==origin) return null;
  const pathname=decodeURIComponent(url.pathname);
  if(pathname==='/') return 'index.html';
  const clean=pathname.replace(/^\//,'');
  return clean.endsWith('/')?clean+'index.html':clean;
}
function gitDate(file){
  if(!file||!fs.existsSync(file)) return null;
  try{return execFileSync('git',['log','-1','--format=%cs','--',file],{encoding:'utf8'}).trim()||null;}catch{return null;}
}
xml=xml.replace(/<url>\s*([\s\S]*?)\s*<\/url>/g,(whole,body)=>{
  const loc=body.match(/<loc>([^<]+)<\/loc>/)?.[1];
  if(!loc) return whole;
  const file=sourcePathFor(loc);
  const date=gitDate(file);
  let next=body.replace(/\s*<lastmod>[^<]+<\/lastmod>/g,'');
  if(date){sourceBacked++;next=next.replace(/(<loc>[^<]+<\/loc>)/,'$1\n    <lastmod>'+date+'</lastmod>');}
  else withoutSource++;
  return '<url>\n'+next.trim()+'\n  </url>';
});
fs.writeFileSync(sitemapPath,xml.endsWith('\n')?xml:xml+'\n');
const rendered=fs.readFileSync(sitemapPath,'utf8');
if(!/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(rendered)) throw new Error('Rendered production sitemap has no truthful source-backed lastmod values');
console.log('Production sitemap lastmod rendered from full Git history: '+sourceBacked+' source-backed URLs; '+withoutSource+' entries without a source file left without lastmod.');
