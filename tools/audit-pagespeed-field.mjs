const targets = [
  'https://www.norbertbanhalmi.com/',
  'https://www.norbertbanhalmi.com/hu/',
  'https://www.norbertbanhalmi.com/de-at/'
];

const thresholds = {
  LARGEST_CONTENTFUL_PAINT_MS: 2500,
  INTERACTION_TO_NEXT_PAINT: 200,
  CUMULATIVE_LAYOUT_SHIFT_SCORE: 0.1
};

const key = process.env.PAGESPEED_API_KEY || '';
let measured = 0;
const failures = [];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function fetchPsi(endpoint, target) {
  const maxAttempts = 4;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
      if (response.ok || [403, 429].includes(response.status)) return response;
      if (response.status >= 500 && response.status <= 599) {
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < maxAttempts) {
          const delay = 1500 * attempt;
          console.warn(`PSI transient failure for ${target}: HTTP ${response.status}; retry ${attempt}/${maxAttempts - 1} in ${delay}ms.`);
          await sleep(delay);
          continue;
        }
        console.warn(`PSI temporarily unavailable for ${target} after ${maxAttempts} attempts: HTTP ${response.status}. Lighthouse lab gates remain authoritative for this release.`);
        return null;
      }
      throw new Error(`PSI request failed for ${target}: HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = 1500 * attempt;
        console.warn(`PSI network failure for ${target}: ${error.message}; retry ${attempt}/${maxAttempts - 1} in ${delay}ms.`);
        await sleep(delay);
        continue;
      }
    }
  }
  console.warn(`PSI temporarily unavailable for ${target} after retries: ${lastError?.message || 'unknown network error'}. Lighthouse lab gates remain authoritative for this release.`);
  return null;
}

for (const target of targets) {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', target);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.append('category', 'performance');
  if (key) endpoint.searchParams.set('key', key);

  const response = await fetchPsi(endpoint, target);
  if (!response) continue;
  if ([403, 429].includes(response.status)) {
    console.warn(`PSI unavailable for ${target}: HTTP ${response.status}. Configure PAGESPEED_API_KEY for stable quota.`);
    continue;
  }

  const data = await response.json();
  const field = data.loadingExperience?.metrics || data.originLoadingExperience?.metrics || {};
  const values = {
    LARGEST_CONTENTFUL_PAINT_MS: Number(field.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? NaN),
    INTERACTION_TO_NEXT_PAINT: Number(field.INTERACTION_TO_NEXT_PAINT?.percentile ?? NaN),
    CUMULATIVE_LAYOUT_SHIFT_SCORE: Number(field.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ?? NaN) / 100
  };
  const available = Object.entries(values).filter(([, value]) => Number.isFinite(value));
  if (!available.length) {
    console.log(`PSI/CrUX: ${target} has insufficient field data; Lighthouse lab gate remains authoritative in CI.`);
    continue;
  }
  measured++;
  console.log(`PSI/CrUX mobile p75 ${target}: ${available.map(([name, value]) => `${name}=${value}`).join(', ')}`);
  for (const [name, value] of available) if (value > thresholds[name]) failures.push(`${target}: ${name} ${value} exceeds good threshold ${thresholds[name]}`);
}

if (!measured) {
  console.log('No URL has sufficient CrUX field data yet, or PSI was temporarily unavailable; verified Lighthouse lab budgets remain the release gate.');
}
if (failures.length) {
  console.error('\nCore Web Vitals field gate failed:');
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log('PSI/CrUX field monitor passed for every metric with sufficient data.');
