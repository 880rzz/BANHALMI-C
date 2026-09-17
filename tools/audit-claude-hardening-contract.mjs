import fs from 'node:fs';

const errors = [];
function requireTokens(file, tokens) {
  const body = fs.readFileSync(file, 'utf8');
  for (const token of tokens) if (!body.includes(token)) errors.push(`${file}: missing required contract token: ${token}`);
}

requireTokens('assets/js/analytics.js', [
  'analytics_storage: "denied"',
  'ad_storage: "denied"',
  'allow_google_signals: false',
  'allow_ad_personalization_signals: false',
  'linker:',
  'domains: ["norbertbanhalmi.com", "banhalmi.art"]'
]);

requireTokens('hu/adatvedelem/index.html', [
  'tiltakozhat az adatkezelés ellen',
  'Nemzetközi',
  'Österreichische Datenschutzbehörde',
  'G-90C452LJKQ',
  'domainek közötti'
]);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('BANHALMI Claude-audit hardening contract passed: consent-first cross-domain analytics and HU GDPR rights/transfer/supervisory disclosures are explicit.');
