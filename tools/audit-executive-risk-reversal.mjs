import fs from 'node:fs';
import assert from 'node:assert/strict';

const model = JSON.parse(fs.readFileSync('executive-risk-reversal.json', 'utf8'));

assert.equal(model.name, 'BANHALMI Executive Portrait Risk-Reversal Framework');
assert.equal(model.positioningModel, 'https://www.norbertbanhalmi.com/executive-positioning-model.json');
assert.ok(model.scope.includes('Executive Portrait'));
assert.ok(model.scope.includes('C-Level CV and LinkedIn portrait'));
assert.equal(model.proofOfConcept.defaultAvailability, 'selective, qualification-based; not an automatic public entitlement');

assert.equal(model.observedIntentPattern.classification, 'anonymized lead-pattern evidence');
assert.equal(
  model.observedIntentPattern.privacyRule,
  'Never publish or encode identifiable lead names, email addresses, phone numbers or private correspondence in this framework.'
);
assert.equal(
  model.proofOfConcept.commercialRule,
  'The regular recommended service and price must remain explicit. The Proof of Concept reduces outcome uncertainty; it does not redefine the regular service as free.'
);
assert.equal(
  model.proofOfConcept.costGuardrail,
  'Any third-party, travel, location, styling, makeup, rental, rush or production costs must be explicitly excluded from a no-fee promise unless BANHALMI deliberately includes them in writing.'
);
assert.equal(
  model.proofOfConcept.usageGuardrail,
  'Image delivery, retouching, licensing and usage rights from an unconverted Proof of Concept are not assumed. They must be explicitly stated in the written offer/terms.'
);
assert.equal(
  model.proofOfConcept.abuseGuardrail,
  'Do not repeatedly offer free Proofs of Concept to the same prospect or use them as a blanket discount mechanism.'
);
assert.equal(
  model.proofOfConcept.evidenceGuardrail,
  'Never manufacture age-, role- or demographic-matched references. Public references must be permissioned/verifiable and relationship classification must remain accurate.'
);

const expectedProhibitedClaims = [
  'guaranteed job outcome',
  'guaranteed LinkedIn performance',
  'guaranteed promotion',
  'guaranteed business result',
  'unlimited free shooting',
  'private-client work presented as public reference without permission'
];
assert.deepEqual([...model.prohibitedClaims].sort(), [...expectedProhibitedClaims].sort());

assert.deepEqual(
  Object.keys(model.observedIntentPattern).sort(),
  ['classification', 'signals', 'interpretation', 'privacyRule'].sort(),
  'Observed intent pattern must remain anonymized and limited to approved aggregate fields'
);

assert.ok(model.measurement.includes('Proof-of-Concept-to-paid-session conversion'));
assert.ok(model.measurement.includes('average order value'));

console.log('executive-risk-reversal: OK');
