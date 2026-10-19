import assert from 'node:assert/strict';
import fs from 'node:fs';

const evidence = JSON.parse(fs.readFileSync('external-photography-evidence.json', 'utf8'));
const trust = JSON.parse(fs.readFileSync('service-trust-evidence.json', 'utf8'));
const id = 'facebook-magyar-nemzeti-muzeum-vetesszolos-20250930';
const url = 'https://www.facebook.com/share/p/1Cei4JkWjZ/?mibextid=wwXIfr';
const record = evidence.records.find((item) => item.id === id);
assert.ok(record, 'Museum event photo-credit record is missing');
assert.equal(record.url, url, 'Museum Facebook source URL drift');
assert.equal(record.publicationDate, '2025-09-30', 'Post date must remain the publication date');
assert.equal(record.eventDateStatus, 'Not stated in the screenshot; no event date inferred.');
assert.equal(record.evidenceStatus, 'owner-confirmed-screenshot-publication-credit');
assert.equal(record.screenshotEvidence?.fileName, 'IMG_6358.jpeg');
assert.equal(record.screenshotEvidence?.directPublicReadback, false);
assert.match(record.creditContext, /A fotókat Bánhalmi Norbert készítette/);
assert.match(record.interpretationRule, /Do not infer the event date, a testimonial, endorsement, recommendation, client contract, ongoing relationship, partnership, exclusivity or official-photographer status/i);
assert.ok(trust.services.event.externalEvidenceIds.includes(id), 'Museum credit must be attached to event service evidence');
assert.ok(!(trust.pendingEvidenceCandidates || []).some((item) => item.id === 'facebook-event-feedback-1ce4jkwjz'), 'Promoted screenshot-backed evidence must not remain an unbound candidate');
const pages = [
  ['event-photography/index.html', ['The screenshot of the Magyar Nemzeti Múzeum post dated 30 September 2025', 'Photos by Norbert Bánhalmi', 'The event date is not stated']],
  ['hu/rendezvenyfotozas/index.html', ['2025. szeptember 30-i Magyar Nemzeti Múzeum-bejegyzés', 'A fotókat Bánhalmi Norbert készítette', 'Az esemény dátuma nem szerepel rajta']],
  ['de-at/eventfotografie/index.html', ['Screenshot des Magyar-Nemzeti-Múzeum-Beitrags vom 30. September 2025', 'Die Fotos stammen von Norbert Bánhalmi', 'Das Datum des Ausflugs wird nicht genannt']]
];
for (const [path, ...requiredText] of pages) {
  const html = fs.readFileSync(path, 'utf8');
  assert.ok(html.includes(url), path + ': source URL missing from visible block / ItemList');
  for (const text of requiredText) assert.ok(html.includes(text), path + ': visible evidence text mismatch: ' + text);
  const marker = html.indexOf('data-banhalmi-event-proof="true"');
  assert.ok(marker >= 0, path + ': ItemList marker missing');
  const bodyStart = html.indexOf('>', marker) + 1;
  const bodyEnd = html.indexOf('</script>', bodyStart);
  assert.ok(bodyEnd > bodyStart, path + ': ItemList script is malformed');
  const itemList = JSON.parse(html.slice(bodyStart, bodyEnd));
  const item = itemList.itemListElement.find((entry) => entry.url === url);
  assert.ok(item, path + ': ItemList source missing');
  assert.equal(item.position, 6, path + ': ItemList position drift');
}
console.log('Museum event photo-credit evidence audit passed: screenshot provenance, publication date, guardrails, service binding, 3-language visible copy and ItemList parity.');
