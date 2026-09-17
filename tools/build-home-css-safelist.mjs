import fs from 'node:fs';

const cssPath = process.argv[2];
const outPath = process.argv[3];
if (!cssPath || !outPath) throw new Error('Usage: node tools/build-home-css-safelist.mjs <css> <output-html>');

const css = fs.readFileSync(cssPath, 'utf8');
const exact = new Set(['active','open','in','hidden','loaded','ready','show','is-visible','is-open']);
const prefixes = ['site-','nav-','menu-','mega-','lang-','hero-','btn','reveal','cookie-','consent-','reviews-','lightbox','info-','bn-','title-accent','surface-','fp-','footer-'];
const classRe = /\.(-?[_a-zA-Z]+[_a-zA-Z0-9-]*)/g;
for (const match of css.matchAll(classRe)) {
  const name = match[1];
  if (prefixes.some((prefix) => name.startsWith(prefix))) exact.add(name);
}
const classes = [...exact].sort();
fs.writeFileSync(outPath, `<!doctype html><html><body><div class="${classes.join(' ')}"></div></body></html>\n`);
console.log(`Homepage CSS safelist generated with ${classes.length} classes.`);
