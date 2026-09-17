import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageContracts = {
  'index.html': /Executive Portrait|Executive portr/i,
  'portrait/index.html': /Executive Portrait|Headshot/i,
  'lifestyle/index.html': /Brand Photography|Visual Positioning/i,
  'event-photography/index.html': /C-Level Event Photography/i,
  'glamour/index.html': /Fine Art[^<]*(Actor|Dance|Performer)/i,
  'hu/index.html': /Executive portr|brandfotózás/i,
  'hu/portre/index.html': /Executive portr|Headshot/i,
  'hu/brand/index.html': /Brandfotózás|vizuális/i,
  'hu/rendezvenyfotozas/index.html': /rendezvényfotózás/i,
  'hu/muveszi-fotografia/index.html': /Művészi[^<]*(színész|tánc|előadóművész)/i,
  'de-at/index.html': /Executive-Portr|Brandfotografie/i,
  'de-at/portrait/index.html': /Executive-Portr|Headshot/i,
  'de-at/brand/index.html': /Brandfotografie|visuelle/i,
  'de-at/eventfotografie/index.html': /Eventfotografie/i,
  'de-at/fine-art/index.html': /Fine Art[^<]*(Schauspieler|Tanz|Performer)/i
};

for (const [rel, expected] of Object.entries(pageContracts)) {
  const html = await readFile(rel, 'utf8');
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  assert.ok(title, rel + ' title missing');
  assert.match(title, expected, rel + ' current service-intent title drift');
  assert.match(html, /name=["']description["']/i, rel + ' meta description missing');
  assert.match(html, /property=["']og:description["']/i, rel + ' og description missing');
}

for (const rel of ['glamour/index.html','hu/muveszi-fotografia/index.html','de-at/fine-art/index.html']) {
  const html = await readFile(rel, 'utf8');
  assert.match(html, /actor|színész|Schauspiel/i, rel + ' actor intent missing');
  assert.match(html, /dance|tánc|Tanz/i, rel + ' dance intent missing');
  assert.match(html, /performer|előadóművész/i, rel + ' performer intent missing');
  assert.match(html, /application\/ld\+json/i, rel + ' schema missing');
}

const core = JSON.parse(await readFile('data/machine-core.json','utf8'));
const fine = core.serviceModel?.services?.find(s => s.id === 'fine-art');
assert.equal(fine?.serviceContext, 'fine-art', 'canonical Fine Art / Artists & Performers backend context drift');
assert.match(fine?.name || '', /Artists & Performers/i, 'canonical Artists & Performers service meaning missing');
for (const token of ['Actor headshot photography','Dance photography','Performing artist portfolio photography','Model portfolio photography']) {
  assert.ok(core.person?.specialisms?.includes(token), 'canonical specialism missing: ' + token);
}

const expectedPersonDescriptions={
  en:'Strategic visual partnership for leaders and organisations. Executive portraiture, brand photography and C-level event imagery designed as one coherent system that builds visual trust.',
  hu:'Stratégiai vizuális partnerség vezetőknek és szervezeteknek. Az executive portré, a brandfotózás és a C-level eseményfotózás egyetlen koherens rendszert alkot, amely vizuális bizalmat épít.',
  de:'Strategische visuelle Partnerschaft für Führungskräfte und Organisationen. Executive-Porträts, Brandfotografie und C-Level-Eventbilder bilden ein kohärentes System, das visuelles Vertrauen aufbaut.'
};
for (const rel of ['index.html','hu/index.html','de-at/index.html']) {
  const html=await readFile(rel,'utf8');
  const lang=rel.startsWith('hu/')?'hu':rel.startsWith('de-at/')?'de':'en';
  assert.ok(html.includes(JSON.stringify(expectedPersonDescriptions[lang]).slice(1,-1)), rel+' canonical executive-first Person description');
}

console.log('SEO/GEO/entity consistency stage59: current executive-first identity and Fine Art / Artists & Performers service family are aligned.');
