import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');
const json = (path) => JSON.parse(read(path));
const expect = (condition, message) => { if (!condition) failures.push(message); };
const rate = 400;
const pricing = json('pricing.json');
const pricingHuf = json('pricing-huf.json');
const guide = json('pricing-guide.json');
const policy = json('project-policy.json');

expect(pricing.currency === 'EUR', 'pricing.json canonical currency must remain EUR');
expect(pricing.fixedCurrencyConversions?.EUR_HUF?.rate === rate, 'fixed EUR/HUF rate must equal 400');
expect(pricing.fixedCurrencyConversions?.EUR_HUF?.liveExchangeRate === false, 'fixed HUF rate must be explicitly non-live');
expect(pricing.standardUsageLicence?.included === true, 'standard organisational licence must be included');
expect(/unlimited in time and territory/.test(pricing.standardUsageLicence?.scope || ''), 'standard licence scope is unclear');
for (const [key, value] of Object.entries(pricing.priceComponentsGrossEUR)) {
  expect(pricing.priceComponentsGrossHUF?.[key] === Math.round(value * rate), `HUF component mismatch: ${key}`);
}

expect(pricingHuf.currency === 'HUF' && pricingHuf.baseCurrency === 'EUR', 'pricing-huf.json currency roles are invalid');
expect(pricingHuf.conversion?.rate === rate, 'pricing-huf.json fixed rate is invalid');
expect(pricingHuf.conversion?.liveExchangeRate === false, 'pricing-huf.json must reject live-rate interpretation');

const embeddedText = read('assets/js/pricing-data.js');
const prefix = 'window.BANHALMI_PRICING_DATA=';
const suffix = ';\nwindow.BANHALMI_PRICING_VERSION=';
const start = embeddedText.indexOf(prefix);
const end = embeddedText.indexOf(suffix, start + prefix.length);
expect(start >= 0 && end > start, 'embedded pricing payload markers are missing');
if (start >= 0 && end > start) {
  const embedded = JSON.parse(embeddedText.slice(start + prefix.length, end));
  expect(JSON.stringify(embedded) === JSON.stringify(pricing), 'embedded pricing data is not identical to pricing.json');
}

const calculator = read('assets/js/quote-calculator.js');
for (const token of ['displayCurrency','displayGross','displayNet','displayVat','pricingMeta.hufRate']) {
  expect(calculator.includes(token), `calculator missing ${token}`);
}
const main = read('assets/js/main.js');
for (const token of ['displayCurrency','displayExchangeRate','displayGrossAmount']) {
  expect(main.includes(token), `quote payload missing ${token}`);
}
const pdf = read('assets/js/quote-pdf.js');
for (const token of ['Fix tervezési árfolyam: 1 EUR = 400 HUF','data.currency','displayGross']) {
  expect(pdf.includes(token), `quote PDF missing ${token}`);
}

for (const [file, currency] of [
  ['requestaquote/index.html', 'EUR'],
  ['de-at/anfrage/index.html', 'EUR'],
  ['hu/ajanlatkeres/index.html', 'HUF']
]) {
  const html = read(file);
  for (const token of ['estimate_display_currency','estimate_display_rate','estimate_display_gross']) {
    expect(html.includes(token), `${file} missing ${token}`);
  }
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => { try { return JSON.parse(match[1]); } catch { return null; } });
  const catalog = scripts.find((item) => item?.['@type'] === 'OfferCatalog');
  expect(Boolean(catalog), `${file} OfferCatalog missing`);
  if (catalog) {
    expect(catalog.itemListElement.length === 30, `${file} OfferCatalog must expose 30 price components`);
    expect(catalog.itemListElement.every((item) => item.priceCurrency === currency), `${file} OfferCatalog currency mismatch`);
    const expectedHeadshot = currency === 'HUF' ? 48000 : 120;
    expect(catalog.itemListElement.some((item) => /Headshot|CV-portré/.test(item.name) && Number(item.price) === expectedHeadshot), `${file} Headshot CV offer missing`);
  }
}

const hu = read('hu/ajanlatkeres/index.html');
for (const token of ['1 EUR = 400 HUF','/pricing-huf.json','forintban','48 000 Ft','144 000 Ft','96 000 Ft']) {
  expect(hu.includes(token), `Hungarian quote page missing ${token}`);
}

// Detailed HUF conversion semantics belong in ai.txt and canonical pricing JSON.
const ai = read('ai.txt');
for (const token of ['pricing-huf.json','1 EUR = 400 HUF','not a live exchange rate','grossHUF']) {
  expect(ai.includes(token), `ai.txt missing ${token}`);
}
// llms.txt stays a concise agent-entry index and only needs to route to canonical pricing resources.
const llms = read('llms.txt');
expect(llms.includes('[Pricing](https://www.norbertbanhalmi.com/pricing.json)'), 'llms.txt missing canonical pricing route');
expect(llms.includes('[AI pricing guide](https://www.norbertbanhalmi.com/pricing-guide.json)'), 'llms.txt missing pricing-guide route');
expect(/EUR is the canonical price currency; HUF is a Hungarian planning display/i.test(llms), 'llms.txt missing concise EUR/HUF interpretation');

expect(guide.fixedCurrencyConversion?.rate === rate, 'pricing guide fixed rate missing');
expect(guide.workedExamples.every((item) => item.hungarianDisplay?.fixedRateHUFPerEUR === rate), 'worked example HUF conversion missing');
expect(/fixed planning conversion/.test(policy.commercialInterpretation?.hungarianOrientationCurrency || ''), 'project policy HUF interpretation missing');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('EUR/HUF pricing, OfferCatalog, PDF and machine-layer audit passed: llms stays concise; detailed HUF semantics remain in ai.txt and pricing JSON.');
