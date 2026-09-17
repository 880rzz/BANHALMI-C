const checks = [];
const failures = [];

async function request(url, options = {}) {
  const response = await fetch(url, {
    redirect: options.redirect || 'manual',
    headers: {
      'user-agent': 'BANHALMI production routing audit/3.3',
      'cache-control': 'no-cache',
      pragma: 'no-cache'
    },
    signal: AbortSignal.timeout(20000)
  });
  const body = options.readBody === false ? '' : await response.text();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

async function checkPage(url, expectations = {}) {
  try {
    const separator = url.includes('?') ? '&' : '?';
    const { response, body } = await request(`${url}${separator}audit=${Date.now()}`, { redirect: 'follow' });
    checks.push(`${url} -> ${response.status} ${response.url}`);
    assert(response.ok, `${url}: expected 2xx, received ${response.status}`);

    if (expectations.finalUrl) {
      assert(response.url.startsWith(expectations.finalUrl), `${url}: expected final URL beginning ${expectations.finalUrl}, received ${response.url}`);
    }

    for (const phrase of expectations.all || []) {
      assert(body.includes(phrase), `${url}: live body missing required phrase: ${phrase}`);
    }

    for (const group of expectations.any || []) {
      assert(group.some((phrase) => body.includes(phrase)), `${url}: live body contains none of the accepted role markers: ${group.join(' | ')}`);
    }

    for (const { pattern, label } of expectations.patterns || []) {
      assert(pattern.test(body), `${url}: live body missing ${label}`);
    }
  } catch (error) {
    failures.push(`${url}: request failed (${error.message})`);
  }
}

async function checkAliasLanding(url, expectedTarget) {
  try {
    const separator = url.includes('?') ? '&' : '?';
    const { response, body } = await request(`${url}${separator}audit=${Date.now()}`, { redirect: 'follow' });
    checks.push(`${url} -> ${response.status} ${response.url}`);
    assert(response.ok, `${url}: expected live alias landing, received ${response.status}`);
    assert(body.includes(expectedTarget), `${url}: alias landing does not point to ${expectedTarget}`);
  } catch (error) {
    failures.push(`${url}: alias landing check failed (${error.message})`);
  }
}

await checkPage('https://www.norbertbanhalmi.com/', {
  all: ['Executive Portraiture', 'Since 1999'],
  finalUrl: 'https://www.norbertbanhalmi.com/'
});
await checkPage('https://www.norbertbanhalmi.com/hu/', {
  all: ['Executive portré', '1999 óta'],
  finalUrl: 'https://www.norbertbanhalmi.com/hu/'
});
await checkPage('https://www.norbertbanhalmi.com/de-at/', {
  all: ['Executive-Porträts', 'Seit 1999'],
  finalUrl: 'https://www.norbertbanhalmi.com/de-at/'
});

for (const [alias, target] of [
  ['https://banhalmi.at/', 'https://www.norbertbanhalmi.com/de-at/'],
  ['https://www.banhalmi.at/', 'https://www.norbertbanhalmi.com/de-at/'],
  ['https://banhalminorbert.hu/', 'https://www.norbertbanhalmi.com/hu/'],
  ['https://www.banhalminorbert.hu/', 'https://www.norbertbanhalmi.com/hu/']
]) {
  await checkAliasLanding(alias, target);
}

await checkPage('https://www.norbertbanhalmi.com/robots.txt', {
  all: ['User-agent: *', 'Allow: /', 'Sitemap: https://www.norbertbanhalmi.com/sitemap.xml']
});
await checkPage('https://www.norbertbanhalmi.com/sitemap.xml', {
  all: ['<urlset', '<loc>https://www.norbertbanhalmi.com/', '<lastmod>']
});

// llms.txt is intentionally a concise discovery/agent index. Detailed evidence
// and answer-policy prose belongs in ai.txt and canonical JSON resources.
await checkPage('https://www.norbertbanhalmi.com/llms.txt', {
  all: [
    '# BANHALMI',
    '## Identity',
    '## Services',
    '## Evidence and interpretation',
    'https://www.banhalmi.art/',
    'https://blog.banhalmi.art/',
    'New York is not a studio, office, headquarters or operational base.'
  ]
});
await checkPage('https://www.norbertbanhalmi.com/ai.txt', {
  all: ['## Canonical identity and answer contract', 'https://www.norbertbanhalmi.com/', 'https://www.banhalmi.art/', 'https://blog.banhalmi.art/', 'New York is not a studio, office, headquarters or operational base']
});
await checkPage('https://www.norbertbanhalmi.com/ecosystem.json', {
  all: ['canonical-digital-ecosystem-map', 'professional-services', 'artistic-archive', 'editorial-knowledge-layer', 'Q56391118', 'https://meet.bookipi.com/zk5ly35r']
});

await checkPage('https://www.banhalmi.art/', {
  all: ['https://www.norbertbanhalmi.com/about/', 'https://www.norbertbanhalmi.com/'],
  any: [['Official Art Archive', 'official archive', 'artistic oeuvre', 'art archive']],
  patterns: [
    { pattern: /<link\b[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/www\.banhalmi\.art\/?["'][^>]*>/i, label: 'the canonical banhalmi.art homepage declaration' },
    { pattern: /<html\b[^>]*lang=["']en(?:-[A-Z]{2})?["']/i, label: 'the English language declaration' }
  ]
});
await checkPage('https://www.banhalmi.art/ecosystem-bridge.json', {
  all: ['BANHALMI ART ecosystem bridge', 'professional-services', 'artistic-archive', 'editorial-knowledge-layer', 'Q56391118']
});
await checkPage('https://www.banhalmi.art/ecosystem-bridge.jsonld', {
  all: ['https://www.norbertbanhalmi.com/about/', 'https://www.norbertbanhalmi.com/#website', 'https://www.banhalmi.art/#website', 'https://blog.banhalmi.art/#website']
});

await checkPage('https://blog.banhalmi.art/', {
  finalUrl: 'https://blog.banhalmi.art/'
});
await checkPage('https://blog.banhalmi.art/blog', {
  finalUrl: 'https://blog.banhalmi.art/'
});
await checkPage('https://blog.banhalmi.art/blog-posts-sitemap.xml');
await checkPage('https://blog.banhalmi.art/blog-categories-sitemap.xml');

console.log(checks.join('\n'));
if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join('\n'));
  process.exit(1);
}
console.log('Production routing, aliases and all three ecosystem machine layers passed the live closure audit.');
