import { test, expect } from '@playwright/test';

const routes = ['/', '/hu/', '/de-at/'];
const optionalHost = /(?:googletagmanager\.com|google-analytics\.com|elfsightcdn\.com|elfsight\.com)/i;

for (const route of routes) {
  test(`optional third parties are consent-gated on ${route}`, async ({ page }) => {
    const optionalRequests = [];
    page.on('request', (request) => {
      if (optionalHost.test(request.url())) optionalRequests.push(request.url());
    });

    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.removeItem('banhalmi_consent_v3');
      document.cookie.split(';').forEach((part) => {
        const name = part.split('=')[0].trim();
        if (name === '_ga' || name.startsWith('_ga_')) document.cookie = `${name}=; Max-Age=0; path=/`;
      });
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(750);

    expect(optionalRequests, `${route}: optional service request before consent`).toEqual([]);
    await expect(page.locator('.cookie')).toHaveClass(/show/);

    const reviews = page.locator('[data-third-party-reviews="true"]');
    if (await reviews.count()) {
      const details = reviews.locator('details').first();
      if (await details.count()) {
        await details.locator('summary').click();
        await page.waitForTimeout(250);
        expect(optionalRequests, `${route}: review provider request before consent`).toEqual([]);
        await expect(details.locator('.reviews-consent-note')).toBeVisible();
      }
    }

    await expect.poll(() => page.evaluate(() => !!window.BANHALMI_ANALYTICS)).toBe(true);
    const googleAttempt = page.waitForRequest((request) => /googletagmanager\.com\/gtag\/js/i.test(request.url()));
    await page.locator('.cookie [data-accept]').click();
    await googleAttempt;

    const storedAll = await page.evaluate(() => JSON.parse(localStorage.getItem('banhalmi_consent_v3') || '{}'));
    expect(storedAll.version).toBe('3.0');
    expect(storedAll.choice).toBe('all');
    expect(storedAll.savedAt).toBeTruthy();
    expect(storedAll.expiresAt).toBeGreaterThan(storedAll.savedAt);

    await page.locator('[data-cookie-settings]').first().click();
    await page.locator('.cookie [data-decline]').click();
    await page.waitForLoadState('domcontentloaded');
    const storedEssential = await page.evaluate(() => JSON.parse(localStorage.getItem('banhalmi_consent_v3') || '{}'));
    expect(storedEssential.version).toBe('3.0');
    expect(storedEssential.choice).toBe('essential');

    const remainingGaCookies = await page.context().cookies();
    expect(remainingGaCookies.filter((cookie) => cookie.name === '_ga' || cookie.name.startsWith('_ga_'))).toEqual([]);
  });
}
