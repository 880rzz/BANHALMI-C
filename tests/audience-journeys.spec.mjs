import { test, expect } from '@playwright/test';
import fs from 'node:fs';
fs.mkdirSync('artifacts/audience-journeys',{recursive:true});
const locales=[
 {home:'/',portrait:'/portrait/',art:'/fine-art/',quote:'/requestaquote/',hu:false},
 {home:'/hu/',portrait:'/hu/portre/',art:'/hu/muveszi-fotografia/',quote:'/hu/ajanlatkeres/',hu:true},
 {home:'/de-at/',portrait:'/de-at/portrait/',art:'/de-at/fine-art/',quote:'/de-at/anfrage/',hu:false}
];
const ready=async page=>{await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1);};
for(const d of locales){
 test(d.home+' everyday entry is visible, keyboard-usable and lands on portrait prices',async({page})=>{
  await page.goto(d.home);
  const entry=page.locator('[data-persona-path="everyday-portrait"]');await expect(entry).toBeVisible();
  await entry.focus();await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(d.portrait+'#portrait-options$'));
  await expect(page.locator('#portrait-options')).toBeVisible();
  await page.locator('[data-portrait-cv-entry]').click();await ready(page);
  await expect(page.locator('[name="individual_mode"][value="headshotcv"]')).toBeChecked();
  expect(await page.evaluate(()=>BANHALMI_QUOTE.calculate(document.querySelector('[data-smart-quote]')).gross)).toBe(120);
 });
 test(d.art+' professional and personal purpose come before personal imagery',async({page})=>{
  await page.goto(d.art);
  await expect(page.locator('.cookie')).toHaveClass(/show/);
  await page.locator('.cookie [data-decline]').click();
  await expect(page.locator('.cookie')).not.toHaveClass(/show/);
  for(const width of [375,390,621,768,1024,1180,1280,1440,1600,1920,2560,3840]){
   await page.setViewportSize({width,height:900});
   const positions=await page.evaluate(()=>{
    const y=s=>document.querySelector(s).getBoundingClientRect().top+scrollY;
    return [y('#artist-packages-guide'),y('#professional-portfolio'),y('#personal-fine-art'),y('#personal-fine-art figure'),document.documentElement.scrollWidth,innerWidth];
   });
   expect(positions[0]).toBeLessThan(positions[1]);expect(positions[1]).toBeLessThan(positions[2]);expect(positions[2]).toBeLessThan(positions[3]);expect(positions[4]).toBeLessThanOrEqual(positions[5]+1);
   await expect(page.locator('[data-art-purpose="professional"]')).toBeVisible();await expect(page.locator('[data-art-purpose="personal"]')).toBeVisible();
   if(width===390||width===1440)await page.locator('#artist-packages-guide').screenshot({path:'artifacts/audience-journeys/'+d.home.replaceAll('/','_')+'-'+width+'.png'});
  }
 });
 for(const [purpose,value] of [['professional','performer'],['personal','artportrait']])test(d.art+' '+purpose+' quote preserves purpose across languages',async({page})=>{
  await page.goto(d.art);await page.locator('[data-art-quote="'+purpose+'"]').click();await ready(page);
  await expect(page.locator('[name="category"][value="art"]')).toBeChecked();
  await expect(page.locator('[name="art_type"][value="'+value+'"]')).toBeChecked();
  expect(await page.evaluate(()=>BANHALMI_QUOTE.calculate(document.querySelector('[data-smart-quote]')).gross)).toBe(690);
  for(const link of await page.locator('.lang-switch a[hreflang]').all())await expect(link).toHaveAttribute('href',new RegExp('art_type='+value));
  await page.locator('[name="art_type"][value="dance"]').check();await expect(page).toHaveURL(/art_type=dance/);
  await page.locator('[name="category"][value="brand"]').check();await expect(page).not.toHaveURL(/art_type=/);
  for(const link of await page.locator('.lang-switch a[hreflang]').all())await expect(link).not.toHaveAttribute('href',/art_type=/);
 });
 test(d.quote+' guided portrait selection is explicit and invalid values cannot select another scope',async({page})=>{
  await page.goto(d.quote+'?service=portrait&portrait_mode=guided60');await ready(page);
  await expect(page.locator('[name="individual_mode"][value="guided60"]')).toBeChecked();
  expect(await page.evaluate(()=>BANHALMI_QUOTE.calculate(document.querySelector('[data-smart-quote]')).gross)).toBe(420);
  await page.goto(d.quote+'?service=fine-art&art_type=invalid&portrait_mode=guided120');await ready(page);
  await expect(page.locator('[name="art_type"][value="actor"]')).toBeChecked();
  await expect(page.locator('[name="category"][value="art"]')).toBeChecked();
  expect(await page.evaluate(()=>BANHALMI_QUOTE.calculate(document.querySelector('[data-smart-quote]')).gross)).toBe(690);
 });
}
