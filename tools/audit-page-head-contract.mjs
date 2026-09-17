import fs from 'node:fs';
import path from 'node:path';

const origin='https://www.norbertbanhalmi.com';
const failures=[];let pages=0;
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','api','.well-known']);
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)=(["'])(.*?)\2/g))o[m[1].toLowerCase()]=m[3];return o}
function isRedirect(h){return /<meta[^>]+http-equiv=["']refresh["']/i.test(h)||(/location\.(?:replace|href)\s*=/i.test(h)&&!/<main\b/i.test(h))}
function meta(h,key){for(const m of h.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(m[0]);if((a.name||'').toLowerCase()===key||(a.property||'').toLowerCase()===key)return a.content||''}return''}
function link(h,rel){for(const m of h.matchAll(/<link\b[^>]*>/gi)){const a=attrs(m[0]);if((a.rel||'').toLowerCase().split(/\s+/).includes(rel))return a.href||''}return''}
function expectedLang(rel){if(rel.startsWith('hu/'))return'hu';if(rel.startsWith('de-at/'))return'de';return'en'}
function inspect(rel,file){if(/(^|\/)404\.html$/i.test(rel))return;const h=fs.readFileSync(file,'utf8');if(isRedirect(h)||!/<main\b/i.test(h))return;const visible=(h.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();if(visible.length<160)return;pages++;
 const title=(h.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/<[^>]+>/g,' ').trim();if(!title)failures.push(`${rel}: title missing`);
 if(!meta(h,'description'))failures.push(`${rel}: meta description missing`);
 const canonical=link(h,'canonical');if(!canonical)failures.push(`${rel}: canonical missing`);else{let u;try{u=new URL(canonical)}catch{}if(!u||u.origin!==origin)failures.push(`${rel}: canonical must use ${origin}: ${canonical}`);}
 const required=['og:title','og:description','og:url','og:image','twitter:card','twitter:title','twitter:description','twitter:image'];for(const k of required)if(!meta(h,k))failures.push(`${rel}: ${k} missing`);
 const siteName=meta(h,'og:site_name');if(siteName&&siteName!=='BANHALMI')failures.push(`${rel}: og:site_name must be BANHALMI when present`);
 if(canonical&&meta(h,'og:url')&&meta(h,'og:url')!==canonical)failures.push(`${rel}: og:url must equal canonical`);
 const lang=(h.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]||'').toLowerCase();if(!lang.startsWith(expectedLang(rel)))failures.push(`${rel}: html lang ${lang||'missing'} does not match route family ${expectedLang(rel)}`);
}
function walk(d,b=''){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const rel=path.posix.join(b,e.name),p=path.join(d,e.name);if(e.isDirectory())walk(p,rel);else if(e.isFile()&&e.name.endsWith('.html'))inspect(rel,p)}}
walk('.');if(pages<30)failures.push(`real BANHALMI head-contract coverage unexpectedly low: ${pages}`);if(failures.length){console.error('BANHALMI page-head contract FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}console.log(`BANHALMI page-head contract passed across ${pages} real content pages.`);
