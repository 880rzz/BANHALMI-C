import fs from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');
const copy=JSON.parse(read('tools/content/audience-journeys-20261006.json'));
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#x27;');
for(const [lang,d] of Object.entries(copy)){
 const h=read(d.home),portrait=read(d.portrait),art=read(d.fine),quote=read(d.quote.slice(1)+'index.html');
 assert.equal((h.match(/data-persona-path="everyday-portrait"/g)||[]).length,1,lang+' everyday entry exists exactly once');
 assert.ok(h.includes('/'+d.portrait.replace('index.html','')+'#portrait-options'),lang+' everyday entry reaches the visible price selector');
 assert.ok(portrait.includes('id="portrait-options"')&&portrait.includes(esc(d.portraitLead)),lang+' non-executive meaning is visible');
 assert.ok(portrait.includes('?service=portrait&amp;portrait_mode=headshotcv'),lang+' explicit CV link selects CV, not executive pricing');
 const guide=art.indexOf('id="artist-packages-guide"'),professional=art.indexOf('id="professional-portfolio"'),personal=art.indexOf('id="personal-fine-art"'),image=art.indexOf('<figure class="service-hero-image');
 assert.ok(guide>0&&guide<professional&&professional<personal&&personal<image,lang+' visible purpose and portfolio come before private/body imagery');
 assert.equal((art.match(/id="artist-packages-guide"/g)||[]).length,1,lang+' existing guide moved, not copied');
 assert.ok(art.includes(esc(d.personalIntro)),lang+' personal fine art does not imply nudity');
 assert.ok(art.includes(esc(d.artistChoiceLead)),lang+' purpose lead uses consistent formal language');
 assert.ok(art.indexOf('data-professional-package-inclusions')<art.indexOf('<article class="card">',professional),lang+' image inclusions precede duration package choices');
 assert.ok(art.includes(esc(d.professionalIncluded)),lang+' total included images, extras and estimate status are visible');
 for(const [purpose,type] of [['professional','performer'],['personal','artportrait']])assert.ok(art.includes('data-art-quote="'+purpose+'" href="'+d.quote+'?service=fine-art&amp;art_type='+type+'"'),lang+' '+purpose+' handoff');
 assert.ok(quote.includes('/assets/js/quote-calculator.js?v=20261006-audience-v3'),lang+' revised calculator is cache-safe');
}
for(const [file,key] of [['customer-intent-model.json','intents'],['customer-needs.json','needs']]){
 const d=JSON.parse(read(file));assert.ok(d[key].some(i=>i.id==='everyday-personal-portrait'));
 for(const item of d[key])for(const [lang,url] of Object.entries(item.visibleEntryPoints||{})){
  const u=new URL(url);assert.equal(u.origin,'https://www.norbertbanhalmi.com');
  const text=read(u.pathname.slice(1)+'index.html');assert.ok(text.includes('id="'+u.hash.slice(1)+'"'),file+' '+item.id+' has a real '+lang+' destination');
 }
}
const needs=JSON.parse(read('customer-needs.json')).needs;
assert.ok(!needs.find(n=>n.id==='fast-cv-linkedin-headshot').routingRule.includes('30-minute executive'));
const p=JSON.parse(read('pricing.json'));
assert.deepEqual(p.services.find(s=>s.id==='fine-art').packages.map(s=>s.grossEUR),[690,990,1290]);
assert.equal(p.services.find(s=>s.id==='fine-art').includedRetouchedImages,2);
assert.equal(p.services.find(s=>s.id==='fine-art').extraRetouchedImageGrossEUR,45);
const runtime=read('assets/js/quote-calculator.js');
for(const token of ['applyAudienceSelection','syncAudienceSelectionUrl','portrait_mode','art_type'])assert.ok(runtime.includes(token));
console.log('Audience journey contract PASS: three-language visible paths, optional nude boundary, package inclusion, real machine anchors and allowlisted quote handoff.');
