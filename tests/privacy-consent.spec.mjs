import { test, expect } from '@playwright/test';

const routes = ['/', '/hu/', '/de-at/'];
const optionalHost = /(?:googletagmanager\.com|google-analytics\.com|googleadservices\.com|googlesyndication\.com|doubleclick\.net|google\.[a-z.]+\/pagead|clarity\.ms|clarity\.microsoft\.com|elfsightcdn\.com|elfsight\.com)/i;

for (const route of routes) {
  test(`optional third parties are consent-gated on ${route}`, async ({ page }) => {
    const optionalRequests = [];
    let consentPhase = 'before-consent';
    page.on('request', async (request) => {
      if (!optionalHost.test(request.url())) return;
      const url = new URL(request.url());
      const headers = request.headers();
      optionalRequests.push({
        phase: consentPhase,
        host: url.hostname,
        path: url.pathname,
        recipientId: url.searchParams.get('id') || url.pathname.match(/\/tag\/([^/?]+)/)?.[1] || null,
        consentSignals: Object.fromEntries(['gcs', 'gcd', 'npa', 'dma_cps'].filter(key => url.searchParams.has(key)).map(key => [key, url.searchParams.get(key)])),
        requestKind: request.resourceType(),
        cookieNames: String(headers.cookie || '').split(';').map(cookie => cookie.split('=')[0].trim()).filter(Boolean)
      });
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

    expect(optionalRequests.filter(request => request.phase === 'before-consent'), `${route}: optional service request before consent`).toEqual([]);
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
    const clarityAttempt = page.waitForRequest((request) => /clarity\.ms\/tag\//i.test(request.url()));
    consentPhase = 'after-consent';
    await page.locator('.cookie [data-accept]').click();
    await googleAttempt;
    await clarityAttempt;
    await expect.poll(() => optionalRequests.filter(request => request.phase === 'after-consent').length).toBeGreaterThan(0);

    const storedAll = await page.evaluate(() => JSON.parse(localStorage.getItem('banhalmi_consent_v3') || '{}'));
    expect(storedAll.version).toBe('3.0');
    expect(storedAll.choice).toBe('all');
    expect(storedAll.savedAt).toBeTruthy();
    expect(storedAll.expiresAt).toBeGreaterThan(storedAll.savedAt);

    await page.locator('[data-cookie-settings]').first().click();
    consentPhase = 'after-revocation';
    await page.locator('.cookie [data-decline]').click();
    await page.waitForLoadState('domcontentloaded');
    const storedEssential = await page.evaluate(() => JSON.parse(localStorage.getItem('banhalmi_consent_v3') || '{}'));
    expect(storedEssential.version).toBe('3.0');
    expect(storedEssential.choice).toBe('essential');
    await expect(page.locator('#banhalmi-ga4')).toHaveCount(0);
    await expect(page.locator('#banhalmi-clarity')).toHaveCount(0);

    const remainingGaCookies = await page.context().cookies();
    expect(remainingGaCookies.filter((cookie) => cookie.name === '_ga' || cookie.name.startsWith('_ga_'))).toEqual([]);
    await page.waitForTimeout(1100);
    const networkEvidence = optionalRequests.map(({ phase, ...record }) => ({ phase, ...record }));
    await test.info().attach(`consent-network-${route.replaceAll('/', '_') || 'home'}.json`, {
      body: Buffer.from(JSON.stringify(networkEvidence, null, 2)),
      contentType: 'application/json'
    });
  });
}
