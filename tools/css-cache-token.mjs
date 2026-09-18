import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SKIP_DIRS = new Set(['.git', 'node_modules', '.github', 'artifacts', '_site']);

export function expectedSiteCssToken(cssPath = 'assets/css/site.css') {
  const css = fs.readFileSync(cssPath);
  return `design-${createHash('sha256').update(css).digest('hex').slice(0, 16)}`;
}

export function htmlFiles(root = '.') {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
    }
  }
  walk(root);
  return files.sort();
}

export function siteCssReferences(html) {
  return [...html.matchAll(/\/assets\/css\/site\.css\?v=([^"'\s>]+)/g)];
}

export function synchronizeSiteCssToken(html, expected) {
  return html.replace(
    /\/assets\/css\/site\.css\?v=[^"'\s>]+/g,
    `/assets/css/site.css?v=${expected}`,
  );
}
