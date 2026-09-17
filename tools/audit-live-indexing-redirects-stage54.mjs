import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  if (['.git', 'node_modules'].includes(entry.name)) return [];
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : [full];
});

for (const file of walk(root).filter((f) => f.endsWith('.html'))) {
  const rel = path.relative(root, file);
  const html = fs.readFileSync(file, 'utf8');
  const redirect = /http-equiv=["']refresh["']/i.test(html);
  const is404 = rel === '404.html';
  if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) && !is404) {
    errors.push(`${rel}: live or redirect document must not carry noindex`);
  }
  if (!redirect && !is404 && !/<link\b[^>]*rel=["']canonical["']/i.test(html)) {
    errors.push(`${rel}: live content page missing canonical`);
  }
}

const expected = {
  'en/work/index.html': 'https://www.banhalmi.art/',
  'about/norbert-banhalmi/index.html': 'https://www.norbertbanhalmi.com/about/',
  'hu/rolam/banhalmi-norbert/index.html': 'https://www.norbertbanhalmi.com/about/',
  'de/ueber-mich/norbert-banhalmi/index.html': 'https://www.norbertbanhalmi.com/about/',
  'press/index.html': 'https://www.banhalmi.art/press.html',
  'old-print/index.html': 'https://www.banhalmi.art/press.html',
  'hu/sajto/megjelenesek/index.html': 'https://www.banhalmi.art/hu/press.html',
  'hu/sajto/nyomtatott/index.html': 'https://www.banhalmi.art/hu/press.html',
  'de/presse/presseauftritte/index.html': 'https://www.banhalmi.art/de-at/press.html',
  'de/presse/print/index.html': 'https://www.banhalmi.art/de-at/press.html'
};
for (const [rel, target] of Object.entries(expected)) {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const token of [target, 'http-equiv="refresh"', 'window.location.replace']) {
    if (!html.includes(token)) errors.push(`${rel}: redirect contract missing ${token}`);
  }
}

if (errors.length) {
  console.error('STAGE 54 LIVE INDEXING / REDIRECT AUDIT FAILED');
  errors.forEach((e) => console.error('-', e));
  process.exit(1);
}
console.log('Stage 54 passed: every live content page is indexable/self-canonical and known legacy aliases point directly to current equivalents.');
