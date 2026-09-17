import fs from 'node:fs';
import path from 'node:path';
const failures=[];
const seenDescriptions=new Map();
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','api','.well-known']);
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)=(["'])(.*?)\2/g))o[m[1].toLowerCase()]=m[3];return o}
function isRedirect(h){return /<meta[^>]+http-equiv=["']refresh["']/i.test(h)||(/location\.(?:replace|href)\s*=/i.test(h)&&!/<main\b/i.test(h))}
function get(h,key){for(const m of h.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(m[0]);if(a.name?.toLowerCase()===key||a.property?.toLowerCase()===key)return a.content||''}return''}
function walk(d,b=''){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const rel=path.posix.join(b,e.name),abs=path.join(d,e.name);if(e.isDirectory())walk(abs,rel);else if(e.isFile()&&e.name.endsWith('.html'))inspect(rel,abs)}}
function truncated(v){return /(?:…|\.\.\.)\s*$/.test(v)}
function normalized(v){return v.replace(/&[a-z0-9#]+;/gi,' ').replace(/[^\p{L}\p{N}]+/gu,' ').trim().toLowerCase()}
function inspect(rel,abs){
  const h=fs.readFileSync(abs,'utf8');if(isRedirect(h))return;
  const main=h.match(/<main\b[\s\S]*?<\/main>/i)?.[0]||'';
  if(main.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().length<160)return;
  const d=get(h,'description'),og=get(h,'og:description'),tw=get(h,'twitter:description');
  if(!d)failures.push(`${rel}: meta description missing`);
  if(!og)failures.push(`${rel}: og:description missing`);
  if(!tw)failures.push(`${rel}: twitter:description missing`);
  if(d&&truncated(d))failures.push(`${rel}: artificially truncated meta description: ${d}`);
  if(og&&truncated(og))failures.push(`${rel}: artificially truncated og:description`);
  if(tw&&truncated(tw))failures.push(`${rel}: artificially truncated twitter:description`);
  if(og&&tw&&og!==tw)failures.push(`${rel}: OG/Twitter social description drift`);
  // Google does not publish a fixed character limit for meta descriptions. The
  // quality contract therefore checks usefulness, uniqueness and truncation
  // instead of pretending that an arbitrary character count is a Google rule.
  if(d){
    const n=normalized(d);
    if(n.split(/\s+/).filter(Boolean).length<8)failures.push(`${rel}: meta description is too thin to be a useful page summary`);
    const previous=seenDescriptions.get(n);if(previous)failures.push(`${rel}: duplicate meta description also used by ${previous}`);else seenDescriptions.set(n,rel);
  }
}
walk('.');
if(failures.length){console.error('BANHALMI metadata quality audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('BANHALMI metadata quality audit passed across all real content pages: complete, unique, non-truncated descriptions without artificial Google character limits.');
