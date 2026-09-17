import fs from 'node:fs';

const file = 'assets/css/site.css';
const marker = '/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
const css = fs.readFileSync(file, 'utf8');
const first = css.indexOf(marker);
if (first < 0) throw new Error('Responsive contract END marker not found');
if (css.indexOf(marker, first + marker.length) >= 0) throw new Error('Duplicate responsive contract END marker');
const without = css.slice(0, first) + css.slice(first + marker.length);
const normalized = without.replace(/\s+$/u, '');
const next = `${normalized}\n\n${marker}\n`;
if (next === css) throw new Error('Responsive contract END marker is already final');
fs.writeFileSync(file, next);
console.log('Moved APPLE-RESPONSIVE-CONTRACT-V1:END to the final meaningful position without changing CSS rules.');
