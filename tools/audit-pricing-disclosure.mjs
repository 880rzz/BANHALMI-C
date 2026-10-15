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
  const cta=html.indexOf('id="next-step"')>=0?html.indexOf('id="next-step"'):html.indexOf('data-art-purpose="personal"');
  assert.ok(cta>=0 && cta<match.index,`${route}: value and contact CTA precede prices`);
 }else{
  assert.ok(html.indexOf('</form>')<match.index,`${route}: show the service form before detailed comparison`);
  for(const marker of ['data-smart-quote','data-estimate-gross','data-download-quote-pdf'])assert.ok(html.includes(marker));
 }
 for(const script of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g))JSON.parse(script[1]);
}
console.log('Pricing disclosure audit passed: 15 localized pages, closed native panels, value/CTA before prices, retained calculator and JSON-LD.');
