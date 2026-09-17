import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const robots = fs.readFileSync(path.join(root,'robots.txt'),'utf8');
if (!/User-agent:\s*\*/i.test(robots) || !/Allow:\s*\//i.test(robots)) errors.push('robots.txt must allow the canonical professional site');
const walk = (dir) => fs.readdirSync(dir,{withFileTypes:true}).flatMap((e)=>{ if(['.git','node_modules'].includes(e.name)) return []; const full=path.join(dir,e.name); return e.isDirectory()?walk(full):[full]; });
for (const file of walk(root).filter((p)=>p.endsWith('.html'))) {
  const rel = path.relative(root,file);
  const html = fs.readFileSync(file,'utf8');
  if (rel !== '404.html' && /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) errors.push(rel+': live or redirect document must not carry noindex');
}
const legacy = {
  'en/work/index.html':'https://www.banhalmi.art/',
  'about/norbert-banhalmi/index.html':'https://www.norbertbanhalmi.com/about/',
  'hu/rolam/banhalmi-norbert/index.html':'https://www.norbertbanhalmi.com/about/',
  'de/ueber-mich/norbert-banhalmi/index.html':'https://www.norbertbanhalmi.com/about/',
  'press/index.html':'https://www.banhalmi.art/press.html',
  'old-print/index.html':'https://www.banhalmi.art/press.html',
  'hu/sajto/megjelenesek/index.html':'https://www.banhalmi.art/hu/press.html',
  'hu/sajto/nyomtatott/index.html':'https://www.banhalmi.art/hu/press.html',
  'de/presse/presseauftritte/index.html':'https://www.banhalmi.art/de-at/press.html',
  'de/presse/print/index.html':'https://www.banhalmi.art/de-at/press.html'
};
for (const [relative,target] of Object.entries(legacy)) {
  const full=path.join(root,relative);
  if (!fs.existsSync(full)) { errors.push(relative+': legacy redirect bridge missing'); continue; }
  const html=fs.readFileSync(full,'utf8');
  for (const token of [target,'window.location.replace','http-equiv="refresh"']) if (!html.includes(token)) errors.push(relative+': redirect does not resolve directly to '+target+' / missing '+token);
}
for (const relative of ['privacy-policy/index.html','hu/adatvedelem/index.html','de-at/datenschutz/index.html']) {
  const html=fs.readFileSync(path.join(root,relative),'utf8');
  for (const token of ['www.norbertbanhalmi.com','www.banhalmi.art','blog.banhalmi.art','Google Analytics 4','Elfsight','data-privacy-domain-scope']) if (!html.includes(token)) errors.push(relative+': privacy scope/processors missing '+token);
}
if (errors.length) { console.error('SEO / GDPR / INDEXING STAGE 53 FAILED'); errors.forEach((e)=>console.error('-',e)); process.exit(1);}
console.log('SEO/GDPR/indexing Stage 53 passed: every live BANHALMI page is indexable, robots allow crawling, legacy aliases resolve directly to current equivalents, and cross-domain processor scope is consistent.');
