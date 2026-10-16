import {test,expect} from '@playwright/test';
const locales=[['/','/portrait/','/lifestyle/'],['/hu/','/hu/portre/','/hu/brand/'],['/de-at/','/de-at/portrait/','/de-at/brand/']];
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
  await expect(page).toHaveURL(new RegExp(portrait+'
  await page.goto(home);await page.locator(`[data-service-owner-links] a[href="${brand}"]`).click();
  await expect(page).toHaveURL(new RegExp(brand+'$'));await expect(page.locator('h1')).toContainText(/brand/i);
 });
}
));
  const approvedH1={
   '/portrait/':'The image that reveals who you are.',
   '/hu/portre/':'A kép, amely megmutatja, ki Ön.',
   '/de-at/portrait/':'Das Bild, das zeigt, wer Sie sind.'
  };
  await expect(page.locator('main h1')).toHaveText(approvedH1[portrait]);
  // Service-intent terms live in the page title and structure, not the editorial H1.
  await expect(page).toHaveTitle(/portr|headshot/i);
  await page.goto(home);await page.locator(`[data-service-owner-links] a[href="${brand}"]`).click();
  await expect(page).toHaveURL(new RegExp(brand+'$'));await expect(page.locator('h1')).toContainText(/brand/i);
 });
}
