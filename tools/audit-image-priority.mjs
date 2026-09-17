import fs from 'node:fs';
import path from 'node:path';
const failures=[];
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','api','.well-known']);
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)=(["'])(.*?)\2/g))o[m[1].toLowerCase()]=m[3];return o}
function isRedirect(h){return /<meta[^>]+http-equiv=["']refresh["']/i.test(h)||(/location\.(?:replace|href)\s*=/i.test(h)&&!/<main\b/i.test(h))}
function inspect(rel,abs){const h=fs.readFileSync(abs,'utf8');if(isRedirect(h)||!/<main\b/i.test(h))return;const imgs=[...h.matchAll(/<img\b[^>]*>/gi)].map(m=>({tag:m[0],a:attrs(m[0])}));const high=imgs.filter(x=>(x.a.fetchpriority||'').toLowerCase()==='high');if(high.length>1)failures.push(`${rel}: ${high.length} high-priority images compete on one page`);for(const x of high){if((x.a.loading||'').toLowerCase()!=='eager')failures.push(`${rel}: high-priority image must be loading=eager`);if(/gallery|footer|lightbox|review/i.test(x.a.class||''))failures.push(`${rel}: gallery/footer/lightbox image must not be high priority`)}for(const x of imgs){if((x.a.loading||'').toLowerCase()==='lazy'&&(x.a.fetchpriority||'').toLowerCase()==='high')failures.push(`${rel}: lazy image cannot have fetchpriority=high`)}const preloads=[...h.matchAll(/<link\b[^>]*rel=["']preload["'][^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>(a.as||'').toLowerCase()==='image');if(preloads.length>1)failures.push(`${rel}: ${preloads.length} image preloads compete on one page`)}
function walk(d,b=''){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const rel=path.posix.join(b,e.name),abs=path.join(d,e.name);if(e.isDirectory())walk(abs,rel);else if(e.isFile()&&e.name.endsWith('.html'))inspect(rel,abs)}}
walk('.');
if(failures.length){console.error('Image priority audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('Image priority audit passed: one LCP candidate at most, no high-priority gallery/footer competition.');
