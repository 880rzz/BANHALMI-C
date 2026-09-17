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
const css = fs.readFileSync('assets/css/site.css', 'utf8');
for (const selector of [
  '.footer-contact-list .footer-studio',
  '.footer-contact-list .footer-whatsapp',
  '.footer-contact-actions',
  '.footer-heading,\nhtml body .site-footer .footer-studio-link'
]) {
  if (!css.includes(selector)) errors.push(`canonical executive footer selector missing: ${selector}`);
}
if (!css.includes('color:#F5F5F7!important;font-weight:650!important')) {
  errors.push('executive footer contact hierarchy is not explicitly white and weighted');
}
if (!css.includes('min-height:44px!important;padding-right:24px!important')) {
  errors.push('touch footer accordion target contract missing');
}
for (const token of [
  'minmax(280px,1.15fr) minmax(225px,1fr) minmax(140px,.68fr) minmax(135px,.68fr) minmax(150px,.72fr) minmax(270px,1.2fr)',
  'white-space:nowrap!important',
  'content:"•"!important',
  '.footer-contact-actions a:first-child{color:#F5F5F7!important;font-weight:650!important;}',
  '@media(max-width:1460px)'
]) {
  if (!css.includes(token)) errors.push(`footer navigation hierarchy contract missing: ${token}`);
}

let footers = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  if (!html.includes('class="footer-contact-list"')) continue;
  footers += 1;
  for (const token of ['class="footer-studio"', 'class="footer-address"', 'class="footer-whatsapp"', 'https://wa.me/4367761655592', 'class="footer-contact-actions"']) {
    if (!html.includes(token)) errors.push(`${page}: missing executive footer contract ${token}`);
  }
  const studioCount = (html.match(/class="footer-studio"/g) || []).length;
  if (studioCount !== 2) errors.push(`${page}: expected exactly two clearly separated studio blocks, found ${studioCount}`);
}
if (footers < 50) errors.push(`expected at least 50 canonical footers, found ${footers}`);
if (errors.length) {
  console.error(`Executive footer contract failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Executive footer contract passed: ${footers} footers expose separated studios, direct WhatsApp and compact accessible navigation.`);
