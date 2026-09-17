import fs from 'node:fs';

const xml=fs.readFileSync('sitemap.xml','utf8');
const entries=[...xml.matchAll(/<url>\s*([\s\S]*?)\s*<\/url>/g)].map(m=>m[1]);
const seen=new Set();
const errors=[];
const dates=new Map();
const today=new Date().toISOString().slice(0,10);

for(const entry of entries){
  const loc=entry.match(/<loc>([^<]+)<\/loc>/)?.[1];
  const lastmod=entry.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  if(!loc){ errors.push('sitemap entry missing <loc>'); continue; }
  if(seen.has(loc)) errors.push(`duplicate sitemap URL: ${loc}`);
  seen.add(loc);
  if(!lastmod) errors.push(`${loc}: missing <lastmod>`);
  else if(!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) errors.push(`${loc}: invalid lastmod ${lastmod}`);
  else if(lastmod>today) errors.push(`${loc}: future lastmod ${lastmod}`);
  else dates.set(loc,lastmod);
}

const releaseFloor='2026-08-07';
for(const loc of [
  'https://www.norbertbanhalmi.com/',
  'https://www.norbertbanhalmi.com/hu/',
  'https://www.norbertbanhalmi.com/de-at/',
  'https://www.norbertbanhalmi.com/trust/',
  'https://www.norbertbanhalmi.com/hu/bizalom/',
  'https://www.norbertbanhalmi.com/de-at/vertrauen/'
]){
  const date=dates.get(loc);
  if(!date) errors.push(`${loc}: key route missing from sitemap`);
  else if(date<releaseFloor) errors.push(`${loc}: stale lastmod ${date}; expected >= ${releaseFloor}`);
}

if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`Stage 35 sitemap freshness audit passed: ${entries.length} unique URLs, valid lastmod dates, current key routes.`);
