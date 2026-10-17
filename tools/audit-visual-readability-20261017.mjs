import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('assets/css/site.css', 'utf8');
assert.match(css, /html body main :is\(p,li,dd\)\{[^}]*line-height:1\.8!important;/,
  'main body copy uses the approved 1.8 line rhythm');
assert.match(css, /html body main \.quote-deliverables-help \[data-retouch-included\][^{]*\{[^}]*font-weight:700/,
  'quote image inclusion is visually emphasized');
assert.match(css, /html body main \.cards-grid\{display:grid;/,
  'cards-grid has a real grid formatting context so its gap works');

for (const [file, alt] of [
  ['fine-art/index.html', 'A dancer leaps on an open beach beneath dramatic clouds.'],
  ['hu/muveszi-fotografia/index.html', 'Táncos mozdulat a tengerparton, drámai felhők alatt.'],
  ['de-at/fine-art/index.html', 'Eine Tänzerin springt am offenen Strand unter dramatischen Wolken.']
]) {
  const html = fs.readFileSync(file, 'utf8');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  assert.match(main, /<figure class="service-hero-image" data-service-hero-image="performer-portfolio">/,
    `${file}: photo-first hero image exists`);
  assert.ok(main.includes(`alt="${alt}"`), `${file}: hero image has localized, descriptive alt text`);
  assert.ok(main.includes('banhalmi-fine-art-study-15-horizontal-balanced-800w.webp'),
    `${file}: hero image uses the available responsive asset`);
}

for (const file of ['requestaquote/index.html', 'hu/ajanlatkeres/index.html', 'de-at/anfrage/index.html']) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /id="quote-deliverables-note"[^>]*role="note"/, `${file}: calculator has a compact live retouch guide`);
  assert.match(html, /data-retouch-included/, `${file}: included image count has a dedicated line`);
  assert.match(html, /data-retouch-extra/, `${file}: extra image pricing has a dedicated line`);
  assert.doesNotMatch(html, /id="quote-deliverables-note"[^>]*>[^<]{200,}/,
    `${file}: oversized all-category pricing paragraph has been removed`);
}
console.log('Visual readability contract PASS: 1.8 body rhythm, working card gaps, three Fine Art hero images and concise localized quote guidance.');
