import fs from 'node:fs';
import path from 'node:path';

const cssPath = 'assets/css/accessibility-stage14.css';
const css = fs.readFileSync(cssPath, 'utf8');
const required = [
  '@media (max-width:680px) and (hover:none) and (pointer:coarse)',
  '.nav-links a[aria-current="page"]',
  '.nav-links a.active',
  '.nav-links .active>a',
  'color:#8A681F!important',
  'background:transparent!important',
  'border:0!important',
  'box-shadow:none!important',
  'outline:0!important',
  'border-radius:0!important'
];

const errors = [];
for (const token of required) {
  if (!css.includes(token)) errors.push(`${cssPath}: missing ${token}`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', 'node_modules', '_site'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const file of walk('.').filter((file) => file.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  if (/·\s*·/.test(html)) errors.push(`${file}: duplicated footer separator`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Stage 29 mobile menu and footer regression audit passed with AA-safe active navigation text.');
