import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const failures=[];
const realPages=[];
const skipDirs=new Set(['.git','node_modules','_site','dist','coverage','assets','api','.well-known']);
const generic={
  en:new Set(['learn more','read more','discover','explore','view more','see more','click here','more','next','continue']),
  hu:new Set(['tovább','bővebben','tudj meg többet','további információ','kattints ide','felfedezés','felfedezem','következő']),
  de:new Set(['mehr erfahren','weiterlesen','entdecken','mehr anzeigen','mehr sehen','hier klicken','mehr','weiter'])
};

function walk(dir,base=''){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory()&&skipDirs.has(entry.name)) continue;
    const rel=path.posix.join(base,entry.name);
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(abs,rel);
    else if(entry.isFile()&&entry.name.endsWith('.html')) inspect(rel,abs);
  }
}
function strip(h){return h.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&#39;/gi,"'").replace(/&quot;/gi,'"').replace(/\s+/g,' ').trim()}
function attrs(s){const o={};for(const m of s.matchAll(/([:\w-]+)\s*=\s*(["'])([\s\S]*?)\2/g))o[m[1].toLowerCase()]=m[3];return o}
function isRedirect(html){return /<meta[^>]+http-equiv=["']refresh["']/i.test(html)||(/location\.(?:replace|href)\s*=/i.test(html)&&!/<main\b/i.test(html));}
function langFor(rel,html){const m=html.match(/<html\b[^>]*\blang=["']([^"']+)/i);const raw=(m?.[1]||'').toLowerCase();if(raw.startsWith('hu'))return'hu';if(raw.startsWith('de'))return'de';return'en'}
function normalize(s){return strip(s).toLowerCase().replace(/[.!?:;,…–—→+]+$/u,'').replace(/\s+/g,' ').trim()}
function visibleMain(html){const m=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);return m?.[1]||html}
function inspect(rel,abs){
  const html=fs.readFileSync(abs,'utf8');
  if(isRedirect(html)) return;
  const main=visibleMain(html);const text=strip(main);
  if(text.length<160) return;
  realPages.push(rel);
  const lang=langFor(rel,html);

  const h1=[...main.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  if(h1.length!==1) failures.push(`${rel}: expected exactly one visible H1, found ${h1.length}`);
  const headings=[...main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>({n:+m[1],text:strip(m[2])})).filter(x=>x.text);
  for(let i=1;i<headings.length;i++) if(headings[i].n-headings[i-1].n>1) failures.push(`${rel}: heading level jumps H${headings[i-1].n} → H${headings[i].n} (${headings[i].text.slice(0,80)})`);

  const ids=[];for(const m of html.matchAll(/\bid=["']([^"']+)["']/gi))ids.push(m[1]);
  const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
  if(dup.length) failures.push(`${rel}: duplicate id(s): ${dup.join(', ')}`);

  for(const m of main.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)){
    const a=attrs(m[2]);const label=a['aria-label']||strip(m[3])||a.title||'';
    if(!label.trim()) failures.push(`${rel}: empty ${m[1].toLowerCase()} without accessible label`);
    const n=normalize(label);
    if(generic[lang].has(n)) failures.push(`${rel}: generic ${m[1].toLowerCase()} label "${label}"; destination/action must be explicit`);
  }
  for(const m of main.matchAll(/<img\b([^>]*)>/gi)){const a=attrs(m[1]);if(!Object.hasOwn(a,'alt')) failures.push(`${rel}: image without alt attribute`)}
  if(/(?:lorem ipsum|\bTODO\b|\bTBD\b|\{\{[^}]+\}\}|\[object Object\])/i.test(text)) failures.push(`${rel}: placeholder/debug content visible`);

  const paragraphs=[...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>strip(m[1])).filter(s=>s.length>=90);
  const seen=new Map();for(const p of paragraphs){const k=p.toLowerCase().replace(/\s+/g,' ');seen.set(k,(seen.get(k)||0)+1)}
  for(const [p,count] of seen) if(count>1) failures.push(`${rel}: same substantial paragraph repeated ${count}×: ${p.slice(0,100)}…`);

  if(/\b(?:archive-record-registry|archive-source-map|press-period-nav|museum-editorial|data-archive-page)\b/i.test(html)) failures.push(`${rel}: ART archive implementation leaked into BANHALMI commercial page`);

  const alts=[...html.matchAll(/<link\b([^>]*\brel=["'][^"']*alternate[^"']*["'][^>]*)>/gi)].map(m=>attrs(m[1])).filter(a=>a.hreflang);
  if(alts.length){const langs=new Set(alts.map(a=>a.hreflang.toLowerCase()));for(const req of ['en','hu-hu','de-at','x-default'])if(!langs.has(req)) failures.push(`${rel}: hreflang family missing ${req}`)}

  if(/(?:quote-form|quote-builder|contact-form)/i.test(html)){
    if(!/(privacy|adatv[ée]delem|datenschutz)/i.test(text+html)) failures.push(`${rel}: transactional page lacks visible privacy path`);
    if(!/<button\b[^>]*type=["']submit["']/i.test(html)) failures.push(`${rel}: transactional page lacks explicit submit button`);
  }
}
walk(root);
if(realPages.length<30) failures.push(`Only ${realPages.length} real BANHALMI content pages detected; audit discovery is probably broken.`);
if(failures.length){console.error(`BANHALMI first-principles content/structure audit FAILED (${realPages.length} pages):\n`+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`BANHALMI first-principles content/structure audit passed across ${realPages.length} real content pages.`);
