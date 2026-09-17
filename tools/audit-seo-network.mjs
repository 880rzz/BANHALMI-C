import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const assert = (ok, message) => { if (!ok) failures.push(message); };

function localPathForUrl(url) {
  const parsed = new URL(url);
  let pathname = decodeURIComponent(parsed.pathname);
  if (pathname === '/') return 'index.html';
  pathname = pathname.replace(/^\//, '');
  if (pathname.endsWith('/')) return `${pathname}index.html`;
  return path.extname(pathname) ? pathname : `${pathname}/index.html`;
}

function extract(html, pattern) {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

function parseAttributes(tag) {
  const attrs = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) attrs[match[1].toLowerCase()] = match[2];
  return attrs;
}

for (const required of ['robots.txt', 'sitemap.xml', 'llms.txt', 'knowledge.json', 'services.json', 'partners.json']) {
  assert(exists(required), `missing required machine-readable file: ${required}`);
}
for (const jsonFile of ['knowledge.json', 'services.json', 'partners.json']) {
  if (!exists(jsonFile)) continue;
  try { JSON.parse(read(jsonFile)); }
  catch (error) { failures.push(`${jsonFile}: invalid JSON (${error.message})`); }
}

const robots = exists('robots.txt') ? read('robots.txt') : '';
assert(/User-agent:\s*\*/i.test(robots), 'robots.txt: missing wildcard user agent');
assert(/Allow:\s*\//i.test(robots), 'robots.txt: site is not explicitly crawlable');
assert(robots.includes('Sitemap: https://www.norbertbanhalmi.com/sitemap.xml'), 'robots.txt: canonical sitemap declaration missing');

const sitemap = exists('sitemap.xml') ? read('sitemap.xml') : '';
const sitemapUrls = extract(sitemap, /<loc>(https:\/\/www\.norbertbanhalmi\.com\/[^<]*)<\/loc>/g)
  .filter((url) => !/\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(url));
assert(sitemapUrls.length > 0, 'sitemap.xml: no page URLs found');
assert(new Set(sitemapUrls).size === sitemapUrls.length, 'sitemap.xml: duplicate page URL');

const htmlFiles = [];
function walk(dir = '.') {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    if (['.git', 'node_modules', 'playwright-report', 'test-results'].includes(entry.name)) continue;
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel);
    else if (entry.name.endsWith('.html')) htmlFiles.push(rel.replaceAll('\\', '/').replace(/^\.\//, ''));
  }
}
walk();

const externalUrls = new Set();
for (const url of sitemapUrls) {
  const file = localPathForUrl(url);
  assert(exists(file), `sitemap URL has no local HTML file: ${url} -> ${file}`);
  if (!exists(file)) continue;
  const html = read(file);
  const linkTags = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => parseAttributes(m[0]));
  const canonical = linkTags.find((attrs) => (attrs.rel || '').toLowerCase().split(/\s+/).includes('canonical'))?.href;
  assert(canonical === url, `${file}: canonical mismatch (${canonical || 'missing'} != ${url})`);
  const alternates = linkTags
    .filter((attrs) => attrs.hreflang && attrs.href && (attrs.rel || '').toLowerCase().split(/\s+/).includes('alternate'))
    .map((attrs) => ({ lang: attrs.hreflang, href: attrs.href }));
  assert(alternates.some((item) => item.lang.toLowerCase() === 'x-default'), `${file}: missing x-default hreflang`);
  const duplicateLangs = alternates.map((item) => item.lang.toLowerCase()).filter((lang, i, all) => all.indexOf(lang) !== i);
  assert(!duplicateLangs.length, `${file}: duplicate hreflang values ${[...new Set(duplicateLangs)].join(', ')}`);
}

for (const file of htmlFiles) {
  const html = read(file);
  for (const match of html.matchAll(/\b(?:href|src)=["'](https?:\/\/[^"'#\s]+(?:#[^"']*)?)["']/gi)) {
    const url = match[1].replace(/&amp;/g, '&');
    if (/^https:\/\/www\.norbertbanhalmi\.com\//.test(url)) continue;
    externalUrls.add(url);
  }
}

const criticalLiveUrls = [
  'https://www.norbertbanhalmi.com/',
  'https://www.norbertbanhalmi.com/robots.txt',
  'https://www.norbertbanhalmi.com/sitemap.xml',
  'https://www.norbertbanhalmi.com/llms.txt',
  'https://www.norbertbanhalmi.com/knowledge.json',
  'https://www.norbertbanhalmi.com/ecosystem.json',
  'https://www.banhalmi.art/',
  'https://www.banhalmi.art/llms.txt',
  'https://www.banhalmi.art/knowledge-graph.jsonld',
  'https://www.banhalmi.art/ecosystem-bridge.json',
  'https://www.banhalmi.art/ecosystem-bridge.jsonld',
  'https://blog.banhalmi.art/',
  'https://blog.banhalmi.art/blog-posts-sitemap.xml',
  'https://blog.banhalmi.art/blog-categories-sitemap.xml'
];
const criticalLiveUrlSet = new Set(criticalLiveUrls);

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers: { 'user-agent': 'BANHALMI-LinkAudit/1.0' } });
    if ([400, 405].includes(response.status)) {
      response = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller.signal, headers: { 'user-agent': 'BANHALMI-LinkAudit/1.0', range: 'bytes=0-1024' } });
    }
    const reachable = response.status < 400 || [401, 403, 429, 999].includes(response.status);
    return { url, status: response.status, reachable, finalUrl: response.url };
  } catch (error) {
    return { url, status: 0, reachable: false, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

async function runNetworkAudit() {
  const urls = [...new Set([...criticalLiveUrls, ...externalUrls])];
  const queue = [...urls];
  const results = [];
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) results.push(await checkUrl(queue.shift()));
  });
  await Promise.all(workers);
  results.sort((a, b) => a.url.localeCompare(b.url));
  fs.writeFileSync('link-audit-results.json', JSON.stringify({ generatedAt: new Date().toISOString(), checked: results.length, results }, null, 2) + '\n');
  for (const result of results) {
    if (!result.reachable && criticalLiveUrlSet.has(result.url)) failures.push(`unreachable critical URL: ${result.url} (${result.status || result.error})`);
    else if (!result.reachable) warnings.push(`third-party URL could not be verified: ${result.url} (${result.status || result.error})`);
    else if (result.status >= 300) warnings.push(`external URL returned ${result.status}: ${result.url}`);
  }
  console.log(`Checked ${results.length} live and external URLs.`);
}

if (process.env.LIVE_AUDIT === '1') await runNetworkAudit();
else console.log(`Static SEO audit collected ${externalUrls.size} unique external URLs; set LIVE_AUDIT=1 to check them.`);

for (const warning of warnings) console.warn(`WARN ${warning}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Validated ${sitemapUrls.length} sitemap pages and ${htmlFiles.length} HTML files.`);
if (failures.length) process.exitCode = 1;
