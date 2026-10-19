import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('tools/content/professional-journeys-20261018.json', 'utf8'));
for (const [locale, data] of Object.entries(manifest.locales)) {
  const html = fs.readFileSync(data.home, 'utf8');
  const grid = html.match(/<div class="fp-decision-grid">([\s\S]*?)<\/div>/)?.[1];
  assert.ok(grid, `${locale}: primary decision area`);
  assert.equal((grid.match(/data-service-path=/g) || []).length, 4, `${locale}: four primary decisions`);
  for (const service of data.services) {
    assert.ok(grid.includes(`data-service-path="${service.id}"`));
    assert.ok(grid.includes(`href="${service.url}"`));
  }
  for (const id of ['everyday-portrait', 'organizer']) {
    assert.equal((html.match(new RegExp(`data-persona-path="${id}"`, 'g')) || []).length, 1);
    assert.ok(!grid.includes(`data-persona-path="${id}"`), `${locale}: secondary intent is not a competing service`);
  }
  const hero = html.match(/<section class="hero hero-copy-only\b[\s\S]*?<\/section>/)?.[0];
  assert.ok(hero.includes(`class="btn btn-primary" href="${data.mainEnquiry}"`), `${locale}: simple enquiry is the primary action`);
  const [pageRoute, anchor] = data.mainEnquiry.split('#');
  assert.ok(fs.readFileSync(pageRoute.slice(1)+'index.html','utf8').includes(`id="${anchor}"`), `${locale}: enquiry anchor actually exists`);
  assert.equal((hero.match(/class="btn btn-primary"/g) || []).length, 1);
}
console.log('Professional journeys passed: four primary services, retained secondary routes and one simple-enquiry hero action in HU/EN/DE.');
