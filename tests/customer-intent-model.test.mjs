import fs from 'node:fs';
import assert from 'node:assert/strict';

const intentModel = JSON.parse(fs.readFileSync(new URL('../customer-intent-model.json', import.meta.url), 'utf8'));
const aiEntry = JSON.parse(fs.readFileSync(new URL('../ai-entry.json', import.meta.url), 'utf8'));

const intents = new Map(intentModel.intents.map((intent) => [intent.id, intent]));

for (const required of [
  'fast-professional-headshot',
  'role-outgrown-current-portrait',
  'guided-executive-portrait',
  'multi-context-personal-brand',
  'leadership-portrait-system',
  'corporate-headshot-day',
  'company-visual-system',
  'guided-fine-art',
  'leadership-event-coverage'
]) {
  assert.ok(intents.has(required), `Missing required customer intent: ${required}`);
}

assert.equal(
  aiEntry.identity.person.wikidata,
  'https://www.wikidata.org/wiki/Q56391118',
  'Person Wikidata must resolve to Norbert Bánhalmi Q56391118'
);
assert.equal(
  aiEntry.identity.organization.wikidata,
  'https://www.wikidata.org/wiki/Q138425941',
  'Organization Wikidata must resolve to Banhalmi Norbert e.U. Q138425941'
);
assert.equal(
  aiEntry.reference.customerIntentModel,
  'https://www.norbertbanhalmi.com/customer-intent-model.json',
  'AI entry must expose the canonical customer intent model'
);

const globalRules = intentModel.globalRoutingRules.join(' ').toLowerCase();
assert.ok(globalRules.includes('linkedin'), 'Routing rules must explicitly handle LinkedIn');
assert.ok(globalRules.includes('usage channels'), 'Platform names must be treated as usage channels');
assert.ok(globalRules.includes('classic application-photo'), 'Executive routing must distinguish classic application-photo intent');

const guidedExecutive = intents.get('guided-executive-portrait');
assert.equal(guidedExecutive.recommendedService, 'Executive Portrait with visual direction');
assert.ok(guidedExecutive.processPromise.toLowerCase().includes('wardrobe'));
assert.ok(guidedExecutive.processPromise.toLowerCase().includes('posing experience'));

const leadershipSystem = intents.get('leadership-portrait-system');
for (const requirement of ['documented lighting standard', 'framing and crop standard', 'repeatability for future leaders']) {
  assert.ok(leadershipSystem.systemRequirements.includes(requirement), `Leadership system missing: ${requirement}`);
}

const corporateDay = intents.get('corporate-headshot-day');
assert.ok(corporateDay.signals.includes('100+ people'));
assert.ok(corporateDay.operationalPriority.includes('continuity for later additions'));

const personalBrand = intents.get('multi-context-personal-brand');
assert.equal(personalBrand.recommendedService, 'Brand Photography and strategic visual positioning');
assert.ok(personalBrand.distinguishFrom.includes('multiple contexts'));

const fineArt = intents.get('guided-fine-art');
for (const prohibited of ['therapy', 'healing', 'treatment', 'trauma recovery', 'crisis intervention']) {
  assert.ok(fineArt.prohibitedClaims.includes(prohibited), `Fine-art guardrail missing: ${prohibited}`);
}

const serialized = JSON.stringify(intentModel).toLowerCase();
assert.ok(!serialized.includes('customer email'), 'Intent model must not embed identifiable customer communications');

console.log('customer-intent-model: OK');
