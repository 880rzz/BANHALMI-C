import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const locales = {
  en: ['privacy-policy/index.html', 'cookie-policy/index.html'],
  hu: ['hu/adatvedelem/index.html', 'hu/sutik/index.html'],
  de: ['de-at/datenschutz/index.html', 'de-at/cookies/index.html']
};
const required = [
  'www.norbertbanhalmi.com',
  'www.banhalmi.art',
  'blog.banhalmi.art',
  'G-90C452LJKQ',
  'G-PKLH4H5YKD',
  'G-EY91Q4QSVF'
];
const obsoleteSharedClaims = [
  /same GA4 property/i,
  /shared GA4 property/i,
  /ugyanazt a GA4/i,
  /gemeinsame GA4-Property/i
];
const failures = [];

const clarityDisclosureRequirements = {
  en: ['session playback data is retained for 30 days', '1% or 10 per day', 'Copilot features are enabled', 'clarity/copilot/overview'],
  hu: ['visszajátszási adatait 30 napig', 'naponta 1%, de legalább 10', 'Copilot funkciók be vannak kapcsolva', 'clarity/copilot/overview'],
  de: ['Wiedergabedaten von Sitzungen 30 Tage lang', '1 % oder 10 pro Tag', 'Copilot-Funktionen sind für dieses Projekt aktiviert', 'clarity/copilot/overview']
};

for (const [locale, routes] of Object.entries(locales)) {
  for (const [index, route] of routes.entries()) {
    const html = await readFile(path.join(root, route), 'utf8');
    if (index === 0) {
      for (const token of required) {
        if (!html.includes(token)) failures.push(`${route}: missing ecosystem privacy token ${token}`);
      }
      for (const pattern of obsoleteSharedClaims) {
        if (pattern.test(html)) failures.push(`${route}: obsolete shared analytics claim matches ${pattern}`);
      }
      if (!html.includes('data-cross-site-privacy="true"')) failures.push(`${route}: ecosystem privacy section missing`);
    }
    const clarityStart = html.indexOf('data-clarity-disclosure=');
    const clarityEnd = html.indexOf('</section>', clarityStart);
    const claritySection = clarityStart >= 0 && clarityEnd >= 0 ? html.slice(clarityStart, clarityEnd) : '';
    if (!claritySection) failures.push(`${route}: Clarity disclosure section missing`);
    for (const token of clarityDisclosureRequirements[locale]) {
      if (!claritySection.includes(token)) failures.push(`${route}: Clarity disclosure missing ${token}`);
    }
  }
}

const processors = JSON.parse(await readFile(path.join(root, 'processors.json'), 'utf8'));
const clarity = processors.providers.find((provider) => provider.id === 'microsoft-clarity');
if (!clarity) failures.push('processors.json: Microsoft Clarity provider missing');
else {
  if (clarity.consentRequired !== true) failures.push('processors.json: Clarity must remain consent-gated');
  if (clarity.accountSettingsObserved?.projectId !== 'ky4j4kbgt7') failures.push('processors.json: observed Clarity project ID missing');
  if (clarity.accountSettingsObserved?.maskingMode !== 'Balanced') failures.push('processors.json: observed Clarity masking mode missing');
  if (clarity.accountSettingsObserved?.copilotFeatures !== 'On') failures.push('processors.json: observed Clarity Copilot state missing');
  if (clarity.retention?.playbackData !== '30 days') failures.push('processors.json: Clarity playback retention missing');
  if (clarity.retention?.clickAndHeatmapData !== 'up to 9 months') failures.push('processors.json: Clarity click/heatmap retention missing');
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}

console.log('BANHALMI ecosystem privacy contract passed: provider scopes, Clarity retention and observed settings match across EN, HU and DE notices.');
