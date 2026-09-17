import { test, expect } from '@playwright/test';

const routes=[
  "portrait/index.html",
  "lifestyle/index.html",
  "event-photography/index.html",
  "hu/portre/index.html",
  "hu/brand/index.html",
  "hu/rendezvenyfotozas/index.html",
  "de-at/portrait/index.html",
  "de-at/brand/index.html",
  "de-at/eventfotografie/index.html"
].map(file=>file==='index.html'?'/':'/'+file.replace(/index\.html$/,''));
for(const route of routes){
  test(route+' exposes one coherent service conversion path',async({page})=>{
    await page.goto(route);
    const actions=page.locator('[data-service-hero-actions="stage22"]');
    await expect(actions).toHaveCount(1);
    await expect(page.locator('section.cta-band')).toHaveCount(0);
    await expect(page.locator('#selected-work')).toHaveCount(1);
    await expect(page.locator('#next-step')).toHaveCount(1);
    await actions.locator('a[href="#next-step"]').click();
    await expect(page).toHaveURL(/#next-step$/);
    await expect(page.locator('#next-step')).toBeVisible();
    await page.goto(route);
    await page.locator('[data-service-hero-actions="stage22"] a[href="#selected-work"]').click();
    await expect(page).toHaveURL(/#selected-work$/);
    await expect(page.locator('#selected-work')).toBeVisible();
    await expect(page.locator('#next-step article.card')).toHaveCount(3);
  });
}
