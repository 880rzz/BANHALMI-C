import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const skip=new Set(['.git','node_modules','.github']);
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.html'))files.push(p)}}
walk(root);
let audited=0;
for(const file of files){const html=fs.readFileSync(file,'utf8');if(!/<html\b/i.test(html)||!/<\/head\s*>/i.test(html))continue;const rel=path.relative(root,file).replaceAll('\\','/');const matches=[...html.matchAll(/<link\b[^>]*href=[\"']\/assets\/css\/accessibility-stage14\.css(?:\?[^\"']*)?[\"'][^>]*>/gi)];if(!matches.length)continue;audited++;if(matches.length!==1)failures.push(rel+': accessibility stylesheet must occur exactly once');const a11yIndex=matches[0].index;const schema=/<script\b[^>]*type=[\"']application\/ld\+json[\"'][^>]*>/i.exec(html);if(schema&&a11yIndex>schema.index)failures.push(rel+': accessibility CSS is discovered after JSON-LD instead of before it');if(['index.html','hu/index.html','de-at/index.html'].includes(rel)){const style=/<link\b[^>]*href=[\"']\/assets\/css\/style\.css(?:\?[^\"']*)?[\"'][^>]*>/i.exec(html);if(!style)failures.push(rel+': primary stylesheet missing');else if(a11yIndex<style.index)failures.push(rel+': accessibility stylesheet should follow primary style.css');if(/<script\b[^>]*src=[\"']https:\/\/cdn\.trustindex\.io\//i.test(html))failures.push(rel+': Trustindex must remain interaction-gated, not static');}}
if(failures.length){for(const f of failures)console.error('FAIL '+f);process.exit(1)}
console.log('Stage 57 CSS discovery audit passed for '+audited+' HTML pages: accessibility CSS is unique and discovered before JSON-LD.');
