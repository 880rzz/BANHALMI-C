import fs from 'node:fs';
import assert from 'node:assert/strict';

const gallery = JSON.parse(fs.readFileSync('official-event-gallery.json', 'utf8'));
const registry = JSON.parse(fs.readFileSync('audit-registry.json', 'utf8'));
const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));

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

assert.ok(fs.existsSync('official-event-gallery.json'), 'Official event gallery source contract missing from deployable repository root');
assert.equal(vercel?.git?.deploymentEnabled, true, 'Official event gallery requires repository-root Git deployment to remain enabled');

const redirects = Array.isArray(vercel.redirects) ? vercel.redirects : [];
const galleryHijack = redirects.find((rule) => rule?.source === '/official-event-gallery.json');
assert.ok(!galleryHijack, 'Vercel routing must not redirect the canonical official-event-gallery.json contract away from the professional domain');

console.log('official-event-gallery: OK');
