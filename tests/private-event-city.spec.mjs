import {test,expect} from '@playwright/test';
const routes=['/requestaquote/','/hu/ajanlatkeres/','/de-at/anfrage/'];
const estimate=page=>page.evaluate(()=>window.BANHALMI_QUOTE.calculate(document.querySelector('[data-smart-quote]')));
async function privateVenue(page,path){
 await page.goto(path+'?service=private-event');
 const form=page.locator('[data-smart-quote]');
 await expect(form).toHaveAttribute('data-pricing-ready','true');
 await expect(form.locator('[data-private-event="true"]')).toBeChecked();
 await form.locator('[name="event_duration"][value="event120"]').check();
 await form.locator('[name="location"]').selectOption('custom');
 await form.locator('[name="specific_location"]').fill('QA example venue - no real booking');
 await form.locator('[name="private_event_city"]').selectOption('vienna');
 await expect(form.locator('[data-private-event-guide]')).toBeVisible();
 await expect(form.locator('[data-corporate-event-guide]')).toBeHidden();
 return form;
}
for(const path of routes){
 test(path+' private venue uses city travel, not studio identity or a global fee override',async({page})=>{
  const form=await privateVenue(page,path);
  let e=await estimate(page);
  expect(e).toMatchObject({gross:590,cityTravelIncluded:true,travelGross:0,canonicalPackageCode:'privateEvent120',serviceContext:'private-event',pricingSource:'private-event-pricing.json'});
  expect(e.displayGross).toBe(path.startsWith('/hu/')?236000:590);
  await expect(form.locator('[name="location"]')).toHaveValue('custom');
  await form.locator('[name="private_event_city"]').selectOption('budapest');
  expect(await estimate(page)).toMatchObject({gross:590,travelCountry:'HU',privateEventCity:'budapest',cityTravelIncluded:true});
  for(const [code,gross] of [['event60',390],['event120',590],['event180',790],['event240',990]]){
   await form.locator('[name="event_duration"][value="'+code+'"]').check();
   await form.locator('[name="retouched_images"]').fill('40');
   expect((await estimate(page)).gross).toBe(gross);
   await expect(form.locator('[name="event_duration"][value="'+code+'"]')).toBeChecked();
  }
  await form.locator('[name="event_duration"][value="event120"]').check();
  await form.locator('[name="private_event_city"]').selectOption('outside');
  await form.locator('[name="travel_country"]').selectOption('AT');
  expect(await estimate(page)).toMatchObject({gross:830,cityTravelIncluded:false,travelGross:240});
  await form.locator('[name="travel_country"]').selectOption('OTHER');
  expect(await estimate(page)).toMatchObject({gross:590,customTravel:true,cityTravelIncluded:false});
 });
 test(path+' validates city-country agreement and preserves corporate fees after switching',async({page})=>{
  const form=await privateVenue(page,path);
  await form.locator('[name="date_coordination_requested"]').check();
  expect(await page.evaluate(()=>window.BANHALMI_QUOTE.validate(document.querySelector('[data-smart-quote]'),false))).toBe(true);
  await form.locator('[name="travel_country"]').selectOption('HU');
  expect((await estimate(page)).cityTravelIncluded).toBe(false);
  expect(await page.evaluate(()=>window.BANHALMI_QUOTE.validate(document.querySelector('[data-smart-quote]'),false))).toBe(false);
  await form.locator('[name="private_event_city"]').selectOption('');
  expect(await page.evaluate(()=>window.BANHALMI_QUOTE.validate(document.querySelector('[data-smart-quote]'),false))).toBe(false);
  await form.locator('[name="category"][value="event"]:not([data-private-event])').check();
  await form.locator('[name="event_duration"][value="event120"]').check();
  await form.locator('[name="travel_country"]').selectOption('AT');
  expect(await estimate(page)).toMatchObject({gross:1130,cityTravelIncluded:false,travelGross:240,serviceContext:'event'});
  expect(await page.evaluate(()=>window.BANHALMI_QUOTE.pricesGross.event120)).toBe(890);
  await expect(form.locator('[data-private-event-guide]')).toBeHidden();
  await expect(form.locator('[data-corporate-event-guide]')).toBeVisible();
  await expect(form.locator('[name="private_event_city"]')).toBeDisabled();
  await form.locator('[name="event_duration"][value="eventBusiness"]').check();
  expect((await estimate(page)).gross).toBe(730);
  await form.locator('[for="category-event-private"] strong').click();
  await expect(form.locator('[data-private-event="true"]')).toBeChecked();
  await form.locator('[name="event_duration"][value="event120"]').check();
  await form.locator('[name="private_event_city"]').selectOption('vienna');
  expect((await estimate(page)).gross).toBe(590);
 });
 test(path+' private quote PDF and intercepted submission use the same identity and amounts',async({page},testInfo)=>{
  const form=await privateVenue(page,path);
  await form.locator('[name="name"]').fill('Automated QA - not a booking');
  await form.locator('[name="email"]').fill('qa@example.com');
  await form.locator('[name="customer_type"]').selectOption('private');
  await form.locator('[name="billing_country"]').selectOption('AT');
  await form.locator('[name="message"]').fill('Isolated regression test. No real submission.');
  await form.locator('[name="date_coordination_requested"]').check();
  await form.locator('[name="privacy_acknowledged"]').check();
  await page.evaluate(()=>{
   window.__qaCanvasText=[];
   const original=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__qaCanvasText.push(String(text));return original.call(this,text,...args);};
  });
  const before=await estimate(page);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-download-quote-pdf]').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  await download.saveAs(testInfo.outputPath('private-city-quote.pdf'));
  const text=await page.evaluate(()=>window.__qaCanvasText.join('\n'));
  const name=await page.evaluate(()=>{const d=window.BANHALMI_PRIVATE_EVENT_PRICING;const l=document.documentElement.lang;return d.name[l.startsWith('hu')?'hu':l.startsWith('de')?'de-AT':'en'];});
  expect(text.replace(/\s+/g,' ')).toContain(name.replace(/\s+/g,' '));
  expect(text).toContain(path.startsWith('/hu/')?'236': '590');
  let payload;
  await page.route('**/*',async route=>{
   if(route.request().method()==='POST'){
    payload=route.request().postDataJSON();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,submissionId:'LOCAL-QA-NO-EMAIL'})});
   }else await route.continue();
  });
  await form.locator('[type="submit"]').click();
  await expect.poll(()=>payload?.serviceContext).toBe('private-event');
  expect(payload.canonicalPackageCode).toBe('privateEvent120');
  expect(payload.packageCode).toBe('event120');
  expect(payload.category).toBe(name);
  expect(payload.cityTravelIncluded).toBe(true);
  expect(payload.privateEventCity).toBe('vienna');
  expect(payload.travelPricingStatus).toBe('city-included');
  expect(Number(payload.travelGrossAmount)).toBe(0);
  expect(Number(payload.grossAmount)).toBe(before.gross);
  expect(Number(payload.displayGrossAmount)).toBe(before.displayGross);
  expect(Number(payload.netAmount)+Number(payload.vatAmount)).toBeCloseTo(before.gross,2);
  await expect(form.locator('[name="name"]')).toHaveValue('Automated QA - not a booking');
 });
}
