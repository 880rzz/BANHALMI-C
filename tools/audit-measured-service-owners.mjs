import fs from 'node:fs';
import assert from 'node:assert/strict';
const routing=JSON.parse(fs.readFileSync('service-owner-routing.json','utf8'));
assert.deepEqual(routing.measurementWindow,['2026-09-15','2026-10-12']);
assert.match(routing.rules.method,/never.*redirect/i);
const read=p=>fs.readFileSync(p,'utf8');
const clean=s=>s.replace(/<[^>]+>/g,'').replaceAll('&amp;','&');
for(const [locale,home] of [['en','index.html'],['hu','hu/index.html'],['de','de-at/index.html']]){
 const html=read(home);
 const links=html.match(/<p class="eyebrow" data-service-owner-links="20261015">([\s\S]*?)<\/p>/)?.[1];
 assert.ok(links,`${home}: early service links missing`);
 assert.equal((links.match(/<a\b/g)||[]).length,4);
 assert.ok(clean(links).length<=100,`${home}: service navigator must remain a compact eyebrow, not tracked prose`);
 for(const owner of routing.owners){
  const route=owner.routes[locale];assert.ok(links.includes(`href="${route}"`),`${home}: missing ${owner.service}`);
  const target=read(route.slice(1)+'index.html');
  assert.ok(target.includes(`href="https://www.norbertbanhalmi.com${route}" rel="canonical"`));
  const scripts=[...target.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
  if(owner.service==='portrait'||owner.service==='brand'){
   const heading=clean(target.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1]);
   const web=scripts.find(x=>x['@type']==='WebPage');assert.equal(web.headline,heading,`${route}: headline mismatch`);
   if(owner.service==='portrait'){
    const approved={en:'The image that reveals who you are.',hu:'A kép, amely megmutatja, ki Ön.',de:'Das Bild, das zeigt, wer Sie sind.'};
    assert.equal(heading,approved[locale],`${route}: approved portrait H1 must be preserved`);
    assert.match(target.match(/<title>([\\s\\S]*?)<\\/title>/)?.[1]||'',/portr|headshot/i,`${route}: portrait intent must remain in title`);
   }else assert.match(heading,/brand/i);
  }
  if(owner.service!=='event'){
   const service=scripts.find(x=>x['@type']==='Service');assert.ok(service.alternateName.length>=3,`${route}: localized aliases missing`);
  }
 }
}
assert.ok(read('llms.txt').includes('https://www.norbertbanhalmi.com/service-owner-routing.json'));
console.log('Measured service-owner audit PASS: localized early links, live targets, self-canonicals, six explicit H1/headline pairs and nine Service alias sets.');
