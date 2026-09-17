import fs from 'node:fs';
import path from 'node:path';

const redirects = {
  'en/work': 'https://www.banhalmi.art/',
  'about/norbert-banhalmi': 'https://www.norbertbanhalmi.com/about/',
  'hu/rolam/banhalmi-norbert': 'https://www.norbertbanhalmi.com/about/',
  'de/ueber-mich/norbert-banhalmi': 'https://www.norbertbanhalmi.com/about/',
  press: 'https://www.banhalmi.art/press.html',
  'old-print': 'https://www.banhalmi.art/press.html',
  'hu/sajto/megjelenesek': 'https://www.banhalmi.art/hu/press.html',
  'hu/sajto/nyomtatott': 'https://www.banhalmi.art/hu/press.html',
  'de/presse/presseauftritte': 'https://www.banhalmi.art/de-at/press.html',
  'de/presse/print': 'https://www.banhalmi.art/de-at/press.html'
};

const canonicalOeuvrePages = ['hu/eletmu/index.html', 'de-at/werk/index.html'];
const errors = [];
for (const [route, target] of Object.entries(redirects)) {
  const file = path.join(route, 'index.html');
  if (!fs.existsSync(file)) { errors.push(`missing ${file}`); continue; }
  const html = fs.readFileSync(file, 'utf8');
  if (/noindex/i.test(html)) errors.push(`${file}: redirect alias must not carry noindex`);
  for (const required of [`href="${target}"`, `content="0;url=${target}"`, 'window.location.replace', '/assets/css/accessibility-stage14.css']) {
    if (!html.includes(required)) errors.push(`${file}: missing ${required}`);
  }
}
for (const file of canonicalOeuvrePages) {
  const html = fs.readFileSync(file, 'utf8');
  if (/noindex,follow|http-equiv="refresh"|window\.location\.replace/i.test(html)) errors.push(`${file}: canonical oeuvre page must remain a full page, not a redirect`);
}
for (const file of ['index.html', 'hu/index.html', 'de-at/index.html']) {
  if (fs.readFileSync(file, 'utf8').includes('· ·')) errors.push(`${file}: duplicated footer separator`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Static redirect, accessibility, canonical oeuvre and footer audit passed (${Object.keys(redirects).length} aliases).`);
