import { test, expect } from '@playwright/test';

const locales = [
  { home: '/', portrait: '/portrait/', brand: '/lifestyle/', h1: 'The image that reveals who you are.' },
  { home: '/hu/', portrait: '/hu/portre/', brand: '/hu/brand/', h1: 'A kép, amely megmutatja, ki Ön.' },
  { home: '/de-at/', portrait: '/de-at/portrait/', brand: '/de-at/brand/', h1: 'Das Bild, das zeigt, wer Sie sind.' },
];

for (const {home, portrait, brand, h1} of locales) {
  test(home + ' exposes service owners before the first conversion action', async ({page}) => {
    await page.goto(home);
    const links = page.locator('[data-service-owner-links] a');
    await expect(links).toHaveCount(4);
    for (const width of [375, 768, 1440, 3840]) {
      await page.setViewportSize({width, height: 1000});
      await expect(links.first()).toBeVisible();
      expect(await page.locator('[data-service-owner-links]').evaluate(
        el => el.scrollWidth <= el.clientWidth + 1
      )).toBe(true);
    }
    await page.locator('[data-service-owner-links] a[href="' + portrait + '"]').click();
    await expect(page).toHaveURL(new RegExp(portrait + '$'));
    await expect(page.locator('main h1')).toHaveText(h1);
    await expect(page).toHaveTitle(/portr|headshot/i);

    await page.goto(home);
    await page.locator('[data-service-owner-links] a[href="' + brand + '"]').click();
    await expect(page).toHaveURL(new RegExp(brand + '$'));
    await expect(page.locator('main h1')).toContainText(/brand/i);
  });
}
