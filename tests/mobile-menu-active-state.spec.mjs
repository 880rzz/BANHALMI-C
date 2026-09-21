import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const cases = [
  { route: '/about/', label: 'About BANHALMI' },
  { route: '/hu/eletmu/', label: 'Rólam / BANHALMI' },
  { route: '/de-at/werk/', label: 'Über BANHALMI' }
];

for (const entry of cases) {
  test(`production mega menu exposes the current route on ${entry.route}`, async ({ page }) => {
    const jsErrors = [];
    page.on('pageerror', error => jsErrors.push(error.message));
    await page.goto(entry.route, { waitUntil: 'domcontentloaded' });
    const menuButton = page.locator('.menu-btn');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    const menu = page.locator('#bn-mega-menu[aria-hidden="false"]');
    await expect(menu).toBeVisible();
    const active = menu.locator('a.bn-mega-link[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveText(entry.label);
    const styles = await active.evaluate((element) => {
      const style = getComputedStyle(element);
      return { backgroundColor:style.backgroundColor,borderTopWidth:style.borderTopWidth,borderRightWidth:style.borderRightWidth,borderBottomWidth:style.borderBottomWidth,borderLeftWidth:style.borderLeftWidth,borderRadius:style.borderRadius,boxShadow:style.boxShadow,outlineStyle:style.outlineStyle,textDecorationLine:style.textDecorationLine };
    });
    expect(styles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(styles.borderTopWidth).toBe('0px');
    expect(styles.borderRightWidth).toBe('0px');
    expect(styles.borderBottomWidth).toBe('0px');
    expect(styles.borderLeftWidth).toBe('0px');
    expect(styles.borderRadius).toBe('0px');
    expect(styles.boxShadow).toBe('none');
    expect(styles.outlineStyle).toBe('none');
    expect(styles.textDecorationLine).toContain('underline');
    expect(jsErrors).toEqual([]);
  });
}

test('pointer-open pricing menu never frames or auto-focuses Executive Portraits', async ({ page }) => {
  await page.goto('/requestaquote/', { waitUntil: 'domcontentloaded' });
  await page.locator('.menu-btn').click();
  const first = page.locator('#bn-mega-menu a.bn-mega-link').first();
  await expect(first).toHaveText('Executive Portraits');
  await expect(first).not.toBeFocused();
  const s = await first.evaluate((element) => { const style=getComputedStyle(element); return {backgroundColor:style.backgroundColor,borderTopWidth:style.borderTopWidth,borderRightWidth:style.borderRightWidth,borderBottomWidth:style.borderBottomWidth,borderLeftWidth:style.borderLeftWidth,borderRadius:style.borderRadius,boxShadow:style.boxShadow,outlineStyle:style.outlineStyle}; });
  expect(s.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(s.borderTopWidth).toBe('0px');
  expect(s.borderRightWidth).toBe('0px');
  expect(s.borderBottomWidth).toBe('0px');
  expect(s.borderLeftWidth).toBe('0px');
  expect(s.borderRadius).toBe('0px');
  expect(s.boxShadow).toBe('none');
  expect(s.outlineStyle).toBe('none');
});


test('first mobile tap is queued while mega-menu core loads', async ({ page }) => {
  await page.route('**/assets/js/mega-menu-v65-base.js*', async route => {
    await new Promise(resolve => setTimeout(resolve, 350));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const button = page.locator('.menu-btn');
  await expect(button).toBeVisible();
  await button.click();
  const menu = page.locator('#bn-mega-menu[aria-hidden="false"]');
  await expect(menu).toBeVisible({ timeout: 3000 });
  await expect(button).toHaveAttribute('aria-expanded', 'true');
});


test('review drawer exposes a visible disclosure chevron', async ({ page }) => {
  await page.goto('/portrait/', { waitUntil: 'domcontentloaded' });
  const summary = page.locator('details.review-drawer > summary').first();
  await expect(summary).toBeVisible();
  const pseudo = await summary.evaluate(el => {
    const s = getComputedStyle(el, '::after');
    return { content:s.content, width:s.width, height:s.height, display:s.display };
  });
  expect(pseudo.display).not.toBe('none');
  expect(pseudo.width).not.toBe('0px');
  expect(pseudo.height).not.toBe('0px');
});

test('legal and contact card stacks keep visible separation', async ({ page }) => {
  await page.goto('/faq/', { waitUntil: 'domcontentloaded' });
  const legalGap = await page.locator('.legal-navigation .service-grid').evaluate(el => getComputedStyle(el).rowGap);
  expect(parseFloat(legalGap)).toBeGreaterThanOrEqual(20);
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
  const contactGap = await page.locator('.contact-routing .service-grid').evaluate(el => getComputedStyle(el).rowGap);
  expect(parseFloat(contactGap)).toBeGreaterThanOrEqual(20);
});
