import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const fail = [];
const rel = p => path.relative(root, p).replaceAll('\\', '/');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() && !['.git', 'node_modules'].includes(e.name)
    ? walk(path.join(d, e.name))
    : [path.join(d, e.name)]
);

const files = walk(root);
const css = files.filter(f => f.endsWith('.css'));
const cssRel = css.map(rel).sort();
const approvedCss = ['assets/css/fluid-4k-rhythm.css', 'assets/css/mega-menu-harmony-v31.css', 'assets/css/site.css', 'assets/css/typography-integrity-v33.css'];
if (cssRel.length !== approvedCss.length || cssRel.some((p, i) => p !== approvedCss[i])) {
  fail.push(`expected canonical site.css plus approved fluid rhythm stylesheet, found ${css.length}: ${cssRel.join(', ')}`);
}

for (const f of files.filter(f => f.endsWith('.html'))) {
  const h = fs.readFileSync(f, 'utf8');
  const local = [...h.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](?!https?:|\/\/)([^"']+)/gi)];
  const siteSheets = local.filter(x => x[1].includes('/assets/css/site.css'));
  const rhythmSheets = local.filter(x => x[1].includes('/assets/css/fluid-4k-rhythm.css'));
  const directCriticalSheet = siteSheets.length === 1 && /<link rel="stylesheet" href="\/assets\/css\/site\.css[^>]*\/>/.test(h);
  const deferredSheet = siteSheets.length === 2 && /media="print"[\s\S]*?<noscript><link rel="stylesheet" href="\/assets\/css\/site\.css/i.test(h);
  if (rhythmSheets.length !== 1 || (!directCriticalSheet && !deferredSheet)) {
    fail.push(`${rel(f)}: canonical stylesheet + no-JS fallback + fluid geometry contract missing`);
  }
  if (/<style\b/i.test(h)) fail.push(`${rel(f)}: inline <style> survived`);
  if (/\sstyle=["']/i.test(h)) fail.push(`${rel(f)}: inline style attribute survived`);
}

const siteCss = read('assets/css/site.css');
if (!/\.smart-quote-layout \.quote-summary-card\{[^}]*box-shadow:none!important/i.test(siteCss)) {
  fail.push('quote summary no-shadow authority missing');
}
if (exists('assets/css/fluid-4k-rhythm.css')) {
  const rhythm = read('assets/css/fluid-4k-rhythm.css');
  for (const token of ['FLUID-4K-RHYTHM-20260914:START','--apple-page-max:1440px','--apple-page-max:1600px','--apple-page-max:1760px','--prose-max:860px']) {
    if (!rhythm.includes(token)) fail.push(`fluid rhythm contract missing: ${token}`);
  }
}

const required = [
  'llms.txt', 'ai.txt', 'robots.txt', 'sitemap.xml',
  '.well-known/agent.json',
  'api/v1/identity.json', 'api/v1/services.json', 'api/v1/locations.json', 'api/v1/actions.json',
  'entity.jsonld', 'vercel.json',
  'assets/js/site-config.js', 'assets/js/main.js',
  'requestaquote/index.html', 'hu/ajanlatkeres/index.html', 'de-at/anfrage/index.html',
  'contact/index.html', 'hu/kapcsolat/index.html', 'de-at/kontakt/index.html',
  'redirects/at/middleware.js', 'redirects/hu/middleware.js'
];
for (const p of required) if (!exists(p)) fail.push(`${p}: missing`);

if (exists('assets/js/site-config.js')) {
  const runtime = read('assets/js/site-config.js');
  const runtimeContracts = [
    ['Cloudflare form gateway', 'https://banhalmi-form-gateway.6ymnrwgnv9.workers.dev/api/banhalmi-form'],
    ['POST form submission', "method:'POST'"],
    ['Worker routing language payload', 'data.language = languageOf(form)'],
    ['Apps Script / analytics language mirror', 'data.page_language = data.language'],
    ['admin delivery verification', 'body.adminEmailSent === true'],
    ['customer delivery verification', 'body.customerEmailSent === true'],
    ['submission key', 'submission_key'],
    ['fluid rhythm shared loader', 'data-fluid-4k-rhythm'],
    ['fluid rhythm cache-busted stylesheet', '/assets/css/fluid-4k-rhythm.css?v=20260914-rhythm']
  ];
  for (const [name, token] of runtimeContracts) if (!runtime.includes(token)) fail.push(`quote/runtime: ${name} contract missing`);
}
if (exists('assets/js/main.js')) {
  const runtime = read('assets/js/main.js');
  const contactContracts = [
    ['contact selector', 'document.querySelectorAll("[data-contact-form]")'],
    ['shared endpoint lookup', 'config.formEndpoint'],
    ['verified POST', 'function submitVerified()'],
    ['JSON payload', 'JSON.stringify(payload)'],
    ['mail fallback', 'openMailFallback()']
  ];
  for (const [name, token] of contactContracts) if (!runtime.includes(token)) fail.push(`contact runtime: ${name} contract missing`);
}

for (const p of ['requestaquote/index.html', 'hu/ajanlatkeres/index.html', 'de-at/anfrage/index.html']) {
  if (exists(p) && !/data-smart-quote|data-form-kind=["']quote["']/i.test(read(p))) {
    fail.push(`${p}: quote form contract missing`);
  }
}
for (const p of ['contact/index.html', 'hu/kapcsolat/index.html', 'de-at/kontakt/index.html']) {
  if (exists(p)) {
    const h = read(p);
    if (!/data-contact-form/i.test(h)) fail.push(`${p}: contact submission selector missing`);
    if (!/data-form-kind=["']contact["']/i.test(h)) fail.push(`${p}: contact form-kind contract missing`);
    if (!/name=["']website["']/i.test(h)) fail.push(`${p}: honeypot field missing`);
    if (!/assets\/js\/site-config\.js/i.test(h) || !/assets\/js\/main\.js/i.test(h)) fail.push(`${p}: form runtime scripts missing`);
  }
}

if (exists('llms.txt')) {
  const llms = read('llms.txt');
  for (const token of ['/requestaquote/', '/hu/ajanlatkeres/', '/de-at/anfrage/', '/contact/', '/hu/kapcsolat/', '/de-at/kontakt/']) {
    if (!llms.includes(token)) fail.push(`llms.txt: missing action route ${token}`);
  }
}
if (exists('api/v1/actions.json')) {
  const actions = JSON.parse(read('api/v1/actions.json'));
  if (actions?.requestQuote?.url !== 'https://www.norbertbanhalmi.com/requestaquote/') fail.push('actions.json: canonical requestQuote route drift');
  if (actions?.transactionalApiAvailable !== false) fail.push('actions.json: agent must not treat browser form gateway as autonomous transactional API');
}
if (exists('.well-known/agent.json')) {
  const agent = JSON.parse(read('.well-known/agent.json'));
  if (!Array.isArray(agent.read) || !agent.read.includes('/api/v1/actions.json')) fail.push('agent.json: actions discovery missing');
}

if (exists('entity.jsonld')) {
  const entityText = read('entity.jsonld');
  for (const token of ['Q56391118', 'Q138425941', 'Gersthofer Straße 150–154/6/2']) {
    if (!entityText.includes(token)) fail.push(`entity.jsonld: missing ${token}`);
  }
  if (!/Gersthofer[^]{0,1200}not a photographic studio/i.test(entityText)) fail.push('entity.jsonld: Gersthofer non-studio role missing');
}

for (const [p, expected] of [
  ['redirects/at/middleware.js', '"/portrait/":"/de-at/portrait/"'],
  ['redirects/hu/middleware.js', '"/portrait/":"/hu/portre/"']
]) {
  if (exists(p)) {
    const m = read(p);
    if (!m.includes('const ROUTES =')) fail.push(`${p}: explicit localized route map missing`);
    if (!m.includes(expected)) fail.push(`${p}: portrait localization mapping missing`);
    if (!m.includes('function lookupPath(pathname)')) fail.push(`${p}: slashless-path normalization missing`);
    if (/CANONICAL_PREFIX\s*\+\s*pathname/.test(m)) fail.push(`${p}: blind path-prefix routing returned`);
  }
}

if (fail.length) {
  console.error(fail.join('\n'));
  process.exit(1);
}
console.log(`Clean BANHALMI architecture passed: ${files.filter(f => f.endsWith('.html')).length} HTML pages, exact approved CSS authority set preserved with no legacy duplicate layers, critical quote/contact/LLM/entity/alias contracts preserved.`);
