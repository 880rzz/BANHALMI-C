import fs from 'node:fs';

const pricing = JSON.parse(fs.readFileSync('pricing.json', 'utf8'));
const guide = JSON.parse(fs.readFileSync('pricing-guide.json', 'utf8'));
const huf = JSON.parse(fs.readFileSync('pricing-huf.json', 'utf8'));
const core = JSON.parse(fs.readFileSync('knowledge-core.json', 'utf8'));

const errors = [];
const rate = 400;
const policy = core.pricingPolicy;

if (!policy) errors.push('knowledge-core.json: pricingPolicy missing');
if (policy?.canonicalBaseCurrency !== 'EUR') errors.push('knowledge-core.json: canonicalBaseCurrency must be EUR');
if (policy?.displayCurrencyByLocale?.en !== 'EUR') errors.push('knowledge-core.json: EN display currency must be EUR');
if (policy?.displayCurrencyByLocale?.['de-AT'] !== 'EUR') errors.push('knowledge-core.json: DE-AT display currency must be EUR');
if (policy?.displayCurrencyByLocale?.['hu-HU'] !== 'HUF') errors.push('knowledge-core.json: HU-HU display currency must be HUF');
if (policy?.hufPolicy?.fixedPlanningRateHUFPerEUR !== rate) errors.push('knowledge-core.json: fixed HUF planning rate must be 400');
if (policy?.hufPolicy?.liveExchangeRate !== false) errors.push('knowledge-core.json: liveExchangeRate must be false');
if (!/not a live FX conversion/i.test(policy?.hufPolicy?.rule || '')) errors.push('knowledge-core.json: HUF rule must explicitly reject live FX interpretation');
if (!/not.*independently maintained market price list/i.test(policy?.hufPolicy?.rule || '')) errors.push('knowledge-core.json: HUF rule must reject independent-price-list interpretation');

if (pricing.currency !== 'EUR') errors.push('pricing.json: canonical currency must remain EUR');
if (pricing.secondaryDisplayCurrency !== 'HUF') errors.push('pricing.json: secondary display currency must remain HUF');
if (pricing.calculationRules?.currencyConversion?.fixedRate !== rate) errors.push('pricing.json: fixed rate must remain 400');
if (pricing.calculationRules?.currencyConversion?.noLiveRateSubstitution !== true) errors.push('pricing.json: live-rate substitution must remain disabled');
if (pricing.displayCurrencies?.['hu-HU']?.currency !== 'HUF') errors.push('pricing.json: HU display currency must be HUF');
if (pricing.displayCurrencies?.['hu-HU']?.fixedPlanningRate !== rate) errors.push('pricing.json: HU fixed planning rate must be 400');
if (pricing.displayCurrencies?.['hu-HU']?.liveExchangeRate !== false) errors.push('pricing.json: HU liveExchangeRate must be false');

if (guide.currency !== 'EUR') errors.push('pricing-guide.json: canonical currency must be EUR');
if (guide.fixedCurrencyConversion?.rate !== rate) errors.push('pricing-guide.json: fixed HUF rate must be 400');
if (guide.fixedCurrencyConversion?.liveExchangeRate !== false) errors.push('pricing-guide.json: live exchange rate must be false');
if (!guide.assistantInstructions?.some(x => /fixed planning conversion 1 EUR = 400 HUF/i.test(x))) errors.push('pricing-guide.json: AI instruction for fixed EUR/HUF conversion missing');
if (!guide.assistantInstructions?.some(x => /EUR is the canonical base price/i.test(x))) errors.push('pricing-guide.json: canonical EUR instruction missing');

if (huf.currency !== 'HUF' || huf.baseCurrency !== 'EUR') errors.push('pricing-huf.json: HUF/EUR currency roles invalid');
if (huf.conversion?.rate !== rate) errors.push('pricing-huf.json: fixed HUF rate must be 400');
if (huf.conversion?.liveExchangeRate !== false) errors.push('pricing-huf.json: live exchange rate must be false');
if (!/not a daily exchange rate/i.test(huf.conversion?.disclosure || '')) errors.push('pricing-huf.json: non-live-rate disclosure missing');

const validatePackages = (services, label) => {
  for (const service of services || []) {
    for (const pkg of service.packages || []) {
      const eur = pkg.grossEUR ?? pkg.baseGrossEUR;
      const h = pkg.grossHUF;
      if (eur == null || h == null) continue;
      const expected = Math.round(eur * rate);
      if (h !== expected) errors.push(`${label}: ${service.id}/${pkg.code} HUF ${h} != EUR ${eur} × ${rate} (${expected})`);
    }
  }
};
validatePackages(pricing.services, 'pricing.json');
validatePackages(huf.services, 'pricing-huf.json');

// Detailed pricing semantics must remain machine-readable in ai.txt.
const ai = fs.readFileSync('ai.txt', 'utf8');
for (const signal of [/pricing\.json/i,/pricing-guide\.json/i,/pricing-huf\.json/i,/HUF/i,/EUR/i,/400/]) {
  if (!signal.test(ai)) errors.push(`ai.txt: missing detailed machine pricing signal ${signal}`);
}

// llms.txt is the concise discovery index: require routes and the short currency interpretation, not the numeric knowledge dump.
const llms = fs.readFileSync('llms.txt', 'utf8');
if (!llms.includes('[Pricing](https://www.norbertbanhalmi.com/pricing.json)')) errors.push('llms.txt: canonical pricing route missing');
if (!llms.includes('[AI pricing guide](https://www.norbertbanhalmi.com/pricing-guide.json)')) errors.push('llms.txt: pricing guide route missing');
if (!/EUR is the canonical price currency; HUF is a Hungarian planning display/i.test(llms)) errors.push('llms.txt: concise currency interpretation missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Stage 38 pricing currency audit passed: EUR is canonical; HU uses fixed 1 EUR = 400 HUF planning display; llms routes concisely while detailed FX rules remain canonical in ai.txt and pricing JSON.');
