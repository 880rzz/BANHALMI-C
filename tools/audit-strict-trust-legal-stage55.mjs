import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git','node_modules','_site','playwright-report','test-results'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(root);

const legal = {
  en: read('impressum/index.html'),
  de: read('de-at/impressum/index.html'),
  hu: read('hu/impresszum/index.html')
};
const legalRequired = [
  'Banhalmi Norbert e.U.',
  '36592951',
  'ATU80445314',
  'Magistratisches Bezirksamt des I. Bezirkes'
];
for (const [lang, text] of Object.entries(legal)) {
  for (const token of legalRequired) if (!text.includes(token)) errors.push(`${lang} legal notice missing ${token}`);
  if (!/Medieninhaber|Media owner|Médiatulajdonos/i.test(text)) errors.push(`${lang} legal notice missing media-owner disclosure`);
  if (!/Blattlinie|Basic editorial direction|Alapvető szerkesztési irány/i.test(text)) errors.push(`${lang} legal notice missing MedienG editorial-direction disclosure`);
  if (/awarded in Austria/i.test(text)) errors.push(`${lang} legal notice retains unsupported regulated-trade wording`);
}

const privacy = {
  en: read('privacy-policy/index.html'),
  de: read('de-at/datenschutz/index.html'),
  hu: read('hu/adatvedelem/index.html')
};
for (const [lang, text] of Object.entries(privacy)) {
  for (const token of ['Banhalmi Norbert e.U.','Cloudflare','Google','GitHub','180']) {
    if (!text.includes(token)) errors.push(`${lang} privacy notice missing ${token}`);
  }
  if (!/(?:Art(?:icle)?\.?\s*6|Artikel\s*6|6\.\s*cikk)/i.test(text)) errors.push(`${lang} privacy notice missing GDPR Article 6 legal-basis reference`);
  if (!/Datenschutzbehörde|Data Protection Authority|Adatvédelmi Hatóság/i.test(text)) errors.push(`${lang} privacy notice missing supervisory-authority route`);
  if (!/automated|automatisiert|automatizált/i.test(text)) errors.push(`${lang} privacy notice missing automated-decision transparency`);
}

const cookies = {
  en: read('cookie-policy/index.html'),
  de: read('de-at/cookies/index.html'),
  hu: read('hu/sutik/index.html')
};
for (const [lang, text] of Object.entries(cookies)) {
  if (!text.includes('§ 165 Abs. 3 TKG 2021')) errors.push(`${lang} cookie notice missing Austrian TKG 2021 consent rule`);
  if (!/180 days|180 Tage|180 nap/i.test(text)) errors.push(`${lang} cookie notice missing consent-record lifetime`);
  if (!/Google Analytics 4/i.test(text)) errors.push(`${lang} cookie notice missing GA4 disclosure`);
  if (!/withdraw|widerruf|visszavon/i.test(text)) errors.push(`${lang} cookie notice missing withdrawal route`);
}

const analytics = read('assets/js/analytics.js');
for (const token of [
  'G-90C452LJKQ',
  'analytics_storage: "denied"',
  'ad_storage: "denied"',
  'ad_user_data: "denied"',
  'ad_personalization: "denied"',
  'personalization_storage: "denied"',
  'functionality_storage: "denied"',
  'security_storage: "granted"',
  'allow_google_signals: false',
  'allow_ad_personalization_signals: false'
]) if (!analytics.includes(token)) errors.push(`analytics.js missing strict consent token ${token}`);
if (analytics.indexOf('googletagmanager.com/gtag/js') < analytics.indexOf('function load()')) errors.push('analytics.js may request Google before consent gate');

for (const file of htmlFiles) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  const direct = /<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js/i.test(text);
  if (direct) errors.push(`${rel}: direct GA loader must not be embedded in HTML`);
}

const trustPages = {
  en: read('trust/index.html'),
  de: read('de-at/vertrauen/index.html'),
  hu: read('hu/bizalom/index.html')
};
const commissionGuidelines = 'https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems';
const commissionCode = 'https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content';
const eurLex = 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj';
for (const [lang, text] of Object.entries(trustPages)) {
  if (!/Article 50|Artikel 50|50\. cikk/i.test(text)) errors.push(`${lang} Trust Center missing EU AI Act Article 50 transparency statement`);
  if (!/2 August 2026|2\. August 2026|2026\. augusztus 2/i.test(text)) errors.push(`${lang} Trust Center missing Article 50 applicability date`);
  if (!/AI-generated or manipulated|KI-erzeugte oder KI-manipulierte|AI által létrehozott vagy módosított/i.test(text)) errors.push(`${lang} Trust Center missing AI-generated/manipulated-content disclosure rule`);
  if (!/human editorial|menschlich\w*\s+redaktionell\w*|emberi szerkesztői/i.test(text)) errors.push(`${lang} Trust Center missing human editorial-control rule`);
  if (!text.includes(commissionGuidelines)) errors.push(`${lang} Trust Center missing 2026 Commission Article 50 guidelines source`);
  if (!text.includes(commissionCode)) errors.push(`${lang} Trust Center missing Commission AI-generated-content Code source`);
  if (!text.includes(eurLex)) errors.push(`${lang} Trust Center missing EUR-Lex AI Act source`);
  if (/could be mistaken for authentic content|mit authentischen Inhalten verwechselt werden könnten|hiteles tartalommal összetéveszthető/i.test(text)) {
    errors.push(`${lang} Trust Center retains pre-guidelines ambiguity instead of Article 50 scope`);
  }
}

const trustIndex = JSON.parse(read('trust-center.json'));
if (trustIndex.dateModified !== '2026-08-11') errors.push('trust-center.json dateModified must match final trust release');
const principles = (trustIndex.principles || []).join(' | ');
if (!/AI Act Article 50/i.test(principles)) errors.push('trust-center.json missing AI Act Article 50 principle');
if (!/2 August 2026/i.test(principles)) errors.push('trust-center.json missing Article 50 applicability date');
for (const source of [commissionGuidelines, commissionCode, eurLex]) {
  if (!(trustIndex.policySources || []).includes(source)) errors.push(`trust-center.json missing authoritative policy source ${source}`);
}

const processors = JSON.parse(read('processors.json'));
const ga = (processors.providers || []).find(p => p.id === 'google-analytics-4');
if (!ga || ga.consentRequired !== true) errors.push('processors.json: GA4 must remain optional and consent-gated');
const controls = (ga?.controls || []).join(' | ');
for (const token of ['analytics storage only after consent','advertising storage disabled','Google Signals disabled','ad personalization signals disabled','personalization storage disabled']) {
  if (!controls.includes(token)) errors.push(`processors.json GA4 controls missing ${token}`);
}

const schemaFiles = ['index.html','hu/index.html','de-at/index.html','impressum/index.html','hu/impresszum/index.html','de-at/impressum/index.html'];
for (const rel of schemaFiles) {
  const text = read(rel);
  const blocks = [...text.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  if (!blocks.length) errors.push(`${rel}: JSON-LD missing`);
  for (const block of blocks) {
    try { JSON.parse(block); } catch (e) { errors.push(`${rel}: invalid JSON-LD: ${e.message}`); }
  }
  if (/New York[^<]{0,80}(headquarters|studio|operational base)/i.test(text)) errors.push(`${rel}: New York incorrectly framed as operational base`);
}

for (const rel of ['llms.txt','ai.txt','entity.jsonld','knowledge-core.json']) {
  const text = read(rel);
  if (!text.includes('Bánhalmi Norbert') && !text.includes('Norbert BANHALMI') && !text.includes('BANHALMI')) errors.push(`${rel}: canonical identity signal missing`);
  if (/New York is (?:an?|the) (?:active )?(?:studio|office|headquarters|operational base)/i.test(text)) errors.push(`${rel}: false New York operational signal`);
}

if (errors.length) {
  console.error('STAGE 55 STRICT TRUST / LEGAL / GA / SCHEMA / LLM AUDIT FAILED');
  for (const e of errors) console.error('-', e);
  process.exit(1);
}
console.log(`Stage 55 strict trust/legal/GA/schema/LLM audit passed across ${htmlFiles.length} HTML files.`);