import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const sitemapPath = 'sitemap.xml';
const origin = 'https://www.norbertbanhalmi.com';
let xml = fs.readFileSync(sitemapPath, 'utf8');
let changed = 0;
let checked = 0;

function sourcePathFor(urlString) {
  const url = new URL(urlString);
  if (url.origin !== origin) return null;
  const pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') return 'index.html';
  const clean = pathname.replace(/^\//, '');
  if (clean.endsWith('/')) return `${clean}index.html`;
  return clean;
}

function gitDate(path) {
  if (!fs.existsSync(path)) return null;
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', path], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

xml = xml.replace(/<url>\s*([\s\S]*?)\s*<\/url>/g, (whole, body) => {
  const locMatch = body.match(/<loc>([^<]+)<\/loc>/);
  if (!locMatch) return whole;
  const path = sourcePathFor(locMatch[1]);
  if (!path) return whole;
  const date = gitDate(path);
  if (!date) return whole;
  checked++;
  let nextBody = body;
  const lastmod = body.match(/<lastmod>([^<]+)<\/lastmod>/);
  if (lastmod) {
    if (lastmod[1] !== date) {
      nextBody = body.replace(/<lastmod>[^<]+<\/lastmod>/, `<lastmod>${date}</lastmod>`);
      changed++;
    }
  } else {
    nextBody = `${body}\n    <lastmod>${date}</lastmod>`;
    changed++;
  }
  return `<url>\n${nextBody.trim()}\n  </url>`;
});

if (process.argv.includes('--check')) {
  const current = fs.readFileSync(sitemapPath, 'utf8');
  if (xml !== current) {
    console.error(`sitemap.xml is stale for ${changed} URL(s); run node tools/sync-sitemap-lastmod.mjs with full git history.`);
    process.exit(1);
  }
  console.log(`Sitemap freshness check passed for ${checked} source-backed URL(s).`);
} else {
  fs.writeFileSync(sitemapPath, xml.endsWith('\n') ? xml : `${xml}\n`);
  console.log(`Sitemap freshness sync checked ${checked} URL(s) and updated ${changed}.`);
}
