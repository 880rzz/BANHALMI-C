import fs from 'node:fs';
import path from 'node:path';

const skip = new Set(['.git', '.github', 'node_modules', 'artifacts']);
const pages = [];
function walk(dir = '.') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) pages.push(full);
  }
}
walk();

const errors = [];
const site = fs.readFileSync('assets/css/site.css', 'utf8');
const fluid = fs.readFileSync('assets/css/fluid-4k-rhythm.css', 'utf8');
for (const selector of ['.footer-contact-list .footer-location','.footer-contact-actions','.footer-location-link']) {
  if (!site.includes(selector)) errors.push(`canonical executive footer selector missing: ${selector}`);
}
if (!fluid.includes('FOOTER-THREE-LOCATION-V36-20260923')) errors.push('three-location canonical footer authority missing');
if (!fluid.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important')) errors.push('desktop three-location grid missing');
if (!fluid.includes('grid-column:1 / span 6!important') || !fluid.includes('grid-column:1 / span 4!important')) errors.push('desktop contact span contracts missing');

let footers = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  if (!html.includes('class="footer-contact-list"')) continue;
  footers += 1;
  for (const token of ['data-location-role="studio"','data-location-role="office"','Schwedenplatz 2, Top 8–9, 1010 Wien','Gersthofer Straße 150–154/6/2, 1180 Wien','Lágymányosi u. 15, 1111 Budapest','https://g.page/r/CdO4Kej3jIkfEBM','https://wa.me/4367761655592','class="footer-contact-actions"']) {
    if (!html.includes(token)) errors.push(`${page}: missing executive footer contract ${token}`);
  }
  const locationCount=(html.match(/class="footer-location /g)||[]).length;
  const studioCount=(html.match(/data-location-role="studio"/g)||[]).length;
  const officeCount=(html.match(/data-location-role="office"/g)||[]).length;
  if(locationCount!==3||studioCount!==2||officeCount!==1) errors.push(`${page}: expected 3 locations (2 studios + 1 office), found ${locationCount}/${studioCount}/${officeCount}`);
}
if (footers < 50) errors.push(`expected at least 50 canonical footers, found ${footers}`);
if (errors.length) { console.error(`Executive footer contract failed:\n- ${errors.join('\n- ')}`); process.exit(1); }
console.log(`Executive footer contract passed: ${footers} footers expose 3 physical business locations (2 studios + 1 Vienna office) with overflow-safe canonical geometry.`);
