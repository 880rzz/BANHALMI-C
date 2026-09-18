import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const routes = ['privacy-policy/index.html', 'hu/adatvedelem/index.html', 'de-at/datenschutz/index.html'];
const required = [
  'www.norbertbanhalmi.com',
  'www.banhalmi.art',
  'blog.banhalmi.art',
  'G-90C452LJKQ',
  'G-PKLH4H5YKD',
  'G-EY91Q4QSVF'
];
const obsoleteSharedClaims = [
  /same GA4 property/i,
  /shared GA4 property/i,
  /ugyanazt a GA4/i,
  /gemeinsame GA4-Property/i
];
const failures = [];

for (const route of routes) {
  const html = await readFile(path.join(root, route), 'utf8');
  for (const token of required) {
    if (!html.includes(token)) failures.push(`${route}: missing ecosystem privacy token ${token}`);
  }
  for (const pattern of obsoleteSharedClaims) {
    if (pattern.test(html)) failures.push(`${route}: obsolete shared analytics claim matches ${pattern}`);
  }
  if (!html.includes('data-cross-site-privacy="true"')) failures.push(`${route}: ecosystem privacy section missing`);
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log('BANHALMI ecosystem privacy contract passed: professional, ART and blog analytics scopes are explicitly separated.');
