import fs from 'node:fs';
import path from 'node:path';

const origin='https://www.norbertbanhalmi.com';
const failures=[];
const titles=new Map();
const descriptions=new Map();
const pages=[];
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','api','.well-known']);

function decode(v=''){return String(v).replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&nbsp;/gi,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))}
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)=(["'])(.*?)\2/g))o[m[1].toLowerCase()]=decode(m[3]);return o}
function isRedirect(h){return /<meta[^>]+http-equiv=["']refresh["']/i.test(h)||(/location\.(?:replace|href)\s*=/i.test(h)&&!/<main\b/i.test(h))}
function meta(h,key){for(const m of h.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(m[0]);if((a.name||'').toLowerCase()===key||(a.property||'').toLowerCase()===key)return a.content||''}return''}
function links(h,rel){const out=[];for(const m of h.matchAll(/<link\b[^>]*>/gi)){const a=attrs(m[0]);if((a.rel||'').toLowerCase().split(/\s+/).includes(rel))out.push(a)}return out}
function text(v){return decode(String(v||'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim()}
function norm(v){return text(v).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()}
function expectedLang(rel){if(rel.startsWith('hu/'))return'hu';if(rel.startsWith('de-at/'))return'de';return'en'}
function expectedCanonical(rel){if(rel==='index.html')return origin+'/';return origin+'/'+rel.replace(/index\.html$/,'')}
function repeatedKeyword(title){const stop=new Set(['banhalmi','and','the','for','in','of','a','an','und','für','der','die','das','von','és','a','az','egy','fotózás','photography','fotografie']);const counts=new Map();for(const w of norm(title).split(/\s+/)){if(!w||stop.has(w)||w.length<3)continue;counts.set(w,(counts.get(w)||0)+1)}return [...counts.entries()].filter(([,n])=>n>=3).map(([w])=>w)}
function collectJsonLd(h,rel){const blocks=[];for(const m of h.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{blocks.push(JSON.parse(m[1]))}catch(e){failures.push(`${rel}: invalid JSON-LD: ${e.message}`)}}return blocks}
function flattenGraph(data){if(Array.isArray(data))return data.flatMap(flattenGraph);if(data&&Array.isArray(data['@graph']))return data['@graph'];return data&&typeof data==='object'?[data]:[]}
function inspect(rel,file){
  if(/(^|\/)404\.html$/i.test(rel))return;
  const h=fs.readFileSync(file,'utf8');if(isRedirect(h)||!/<main\b/i.test(h))return;
  const visible=text(h.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||'');if(visible.length<160)return;
  const lang=(h.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]||'').toLowerCase();
  const expLang=expectedLang(rel);
  const title=text(h.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'');
  const desc=text(meta(h,'description'));
  const h1s=[...h.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>text(m[1])).filter(Boolean);
  const canonical=links(h,'canonical')[0]?.href||'';
  const expCanonical=expectedCanonical(rel);
  const ogTitle=text(meta(h,'og:title')),ogDesc=text(meta(h,'og:description')),ogUrl=meta(h,'og:url');
  const twTitle=text(meta(h,'twitter:title')),twDesc=text(meta(h,'twitter:description'));

  if(!lang.startsWith(expLang))failures.push(`${rel}: html lang ${lang||'missing'} does not match ${expLang} route family`);
  if(!title)failures.push(`${rel}: title missing`);
  if(!desc)failures.push(`${rel}: meta description missing`);
  if(h1s.length!==1)failures.push(`${rel}: expected one clear page H1, found ${h1s.length}`);
  if(title&&/(?:…|\.\.\.)\s*$/.test(title))failures.push(`${rel}: title is artificially truncated`);
  if(desc&&/(?:…|\.\.\.)\s*$/.test(desc))failures.push(`${rel}: meta description is artificially truncated`);
  if(title&&/^\s*(home|profile|start|kezdőlap|főoldal)\s*(?:\||-|$)/i.test(title))failures.push(`${rel}: vague title text`);
  for(const kw of repeatedKeyword(title))failures.push(`${rel}: title keyword stuffing risk (${kw} repeated 3+ times)`);
  if((title.match(/BANHALMI/gi)||[]).length>1)failures.push(`${rel}: BANHALMI repeated in title`);

  if(title){const n=norm(title);const prev=titles.get(n);if(prev)failures.push(`${rel}: duplicate title also used by ${prev}`);else titles.set(n,rel)}
  if(desc){const n=norm(desc);const prev=descriptions.get(n);if(prev)failures.push(`${rel}: duplicate meta description also used by ${prev}`);else descriptions.set(n,rel)}

  if(canonical!==expCanonical)failures.push(`${rel}: canonical mismatch; expected ${expCanonical}, got ${canonical||'missing'}`);
  if(ogUrl&&ogUrl!==canonical)failures.push(`${rel}: og:url must match canonical`);
  if(ogTitle&&ogTitle!==title)failures.push(`${rel}: internal social-title parity drift`);
  if(twTitle&&twTitle!==title)failures.push(`${rel}: internal Twitter-title parity drift`);
  if(ogDesc&&ogDesc!==desc)failures.push(`${rel}: internal social-description parity drift`);
  if(twDesc&&twDesc!==desc)failures.push(`${rel}: internal Twitter-description parity drift`);

  const alternates=links(h,'alternate').filter(a=>a.hreflang);
  const self=alternates.find(a=>(a.hreflang||'').toLowerCase()===lang || (expLang==='en'&&(a.hreflang||'').toLowerCase()==='en') || (expLang==='hu'&&(a.hreflang||'').toLowerCase()==='hu-hu') || (expLang==='de'&&(a.hreflang||'').toLowerCase()==='de-at'));
  if(alternates.length&&!self)failures.push(`${rel}: hreflang set has no self-referential language alternate`);

  const nodes=collectJsonLd(h,rel).flatMap(flattenGraph);
  const allJson=JSON.stringify(nodes);
  if(/"homeLocation"\s*:/.test(allJson))failures.push(`${rel}: business-site schema must not use Person.homeLocation`);
  for(const node of nodes){
    const types=[].concat(node?.['@type']||[]);
    if(types.some(t=>['WebPage','ProfilePage','AboutPage','ContactPage','FAQPage','CollectionPage'].includes(t))){
      if(node.url&&node.url!==canonical)failures.push(`${rel}: ${types.join('/')} schema url must match canonical`);
      if(node.inLanguage){const il=String(node.inLanguage).toLowerCase();if(expLang==='hu'&&!il.startsWith('hu'))failures.push(`${rel}: schema inLanguage must be Hungarian`);if(expLang==='de'&&!il.startsWith('de'))failures.push(`${rel}: schema inLanguage must be German`);if(expLang==='en'&&!il.startsWith('en'))failures.push(`${rel}: schema inLanguage must be English`)}
      // Exact parity is an internal consistency guard, not a Google ranking rule.
      if(node.name&&title&&norm(node.name)!==norm(title))failures.push(`${rel}: page-level schema name drift from title`);
      if(node.description&&desc&&norm(node.description)!==norm(desc))failures.push(`${rel}: page-level schema description drift from meta description`);
    }
  }
  pages.push(rel);
}
function walk(d,b=''){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const rel=path.posix.join(b,e.name),p=path.join(d,e.name);if(e.isDirectory())walk(p,rel);else if(e.isFile()&&e.name.endsWith('.html'))inspect(rel,p)}}
walk('.');
if(pages.length<50)failures.push(`Google Search contract coverage unexpectedly low: ${pages.length} pages`);
if(failures.length){console.error('BANHALMI Google Search contract FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`BANHALMI Google Search contract passed across ${pages.length} real content pages: unique people-first titles/descriptions, canonical/hreflang language alignment, plus internally synchronized social and page-level structured data.`);
