import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const requiredAssets = [
  'assets/img/brand/favicon.ico',
  'assets/img/brand/apple-touch-icon.png',
  'assets/img/brand/android-chrome-192x192.png',
  'assets/img/brand/android-chrome-512x512.png',
  'site.webmanifest'
];

for (const asset of requiredAssets) {
  if (!fs.existsSync(path.join(root, asset))) failures.push(`${asset}: missing`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['.git', 'node_modules', '_site'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const contentPages = walk(root).filter(file => {
  if (!file.endsWith('.html')) return false;
  const html = fs.readFileSync(file, 'utf8');
  return /<html\b/i.test(html) && !/http-equiv=["']refresh["']/i.test(html);
});

for (const file of contentPages) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  for (const [label, pattern] of [
    ['ICO favicon', /<link\b(?=[^>]*rel=["'](?:shortcut )?icon["'])(?=[^>]*href=["']\/assets\/img\/brand\/favicon\.ico["'])[^>]*>/i],
    ['Apple touch icon', /<link\b(?=[^>]*rel=["']apple-touch-icon["'])(?=[^>]*href=["']\/assets\/img\/brand\/apple-touch-icon\.png["'])[^>]*>/i],
    ['web manifest', /<link\b(?=[^>]*rel=["']manifest["'])(?=[^>]*href=["']\/site\.webmanifest["'])[^>]*>/i]
  ]) if (!pattern.test(html)) failures.push(`${rel}: ${label} link missing`);
}

if (fs.existsSync(path.join(root, 'site.webmanifest'))) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'site.webmanifest'), 'utf8'));
  const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
  for (const expected of [
    ['/assets/img/brand/android-chrome-192x192.png', '192x192'],
    ['/assets/img/brand/android-chrome-512x512.png', '512x512']
  ]) if (!icons.some(icon => icon.src === expected[0] && icon.sizes === expected[1] && icon.type === 'image/png')) {
    failures.push(`site.webmanifest: ${expected[1]} PNG icon missing`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`BANHALMI favicon contract passed: five local assets and complete icon metadata on ${contentPages.length} content pages.`);
