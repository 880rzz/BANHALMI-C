import fs from 'node:fs';
import assert from 'node:assert/strict';

// Static five-second clarity contract: guarantees a short, concrete answer to
// what BANHALMI offers, for whom, where and how to take the next step.
// This is a content/IA safeguard, not a substitute for user comprehension tests.
const variants = [
  {
    file: 'index.html', quote: '/requestaquote/',
    service: [/executive portraits/i, /headshots/i, /event photography/i],
    location: [/vienna/i, /budapest/i], audience: /leaders/i
  },
  {
    file: 'hu/index.html', quote: '/hu/ajanlatkeres/',
    service: [/vezetői portré/i, /headshot/i, /rendezvényfotózás/i],
    location: [/bécsben/i, /budapesten/i], audience: /vezetőknek/i
  },
  {
    file: 'de-at/index.html', quote: '/de-at/anfrage/',
    service: [/executive-porträts/i, /business-headshots/i, /eventfotografie/i],
    location: [/wien/i, /budapest/i], audience: /führungskräfte/i
  }
];
for (const {file, quote, service, location, audience} of variants) {
  const html = fs.readFileSync(file, 'utf8');
  const hero = html.match(/<section class="hero hero-copy-only\b[\s\S]*?<\/section>/i)?.[0];
  assert.ok(hero, file + ': homepage copy hero missing');
  const paragraphs = hero.match(/<\/h1>\s*<p>([^<]+)<\/p>\s*<p>([^<]+)<\/p>/i);
  assert.ok(paragraphs, file + ': purpose and value must follow H1 directly');
  const [purpose, value] = [paragraphs[1].trim(), paragraphs[2].trim()];
  assert.ok(purpose.length <= 200, file + ': first visible explanation is too long');
  assert.ok(value.length <= 210, file + ': second explanation is too long');
  for (const pattern of [...service, ...location, audience]) {
    assert.match(purpose, pattern, file + ': missing direct offer, audience or location');
  }
  const serviceRow = hero.match(/<p class="eyebrow" data-service-owner-links[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  assert.ok(serviceRow, file + ': service choices must appear before heading');
  assert.ok((serviceRow.match(/<a\s/g) || []).length >= 4, file + ': four services must be directly discoverable');
  assert.ok(hero.includes('href="' + quote + '"'), file + ': quote action missing');
  assert.equal((hero.match(/class="btn btn-primary"/g) || []).length, 1, file + ': one primary action required');
  console.log('Five-second homepage clarity PASS: ' + file + ' (' + purpose.length + ' / ' + value.length + ' characters)');
}
