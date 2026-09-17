import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const exists = p => fs.existsSync(path.join(root, p));

const staticRedirects = {
  'en/work': 'https://www.banhalmi.art/',
  'about/norbert-banhalmi': 'https://www.norbertbanhalmi.com/about/',
  'hu/rolam/banhalmi-norbert': 'https://www.norbertbanhalmi.com/about/',
  'de/ueber-mich/norbert-banhalmi': 'https://www.norbertbanhalmi.com/about/',
  'press': 'https://www.banhalmi.art/press.html',
  'old-print': 'https://www.banhalmi.art/press.html',
  'hu/sajto/megjelenesek': 'https://www.banhalmi.art/hu/press.html',
  'hu/sajto/nyomtatott': 'https://www.banhalmi.art/hu/press.html',
  'de/presse/presseauftritte': 'https://www.banhalmi.art/de-at/press.html',
  'de/presse/print': 'https://www.banhalmi.art/de-at/press.html',
  'oneletrajz-cv-fotozas': 'https://www.norbertbanhalmi.com/hu/portre/',
  'portfolio-fotozas': 'https://www.norbertbanhalmi.com/hu/portre/',
  'muveszi-aktfotozas': 'https://www.norbertbanhalmi.com/hu/muveszi-fotografia/',
  'reklam-fotozas': 'https://www.norbertbanhalmi.com/hu/brand/',
  'post/amikor-csak-egy-táncpartnered-van-egész-estére': 'https://blog.banhalmi.art/post/amikor-csak-egy-táncpartnered-van-egész-estére',
  'blog/tags/filter-nélkül-a-testem-története': 'https://blog.banhalmi.art/blog'
};

const mainDomainLegacyRedirects = {
  'de-at/event-photography': 'https://www.norbertbanhalmi.com/de-at/eventfotografie/'
};

for (const [route, target] of Object.entries(staticRedirects)) {
  const file = `${route}/index.html`;
  if (!exists(file)) {
    failures.push(`${file}: historical redirect stub missing`);
    continue;
  }
  const html = read(file);
  if (/noindex/i.test(html)) failures.push(`${file}: consolidation redirect must not carry noindex`);
  if (!html.includes(target)) failures.push(`${file}: target ${target} missing`);
  if (!/rel=["']canonical["']/i.test(html)) failures.push(`${file}: canonical link missing`);
  if (!/http-equiv=["']refresh["']/i.test(html)) failures.push(`${file}: meta refresh missing`);
  if (!/window\.location\.replace/i.test(html)) failures.push(`${file}: JS forwarding missing`);
}

for (const [route, target] of Object.entries(mainDomainLegacyRedirects)) {
  const file = `${route}/index.html`;
  if (!exists(file)) {
    failures.push(`${file}: main-domain legacy redirect stub missing`);
    continue;
  }
  const html = read(file);
  if (/noindex/i.test(html)) failures.push(`${file}: consolidation redirect must not carry noindex`);
  if (!html.includes(target)) failures.push(`${file}: target ${target} missing`);
  if (!/rel=["']canonical["']/i.test(html)) failures.push(`${file}: canonical link missing`);
  if (!/http-equiv=["']refresh["']/i.test(html)) failures.push(`${file}: meta refresh missing`);
  if (!/window\.location\.replace/i.test(html)) failures.push(`${file}: JS forwarding missing`);
  if (/€\s*200|200\s*€|200\s*\/\s*hour|200\s*€\s*\/\s*Stunde/i.test(html)) failures.push(`${file}: legacy event price leaked into redirect stub`);
}

const vercel = JSON.parse(read('vercel.json'));
const edgeRules = Array.isArray(vercel.redirects) ? vercel.redirects : [];
for (const [route, target] of Object.entries(staticRedirects)) {
  const source = `/${route}`;
  const expectedDestination = target.startsWith('https://www.norbertbanhalmi.com')
    ? new URL(target).pathname
    : target;
  const rule = edgeRules.find(r => r.source === source && !Array.isArray(r.has));
  if (!rule) {
    failures.push(`vercel.json: historical source ${source} missing`);
    continue;
  }
  if (rule.destination !== expectedDestination) failures.push(`vercel.json: ${source} target drifted to ${rule.destination}`);
  if (rule.permanent !== true) failures.push(`vercel.json: ${source} must stay permanent`);
}

const aliasContracts = [
  {
    file: 'redirects/hu/middleware.js',
    fallback: 'const FALLBACK = "/hu/"',
    routes: {
      '/portrait/': '/hu/portre/',
      '/contact/': '/hu/kapcsolat/',
      '/privacy-policy/': '/hu/adatvedelem/',
      '/terms-conditions/': '/hu/aszf/',
      '/event-photography/': '/hu/rendezvenyfotozas/',
      '/about/': '/hu/eletmu/'
    }
  },
  {
    file: 'redirects/at/middleware.js',
    fallback: 'const FALLBACK = "/de-at/"',
    routes: {
      '/portrait/': '/de-at/portrait/',
      '/contact/': '/de-at/kontakt/',
      '/privacy-policy/': '/de-at/datenschutz/',
      '/terms-conditions/': '/de-at/agb/',
      '/event-photography/': '/de-at/eventfotografie/',
      '/about/': '/de-at/werk/'
    }
  }
];

for (const contract of aliasContracts) {
  if (!exists(contract.file)) {
    failures.push(`${contract.file}: alias middleware missing`);
    continue;
  }
  const source = read(contract.file);
  if (!source.includes('const ROUTES =')) failures.push(`${contract.file}: explicit ROUTES map missing`);
  if (!source.includes(contract.fallback)) failures.push(`${contract.file}: safe language-root fallback missing`);
  if (!source.includes('target.search = incoming.search')) failures.push(`${contract.file}: query-string preservation missing`);
  if (!source.includes("status: 308")) failures.push(`${contract.file}: permanent redirect status missing`);
  if (!source.includes('function lookupPath(pathname)')) failures.push(`${contract.file}: slashless normalization missing`);
  if (/CANONICAL_PREFIX\s*\+\s*pathname|languageBase\s*\+\s*cleanPath/.test(source)) failures.push(`${contract.file}: unsafe blind path prefixing returned`);
  for (const [from, to] of Object.entries(contract.routes)) {
    const token = `${JSON.stringify(from)}:${JSON.stringify(to)}`;
    if (!source.includes(token)) failures.push(`${contract.file}: localized mapping ${from} -> ${to} missing`);
  }
}

for (const file of ['redirects/at/vercel.json', 'redirects/hu/vercel.json']) {
  if (!exists(file)) {
    failures.push(`${file}: redirect project config missing`);
    continue;
  }
  const cfg = JSON.parse(read(file));
  if (!cfg.git || cfg.git.deploymentEnabled !== false) failures.push(`${file}: git deployment suppression missing`);
  if (!Array.isArray(cfg.redirects) || cfg.redirects.some(r => r.permanent !== true)) failures.push(`${file}: every redirect must remain permanent`);
}

const sitemap = read('sitemap.xml');
for (const route of [...Object.keys(staticRedirects), ...Object.keys(mainDomainLegacyRedirects)]) {
  const local = `https://www.norbertbanhalmi.com/${route.replace(/^\/+|\/+$/g, '')}/`;
  if (sitemap.includes(`<loc>${local}</loc>`)) failures.push(`sitemap.xml: redirect source must not be indexed: ${local}`);
}

for (const canonicalPage of ['hu/eletmu/index.html', 'de-at/werk/index.html', 'hu/portre/index.html', 'de-at/portrait/index.html', 'de-at/eventfotografie/index.html']) {
  if (!exists(canonicalPage)) failures.push(`${canonicalPage}: canonical destination missing`);
  else if (/http-equiv=["']refresh["']|window\.location\.replace/i.test(read(canonicalPage))) failures.push(`${canonicalPage}: canonical destination became a redirect`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Legacy redirect preservation passed: ${Object.keys(staticRedirects).length} historical stubs, ${Object.keys(mainDomainLegacyRedirects).length} main-domain legacy service redirects, two localized alias maps, permanent Vercel routing and sitemap exclusion are protected.`);
