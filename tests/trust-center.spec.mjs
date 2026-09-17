import { test, expect } from '@playwright/test';

const trustPages = ['/trust/', '/hu/bizalom/', '/de-at/vertrauen/'];
for (const route of trustPages) {
  test(`Trust Center is contained and responsive on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);
    await expect(page.locator('h1')).toBeVisible();
    const desktop = await page.locator('.trust-grid').evaluate((el) => ({
      display: getComputedStyle(el).display,
      columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
      width: el.getBoundingClientRect().width,
      viewport: innerWidth
    }));
    expect(desktop.display).toBe('grid');
    expect(desktop.columns).toBe(3);
    expect(desktop.width).toBeLessThan(desktop.viewport);
    await page.setViewportSize({ width: 375, height: 812 });
    const mobile = await page.locator('.trust-grid').evaluate((el) => ({
      columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
      right: el.getBoundingClientRect().right,
      viewport: innerWidth
    }));
    expect(mobile.columns).toBe(1);
    expect(mobile.right).toBeLessThanOrEqual(mobile.viewport);
  });
}

const legacyPages = ['/portrait/','/event-photography/','/privacy-policy/','/terms-conditions/','/requestaquote/','/faq/','/lifestyle/','/hu/portre/','/hu/brand/','/hu/rendezvenyfotozas/','/hu/adatvedelem/','/hu/aszf/','/hu/ajanlatkeres/','/hu/gyik/','/de-at/portrait/','/de-at/brand/','/de-at/eventfotografie/','/de-at/datenschutz/','/de-at/agb/','/de-at/anfrage/','/de-at/faq/'];
test('legacy container and card-grid markup uses the shared constrained grid', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const route of legacyPages) {
    await page.goto(route);
    const grids = page.locator('.card-grid');
    if (await grids.count()) {
      const result = await grids.first().evaluate((el) => ({ display: getComputedStyle(el).display, width: el.getBoundingClientRect().width, viewport: innerWidth }));
      expect(result.display, route).toBe('grid');
      expect(result.width, route).toBeLessThan(result.viewport);
    }
    const containers = page.locator('.container');
    if (await containers.count()) {
      const result = await containers.first().evaluate((el) => ({ width: el.getBoundingClientRect().width, viewport: innerWidth }));
      expect(result.width, route).toBeLessThan(result.viewport);
    }
  }
});

for (const route of ['/', '/hu/', '/de-at/']) {
  test(`ART-inspired editorial menu works on ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);
    const button = page.locator('.menu-btn');
    await button.click();
    await expect(page.locator('#bn-mega-menu')).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const desktopColumns = await page.locator('.bn-mega-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(desktopColumns).toBe(3);
    await page.keyboard.press('Escape');
    await expect(page.locator('#bn-mega-menu')).toBeHidden();
    await page.setViewportSize({ width: 375, height: 812 });
    await button.click();
    const mobileColumns = await page.locator('.bn-mega-grid').evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(mobileColumns).toBe(1);
  });
}
