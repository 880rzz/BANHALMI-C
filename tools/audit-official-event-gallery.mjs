import fs from 'node:fs';
import assert from 'node:assert/strict';

const gallery = JSON.parse(fs.readFileSync('official-event-gallery.json', 'utf8'));
const registry = JSON.parse(fs.readFileSync('audit-registry.json', 'utf8'));
const integrityWorkflow = fs.readFileSync('.github/workflows/official-event-gallery-integrity.yml', 'utf8');
const pagesWorkflow = fs.readFileSync('.github/workflows/pages.yml', 'utf8');

assert.equal(gallery.name, 'BANHALMI Photography × VIPACH Official Event Gallery');
assert.equal(gallery.url, 'https://www.flickr.com/people/vipach/');
assert.equal(gallery.relationshipType, 'official shared event and community photography gallery');
assert.equal(gallery.professionalPhotography.brand, 'BANHALMI');
assert.equal(gallery.professionalPhotography.alternateName, 'BANHALMI Photography');
assert.equal(gallery.professionalPhotography.teamDescriptor, 'Photography Team');
assert.equal(gallery.community.name, 'Vienna Photo Art & Creative Hub – VIPACH');

const serialized = JSON.stringify(gallery).toLowerCase();
for (const required of [
  'not a layer-1 canonical banhalmi property',
  'does not prove a client contract',
  'do not infer that bánhalmi norbert personally created every image',
  'not a separate organization',
  'do not make flickr an art canonical archive',
  'no automatic propagation without a direct, verified relationship'
]) {
  assert.ok(serialized.includes(required), `Official event gallery missing guardrail: ${required}`);
}

assert.equal(gallery.canonicalBoundaries.professionalAuthority, 'https://www.norbertbanhalmi.com/');
assert.equal(gallery.canonicalBoundaries.artisticAuthority, 'https://www.banhalmi.art/');
assert.equal(gallery.canonicalBoundaries.editorialAuthority, 'https://blog.banhalmi.art/');
assert.equal(gallery.canonicalBoundaries.communityAuthority, 'https://www.vipach.at/');

const audit = registry.audits.find((item) => item.id === 'official-event-gallery');
assert.ok(audit, 'Official event gallery audit is not registered');
assert.equal(audit.requiredForRelease, true, 'Official event gallery audit must block release');
assert.equal(audit.source, 'official-event-gallery.json');

// Drift protection: Pages starts from an immutable git archive of HEAD, so root-level
// evidence contracts are carried into _site unless a later build step explicitly removes them.
assert.ok(
  pagesWorkflow.includes('git archive --format=tar HEAD'),
  'Pages build no longer starts from the immutable repository archive.'
);
assert.ok(
  !pagesWorkflow.includes('rm -f _site/official-event-gallery.json'),
  'Pages build explicitly removes official-event-gallery.json.'
);
assert.ok(
  integrityWorkflow.includes('permissions:\n  contents: read'),
  'Official gallery integrity workflow must remain read-only.'
);
assert.ok(
  integrityWorkflow.includes('https://www.norbertbanhalmi.com/official-event-gallery.json'),
  'Official gallery integrity workflow does not verify the live canonical contract.'
);
assert.ok(
  integrityWorkflow.includes('https://www.flickr.com/people/vipach/'),
  'Official gallery integrity workflow does not protect the Flickr profile URL.'
);

console.log('official-event-gallery: OK');
