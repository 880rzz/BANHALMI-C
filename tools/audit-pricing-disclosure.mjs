import fs from 'node:fs';
import assert from 'node:assert/strict';
export const serviceRoutes=['portrait','lifestyle','event-photography','fine-art','hu/portre','hu/brand','hu/rendezvenyfotozas','hu/muveszi-fotografia','de-at/portrait','de-at/brand','de-at/eventfotografie','de-at/fine-art'];
export const quoteRoutes=['requestaquote','hu/ajanlatkeres','de-at/anfrage'];
for(const route of [...serviceRoutes,...quoteRoutes]){
 const html=fs.readFileSync(`${route}/index.html`,'utf8');
 const match=html.match(/<details\b[^>]*data-pricing-disclosure="(?:service|comparison)"[^>]*>[\s\S]*?<\/details>/);
 assert.ok(match,`${route}: missing pricing disclosure`);
 assert.ok(!/\bopen(?:\s|=|>)/.test(match[0].split('>')[0]+'>'),`${route}: pricing must start closed`);
 const summary=match[0].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)?.[1];
 assert.ok(summary && !/€|\bFt\b|\bHUF\b/.test(summary),`${route}: summary must introduce options without a price anchor`);
 assert.ok(/€|\bFt\b/.test(match[0]),`${route}: preserve prices in source HTML`);
 if(serviceRoutes.includes(route)){
  const priceBlocks=[...html.matchAll(/<div class="(?:service-price-examples|executive-investment-note)"/g)];
  assert.ok(priceBlocks.length>0);
  for(const block of priceBlocks)assert.ok(block.index>match.index && block.index<match.index+match[0].length,`${route}: prices escaped disclosure`);
  const main=html.indexOf('<main id="main">');
  const heroEnd=html.indexOf('</section>',main)+'</section>'.length;
  assert.ok(main>=0 && heroEnd>main,`${route}: service hero must exist`);
  const immediateAfterHero=html.slice(heroEnd,match.index);
  assert.match(immediateAfterHero,/^\s*<section class="service-pricing-section"[^>]*>\s*<div class="wrap">\s*$/,`${route}: closed pricing must immediately follow hero`);
  assert.ok(match.index>heroEnd,`${route}: pricing cannot interrupt hero`);
  assert.equal((html.match(/data-pricing-disclosure="service"/g)||[]).length,1,`${route}: only one service pricing disclosure allowed`);
 }else{
  assert.ok(html.indexOf('</form>')<match.index,`${route}: show the service form before detailed comparison`);
  for(const marker of ['data-smart-quote','data-estimate-gross','data-download-quote-pdf'])assert.ok(html.includes(marker));
 }
 for(const script of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(script[1]);
}
console.log('Pricing disclosure audit passed: 15 localized pages, closed native panels, pricing immediately below hero, retained calculator and JSON-LD.');
