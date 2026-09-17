import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const skip=new Set(['.git','node_modules','.github']);
let refs=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html')){const html=fs.readFileSync(p,'utf8');for(const m of html.matchAll(/<img\b[^>]*src=[\"'][^\"']*wko-wien-profile-transparent\.png[^\"']*[\"'][^>]*>/gi)){refs++;const tag=m[0];const rel=path.relative(root,p).replaceAll('\\','/');if(!/loading=[\"']lazy[\"']/i.test(tag))failures.push(rel+': WKO footer image must be lazy-loaded');if(!/fetchpriority=[\"']low[\"']/i.test(tag))failures.push(rel+': WKO footer image must use low fetch priority');}}}}
walk(root);
if(!refs)failures.push('No WKO footer image references found');
if(failures.length){for(const f of failures)console.error('FAIL '+f);process.exit(1)}
console.log('Stage 58 footer image loading audit passed for '+refs+' WKO image references: all are lazy and low priority.');
