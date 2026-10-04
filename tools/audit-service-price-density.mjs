import fs from 'node:fs';
import assert from 'node:assert/strict';

const pages = [
  'portrait/index.html', 'lifestyle/index.html', 'event-photography/index.html', 'fine-art/index.html',
  'hu/portre/index.html', 'hu/brand/index.html', 'hu/rendezvenyfotozas/index.html', 'hu/muveszi-fotografia/index.html',
  'de-at/portrait/index.html', 'de-at/brand/index.html', 'de-at/eventfotografie/index.html', 'de-at/fine-art/index.html',
];

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8364;|&euro;/gi, '€');
  const matches = visible.match(/€\s?\d[\d., ]*|\d[\d., ]*\s?(?:Ft|HUF)/g) || [];
  const normalized = matches.map(value => value.replace(/\s+/g, ' ').trim());
  const counts = new Map();
  for (const value of normalized) counts.set(value, (counts.get(value) || 0) + 1);
  for (const [value, count] of counts) {
    assert.equal(count, 1, `${file}: visible price repeated ${count} times: ${value}`);
  }
  assert.ok(counts.size > 0, `${file}: no visible reference prices found`);
}

console.log(`Service price density audit passed for ${pages.length} HU/EN/DE pages.`);
