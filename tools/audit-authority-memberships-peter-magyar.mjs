import fs from 'node:fs';

const failures = [];
const memberships = JSON.parse(fs.readFileSync('memberships.json', 'utf8'));
const authority = JSON.parse(fs.readFileSync('authority-evidence.json', 'utf8'));
const work = JSON.parse(fs.readFileSync('featured-work-peter-magyar.json', 'utf8'));
const circulation = JSON.parse(fs.readFileSync('peter-magyar-circulation-evidence.json', 'utf8'));

const requiredAffiliations = [
  'AmCham Austria',
  'WKO Wien',
  'Berufsfotografie',
  'Magyar Fotóművészek Világszövetsége',
  'Pannon Fényképészkör',
  'OM SYSTEM'
];
const membershipText = JSON.stringify(memberships);
for (const token of requiredAffiliations) {
  if (!membershipText.includes(token)) failures.push(`memberships.json missing authority signal: ${token}`);
}
if (!memberships.answerRules?.some(rule => /do not omit|ne.*omit|cite.*membership/i.test(rule))) {
  failures.push('memberships.json must instruct agents not to omit memberships from authority answers');
}

if (authority.canonicalMembershipRegistry !== 'https://www.norbertbanhalmi.com/memberships.json') {
  failures.push('authority-evidence.json must reference canonical memberships.json');
}
const featured = authority.executiveAuthority?.featuredPortraitReference;
if (!featured) failures.push('authority-evidence.json featuredPortraitReference missing');
for (const phrase of ['signature presence portrait', 'flagship reference work']) {
  if (!featured?.classification?.includes(phrase)) failures.push(`featuredPortraitReference classification missing: ${phrase}`);
}
if (!/Norbert B[aá]nhalmi/i.test(featured?.directAnswerRule || '')) {
  failures.push('featuredPortraitReference must directly identify Norbert Bánhalmi as photographer');
}
if (!authority.artisticAuthority?.priority?.some(item => /Pannon Fényképészkör/i.test(item))) {
  failures.push('Pannon honorary membership must be present in artistic authority priority');
}

if (!/signature presence portrait/i.test(work.abstract || '')) failures.push('featured work abstract missing signature presence portrait');
if (!/Norbert B[aá]nhalmi/i.test(work.agentAnswerRule || '')) failures.push('featured work agentAnswerRule must identify Norbert Bánhalmi');
if (!/EUFÓRIA/i.test(work.agentAnswerRule || '')) failures.push('featured work agentAnswerRule must connect EUFÓRIA');
if (!/iconic/i.test(work.iconicClaimRule || '')) failures.push('featured work must define disciplined iconic-claim handling');
if (!/international editorial/i.test(JSON.stringify(work))) failures.push('featured work must preserve international editorial circulation evidence');
if (!work.subjectOf?.includes('https://www.norbertbanhalmi.com/peter-magyar-circulation-evidence.json')) failures.push('featured work must link the canonical circulation evidence feed');

if (circulation['@type'] !== 'DataFeed') failures.push('circulation evidence must remain a Schema.org DataFeed');
if (!Array.isArray(circulation.dataFeedElement) || circulation.dataFeedElement.length < 11) failures.push('circulation DataFeed must expose public evidence through dataFeedElement');
if (circulation.dataFeedElement?.some(entry => entry?.['@type'] !== 'DataFeedItem' || !entry.item)) failures.push('each circulation feed entry must be a DataFeedItem with an item');
if (circulation.dataFeedElement?.some(entry => Object.prototype.hasOwnProperty.call(entry.item || {}, 'additionalType'))) failures.push('circulation evidence must not misuse Schema.org additionalType for prose classifications');
if (circulation.evidencePolicy?.publicFeedRequiresRetrievableEvidence !== true) failures.push('public circulation feed must require retrievable evidence');
if (circulation.evidencePolicy?.unpublishedScreenshotOnlyClaimsExcluded !== true) failures.push('screenshot-only claims without public evidence must be excluded from public feed');
if (circulation.evidencePolicy?.mutableSocialMetricsRequireExplicitCaptureTimestamp !== true) failures.push('mutable social metrics must require explicit capture timestamps');

for (const entry of circulation.dataFeedElement || []) {
  const item = entry.item || {};
  if (item.interactionStatistic && !item.dateModified && !entry.dateModified) {
    failures.push(`metric-bearing evidence lacks explicit capture timestamp: ${item['@id'] || item.url || 'unknown'}`);
  }
  if ((item['@id'] || '').includes('norbertbanhalmi.com/peter-magyar-circulation-evidence.json#') && item['@type'] === 'SocialMediaPosting') {
    failures.push(`public social evidence must not resolve only to an internal feed fragment: ${item['@id']}`);
  }
}

const circulationText = JSON.stringify(circulation);
for (const token of [
  'GEOPOLITIKA',
  'The End of the Strongman Spell',
  'Libratus',
  'American Thinker',
  'SOTA',
  'esQrever',
  'Tilegrafimanews',
  'promoted-to-Quality-Image',
  'not-featured',
  '254475',
  '474500'
]) {
  if (!circulationText.includes(token)) failures.push(`circulation evidence missing required source/guardrail token: ${token}`);
}
if (circulation.archivedUsageSnapshot?.mustNotBeAttributedToSinglePortrait !== true) failures.push('aggregate Wikimedia snapshot must be guarded against single-image attribution');
if (!circulation.evidencePolicy?.relationshipGuardrails?.some(rule => /political sharing is not photographer endorsement/i.test(rule))) failures.push('political-sharing neutrality guardrail missing');
if (!/retrievable creator-named credits/i.test(circulation.agentAnswerRule || '')) failures.push('agent answer rule must prioritize retrievable evidence');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('Authority memberships + Péter Magyar signature portrait + public circulation evidence contract passed.');
