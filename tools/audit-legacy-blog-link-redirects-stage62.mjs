import fs from 'node:fs';
import path from 'node:path';

const routes = {
  'oneletrajz-cv-fotozas': 'https://www.norbertbanhalmi.com/hu/portre/',
  'portfolio-fotozas': 'https://www.norbertbanhalmi.com/hu/portre/',
  'muveszi-aktfotozas': 'https://www.norbertbanhalmi.com/hu/muveszi-fotografia/',
  'reklam-fotozas': 'https://www.norbertbanhalmi.com/hu/brand/',
  'post/amikor-csak-egy-táncpartnered-van-egész-estére': 'https://blog.banhalmi.art/post/amikor-csak-egy-táncpartnered-van-egész-estére',
  'blog/tags/filter-nélkül-a-testem-története': 'https://blog.banhalmi.art/blog'
};
const errors = [];
for (const [route, target] of Object.entries(routes)) {
  const file = path.join(route, 'index.html');
  if (!fs.existsSync(file)) { errors.push(`${route}: redirect page missing`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (/noindex/i.test(html)) errors.push(`${route}: noindex must not be used on consolidation redirect`);
  if (!html.includes(`rel="canonical" href="${target}"`)) errors.push(`${route}: canonical target mismatch`);
  if (!html.includes(target)) errors.push(`${route}: target missing from redirect page`);
  if (!html.includes('window.location.replace')) errors.push(`${route}: JS forwarding missing`);
  if (!/http-equiv="refresh"/i.test(html)) errors.push(`${route}: meta refresh missing`);
}
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const edge = new Map((vercel.redirects || []).map(rule => [rule.source, rule]));
for (const [route, target] of Object.entries(routes)) {
  const source = `/${route}`;
  const expected = target.startsWith('https://www.norbertbanhalmi.com') ? new URL(target).pathname : target;
  const rule = edge.get(source);
  if (!rule || rule.destination !== expected || rule.permanent !== true) errors.push(`${source}: permanent Vercel redirect mismatch`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Stage62 legacy blog-link redirect audit passed: ${Object.keys(routes).length} broken historical BANHALMI URLs consolidate to current canonical destinations.`);
