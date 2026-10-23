import {test,expect} from '@playwright/test';
const locales=[['/','/portrait/','/lifestyle/'],['/hu/','/hu/portre/','/hu/brand/'],['/de-at/','/de-at/portrait/','/de-at/brand/']];
const approvedPortraitH1={
 '/portrait/':'Executive portraits for leaders and professionals.',
 '/hu/portre/':'Üzleti portréfotózás vezetőknek és szakembereknek.',
 '/de-at/portrait/':'Businessporträts für Führungskräfte und Fachleute.'
};
for(const [home,portrait,brand] of locales){
 test(home+' exposes service owners before the first conversion action',async({page})=>{
  await page.goto(home);
  const links=page.locator('[data-service-owner-links] a');await expect(links).toHaveCount(4);
  for(const width of [375,768,1440,3840]){
   await page.setViewportSize({width,height:1000});
   await expect(links.first()).toBeVisible();
   expect(await page.locator('[data-service-owner-links]').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  }
  await page.locator(`[data-service-owner-links] a[href="${portrait}"]`).click();
  await expect(page).toHaveURL(new RegExp(portrait+'$'));await expect(page.locator('h1')).toHaveText(approvedPortraitH1[portrait]);expect(await page.title()).toMatch(/portr|headshot/i);
  await page.goto(home);await page.locator(`[data-service-owner-links] a[href="${brand}"]`).click();
  await expect(page).toHaveURL(new RegExp(brand+'$'));await expect(page.locator('h1')).toContainText(/brand/i);
 });
}
