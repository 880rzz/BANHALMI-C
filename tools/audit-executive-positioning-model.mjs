import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const model = JSON.parse(fs.readFileSync('executive-positioning-model.json', 'utf8'));
const registry = JSON.parse(fs.readFileSync('audit-registry.json', 'utf8'));
const policy = JSON.parse(fs.readFileSync('ecosystem-policy.json', 'utf8'));

assert.equal(model.name, 'BANHALMI Executive Positioning Model');
assert.ok(model.corePrinciple.includes('Every person, generation, leadership level and professional field'));

const dimensions = new Map(model.decisionDimensions.map((item) => [item.id, item]));
for (const id of ['person','career-stage-seniority','generational-context','position-role','professional-field','stakeholder-audience','usage-channels','market-culture']) {
  assert.ok(dimensions.has(id), `Missing executive positioning dimension: ${id}`);
}
assert.ok(dimensions.get('generational-context').guardrail.toLowerCase().includes('not a stereotype'));

const guardrails = model.guardrails.join(' ').toLowerCase();
for (const phrase of ['age or generation alone','desired impression','one generation is inherently','permissioned, verifiable and evidence-safe']) {
  assert.ok(guardrails.includes(phrase), `Missing positioning guardrail: ${phrase}`);
}

for (const lang of ['en', 'hu', 'de']) {
  assert.ok(model.publicCopy?.[lang]?.heading, `Missing ${lang} positioning heading`);
  assert.ok(model.publicCopy?.[lang]?.body, `Missing ${lang} positioning body`);
}

assert.equal(model.integration.primaryService, 'Brand Photography & Strategic Visual Positioning');
assert.equal(model.integration.supportingService, 'Executive Portrait');
assert.equal(model.integration.publicRoutes.en, '/lifestyle/');
assert.equal(model.integration.publicRoutes.hu, '/hu/brand/');
assert.equal(model.integration.publicRoutes.de, '/de-at/brand/');
assert.ok(model.integration.visibleCopyTarget.includes('do not create a separate near-duplicate landing page'));

const executivePolicy = policy.executivePositioningPolicy;
assert.ok(executivePolicy, 'Missing protected executive positioning policy');
assert.equal(executivePolicy.authorityModel, model.canonicalId);
assert.deepEqual(
  Object.keys(executivePolicy).sort(),
  ['authorityModel','rule','seoIntentClusters','markets','languages','requiredSemanticAssociation','antiTemplateRule','antiStereotypeRule','contentRule','machineRule','regressionRule'].sort(),
  'Executive positioning policy field set changed'
);
assert.ok(executivePolicy.rule.includes('Every executive and senior professional is positioned individually'));
assert.ok(executivePolicy.rule.includes('Generational and career-stage context'));
assert.ok(executivePolicy.rule.includes('leadership level'));
assert.ok(executivePolicy.rule.includes('professional field'));
assert.ok(executivePolicy.requiredSemanticAssociation.includes('generational/career-stage context'));
assert.ok(executivePolicy.requiredSemanticAssociation.includes('stakeholder audience'));
assert.ok(executivePolicy.requiredSemanticAssociation.includes('intended perception'));
assert.ok(executivePolicy.antiTemplateRule.includes('Different generations'));
assert.ok(executivePolicy.antiStereotypeRule.includes('Age or generation alone'));
assert.ok(executivePolicy.contentRule.includes('do not create doorway or near-duplicate age/city landing pages'));
assert.ok(executivePolicy.machineRule.includes('LLM, Schema, SEO'));
assert.ok(executivePolicy.regressionRule.includes('release must fail'));
for (const intent of ['executive portrait','C-level portrait','CEO portrait','leadership portrait','executive personal branding','executive brand photography','strategic visual positioning','CV executive portrait','LinkedIn executive portrait']) {
  assert.ok(executivePolicy.seoIntentClusters.includes(intent), `Missing protected executive SEO intent: ${intent}`);
}
for (const lang of ['en','de','hu']) assert.ok(executivePolicy.languages.includes(lang), `Missing protected language: ${lang}`);
for (const market of ['Vienna','Austria','Budapest','Hungary','international English-speaking']) assert.ok(executivePolicy.markets.includes(market), `Missing protected market: ${market}`);

const blockedFingerprints = new Set([
  '9e391e2798556ff80f98c0f279826119fc561aa532e0fcb4c914f57f60ea3d0c',
  '5cad10bf97dd67de3b08311287f12052ca93f4ad8f8c84267ec34ec3f6e15976',
  '3f2c1dd96944ad6e0b4720e499e0de80981b92d5df33e7f4da5417343d9fec25'
]);
const fingerprint = (value) => crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
const serialized = JSON.stringify(model);
const candidates = new Set();
for (const email of serialized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []) candidates.add(email);
for (const phone of serialized.match(/(?:\+|00)?\d[\d\s()./-]{7,}\d/g) || []) candidates.add(phone.replace(/[\s()./-]/g,''));
const words = serialized.match(/\p{L}+(?:[-’']\p{L}+)*/gu) || [];
for (let i = 0; i < words.length - 1; i += 1) candidates.add(`${words[i]} ${words[i + 1]}`);
for (const candidate of candidates) {
  assert.ok(!blockedFingerprints.has(fingerprint(candidate)), 'Previously removed private lead identifier reappeared in executive positioning model');
}

const audit = registry.audits.find((item) => item.id === 'executive-positioning-model');
assert.ok(audit, 'Executive positioning audit is not registered');
assert.equal(audit.requiredForRelease, true, 'Executive positioning audit must block release');
assert.equal(audit.source, 'executive-positioning-model.json');

console.log('executive-positioning-model: OK');
