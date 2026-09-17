import { test, expect } from '@playwright/test';

const routes = [
  { path: '/requestaquote/', lang: 'en' },
  { path: '/hu/ajanlatkeres/', lang: 'hu' },
  { path: '/de-at/anfrage/', lang: 'de' }
];
const viewports = [
  { width: 375, height: 900 },
  { width: 768, height: 1000 },
  { width: 1440, height: 1000 }
];

function amount(text) {
  const cleaned = String(text).replace(/[^0-9,.-]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.');
  return Number.parseFloat(cleaned);
}

for (const route of routes) {
  test(`quote information opens as a modal on ${route.path}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(route.path);
    const trigger = page.locator('.info-tip[data-tooltip]').first();
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(triggerBox.width).toBeGreaterThanOrEqual(44);
    expect(triggerBox.height).toBeGreaterThanOrEqual(44);
    const option = trigger.locator('xpath=ancestor::label[1]');
    const optionBox = await option.boundingBox();
    expect(optionBox).not.toBeNull();
    await expect(trigger).toHaveCSS('position', 'static');
    expect(triggerBox.x).toBeGreaterThanOrEqual(optionBox.x - 1);
    expect(triggerBox.y).toBeGreaterThanOrEqual(optionBox.y - 1);
    expect(triggerBox.x + triggerBox.width).toBeLessThanOrEqual(optionBox.x + optionBox.width + 1);
    expect(triggerBox.y + triggerBox.height).toBeLessThanOrEqual(optionBox.y + optionBox.height + 1);
    const copyBox = await option.locator('strong').first().boundingBox();
    if (copyBox) expect(triggerBox.x).toBeGreaterThanOrEqual(copyBox.x + copyBox.width - 1);
    await trigger.click();
    const modal = page.locator('.info-modal');
    const panel = modal.locator('.info-modal-panel');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveCSS('position', 'fixed');
    await expect(modal).toHaveCSS('z-index', '10040');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS('border-radius', '10px');
    await expect(modal.locator('[data-info-modal-content]')).not.toBeEmpty();
    await expect(page.locator('body')).toHaveClass(/info-modal-open/);
    await expect(modal.locator('.info-modal-close')).toBeFocused();
    const closeSize = await modal.locator('.info-modal-close').evaluate((node) => {
      const style = window.getComputedStyle(node);
      return {
        width: Number.parseFloat(style.width),
        height: Number.parseFloat(style.height)
      };
    });
    expect(closeSize.width).toBeGreaterThanOrEqual(44);
    expect(closeSize.height).toBeGreaterThanOrEqual(44);
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(900);
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}

for (const route of routes) {
  for (const viewport of viewports) {
    test(`quote estimate updates on ${route.path} at ${viewport.width}px`, async ({ page }) => {
      const errors = [];
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.setViewportSize(viewport);
      await page.goto(route.path);
      const root = page.locator('[data-quote-root]');
      await expect(root).toHaveCount(1);
      await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
      await page.locator('input[name="category"][value="individual"]').check();
      await page.locator('input[name="individual_mode"][value="quick30"]').check();
      const gross = root.locator('[data-estimate-gross]');
      const net = root.locator('[data-estimate-net]');
      const vat = root.locator('[data-estimate-vat]');
      await expect(gross).not.toContainText(/€0|—|Calculating|Számítás|Berechnung/);
      await expect(net).not.toContainText(/—|Calculating|Számítás|Berechnung/);
      await expect(vat).not.toContainText(/—|Calculating|Számítás|Berechnung/);
      const before = amount(await gross.textContent());
      expect(before).toBeGreaterThan(0);
      const beforeHidden = await page.locator('input[name="estimate_gross"]').inputValue();
      await page.locator('input[name="retouched_images"]').fill('3');
      await expect.poll(async () => page.locator('input[name="estimate_gross"]').inputValue()).not.toBe(beforeHidden);
      const after = amount(await gross.textContent());
      expect(after).toBeGreaterThan(0);
      const visibleAmountField = route.lang === 'hu' ? 'estimate_display_gross' : 'estimate_gross';
      expect(amount(await page.locator(`input[name="${visibleAmountField}"]`).inputValue())).toBeCloseTo(after, 1);
      await expect(page.locator('body')).not.toContainText(/NaN|undefined/);
      expect(errors).toEqual([]);
    });
  }
}


for (const route of routes) {
  test(`quote information opens in an accessible modal on ${route.path}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route.path);

    const option = page.locator('.option-row:has(.info-tip)').first();
    const trigger = option.locator('.info-tip');
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    const optionBox = await option.boundingBox();
    const triggerBox = await trigger.boundingBox();
    expect(optionBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();
    expect(Math.abs((optionBox.x + optionBox.width) - (triggerBox.x + triggerBox.width))).toBeLessThan(24);
    expect(Math.abs((optionBox.y + optionBox.height) - (triggerBox.y + triggerBox.height))).toBeLessThan(24);

    await trigger.click();
    const modal = page.locator('.info-modal');
    const panel = modal.locator('.info-modal-panel');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toHaveCSS('border-radius', '10px');
    await expect(modal.locator('[data-info-modal-content]')).not.toBeEmpty();

    await modal.locator('.info-modal-close').click();
    await expect(modal).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
}


test.describe('complete quote calculation strategy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/requestaquote/');
    await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
    await page.locator('input[name="category"][value="individual"]').check();
    await page.locator('input[name="individual_mode"][value="quick30"]').check();
  });

  test('calculates every principal service and group portrait formula exactly', async ({ page }) => {
    const results = await page.evaluate(() => {
      const form = document.querySelector('[data-smart-quote]');
      const set = (name, value) => {
        const candidates = [...form.querySelectorAll(`[name="${name}"]`)];
        const field = candidates.find((node) => (node.type === 'radio' || node.type === 'checkbox') ? node.value === String(value) : true);
        if (!field) throw new Error(`Missing quote field: ${name}`);
        if (field.type === 'radio' || field.type === 'checkbox') field.checked = true;
        else field.value = String(value);
      };
      const calculate = (values) => {
        Object.entries(values).forEach(([name, value]) => set(name, value));
        window.BANHALMI_QUOTE.paint(form);
        return window.BANHALMI_QUOTE.calculate(form);
      };
      return {
        individual: calculate({ category:'individual', individual_mode:'quick30', retouched_images:3 }),
        group: calculate({ category:'group', people_count:12, group_hours:1, retouched_images:2 }),
        brand: calculate({ category:'brand', brand_duration:'brand120', brand_people_count:2, retouched_images:4 }),
        art: calculate({ category:'art', art_duration:'art120', retouched_images:5 }),
        event: calculate({ category:'event', event_duration:'event120', event_guest_count:600, event_parallel_tracks:1, event_extra_photographers:0, retouched_images:100 })
      };
    });

    expect(results.individual.gross).toBe(290);
    expect(results.group.gross).toBe(1668);
    expect(results.group.photographerCount).toBe(2);
    expect(results.brand.gross).toBe(965);
    expect(results.brand.retouchedImagesTotal).toBe(8);
    expect(results.art.gross).toBe(1125);
    expect(results.event.gross).toBe(1370);
    expect(results.event.photographerCount).toBe(3);
    expect(results.event.eventDeliveredImagesEstimate).toBe(100);

    for (const result of Object.values(results)) {
      expect(result.net + result.vat).toBeCloseTo(result.gross, 2);
      expect(result.pricingReady).toBe(true);
      expect(result.pricingSource).toBe('pricing.json');
    }
  });

  test('prices add-ons and Austrian/Hungarian travel without hiding custom travel status', async ({ page }) => {
    const result = await page.evaluate(() => {
      const form = document.querySelector('[data-smart-quote]');
      const setValue = (name, value) => { form.querySelector(`[name="${name}"]`).value = String(value); };
      form.querySelector('[name="category"][value="brand"]').checked = true;
      form.querySelector('[name="brand_duration"][value="brand60"]').checked = true;
      form.querySelector('[name="addons"][value="stylist"]').checked = true;
      setValue('brand_people_count', 1);
      setValue('retouched_images', 1);
      setValue('location', 'office');
      setValue('travel_country', 'HU');
      setValue('specific_location', 'Budapest, Example Street 1');
      window.BANHALMI_QUOTE.paint(form);
      const domestic = window.BANHALMI_QUOTE.calculate(form);
      setValue('travel_country', 'OTHER');
      window.BANHALMI_QUOTE.paint(form);
      const international = window.BANHALMI_QUOTE.calculate(form);
      return { domestic, international };
    });
    expect(result.domestic.gross).toBe(959);
    expect(result.domestic.customTravel).toBe(false);
    expect(result.international.gross).toBe(719);
    expect(result.international.customTravel).toBe(true);
  });

  test('updates the rendered VAT note while keeping VAT pending verification', async ({ page }) => {
    const form = page.locator('[data-smart-quote]');
    const grossBefore = await page.locator('[data-estimate-gross]').textContent();
    await form.locator('[name="customer_type"]').selectOption('business');
    await form.locator('[name="billing_country"]').selectOption('HU');
    await form.locator('[name="company"]').fill('Example Kft.');
    await form.locator('[name="vat_id"]').fill('HU12345678');

    await expect(page.locator('[data-vat-note]')).toContainText('0% VAT');
    await expect(form.locator('[name="estimate_vat_mode"]')).toHaveValue('at-vat-20-potential-zero-after-verification');
    await expect(page.locator('[data-estimate-gross]')).toHaveText(grossBefore);
    const tax = await page.evaluate(() => window.BANHALMI_QUOTE.calculate(document.querySelector('[data-smart-quote]')));
    expect(tax.reverseEligible).toBe(true);
    expect(tax.reverse).toBe(false);
    expect(tax.vat).toBeGreaterThan(0);
  });

  test('enforces location and date strategy before submission', async ({ page }) => {
    const form = page.locator('[data-smart-quote]');
    await form.locator('[name="location"]').selectOption('custom');
    await form.locator('[name="date_coordination_requested"]').check();
    await expect(form.locator('[data-exact-location]')).toBeVisible();
    await expect(form.locator('[data-travel-country]')).toBeVisible();
    expect(await page.evaluate(() => window.BANHALMI_QUOTE.validate(document.querySelector('[data-smart-quote]'), false))).toBe(false);

    await form.locator('[name="specific_location"]').fill('Vienna, Example Street 1');
    await form.locator('[name="travel_country"]').selectOption('AT');
    expect(await page.evaluate(() => window.BANHALMI_QUOTE.validate(document.querySelector('[data-smart-quote]'), false))).toBe(true);

    await form.locator('[name="date_coordination_requested"]').uncheck();
    const duplicateDate = await page.evaluate(() => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return date.toISOString().slice(0, 10);
    });
    await form.locator('[name="preferred_date_1"]').fill(duplicateDate);
    await form.locator('[name="preferred_date_2"]').fill(duplicateDate);
    expect(await page.evaluate(() => window.BANHALMI_QUOTE.validate(document.querySelector('[data-smart-quote]'), false))).toBe(false);
    await expect(form.locator('[data-availability-error]')).toBeVisible();
  });

  test('produces a PDF and submits the same calculated monetary payload', async ({ page }) => {
    const form = page.locator('[data-smart-quote]');
    await expect(page.locator('[data-download-quote-pdf]')).toBeEnabled();
    await page.locator('[data-download-quote-pdf]').click();
    await expect(form.locator('[name="name"]')).toBeFocused();

    await form.locator('[name="name"]').fill('Automated Test');
    await form.locator('[name="email"]').fill('test@example.com');
    await form.locator('[name="customer_type"]').selectOption('private');
    await form.locator('[name="billing_country"]').selectOption('AT');
    await form.locator('[name="message"]').fill('Automated quote-flow verification.');
    await form.locator('[name="date_coordination_requested"]').check();
    await form.locator('[name="privacy_acknowledged"]').check();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-download-quote-pdf]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);

    let submittedPayload;
    await page.route('**/*', async (route) => {
      if (route.request().method() === 'POST') {
        submittedPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok:true, submissionId:'TEST-QUOTE' }) });
      } else {
        await route.continue();
      }
    });
    const visibleGross = amount(await page.locator('[data-estimate-gross]').textContent());
    await form.locator('[type="submit"]').click();
    await expect(form.locator('[data-form-note]')).toContainText('TEST-QUOTE');
    expect(Number(submittedPayload.grossAmount)).toBeCloseTo(visibleGross, 2);
    expect(Number(submittedPayload.netAmount) + Number(submittedPayload.vatAmount)).toBeCloseTo(Number(submittedPayload.grossAmount), 2);
    expect(submittedPayload.estimateVatMode).toBe('at-vat-20');
    expect(submittedPayload.formType).toBe('quote');
  });
});

for (const route of routes) {
  test(`VAT guidance is localized and dynamically updated on ${route.path}`, async ({ page }) => {
    await page.goto(route.path);
    const form = page.locator('[data-smart-quote]');
    await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
    await form.locator('input[name="category"][value="individual"]').check();
    await form.locator('input[name="individual_mode"][value="quick30"]').check();
    await form.locator('[name="customer_type"]').selectOption('business');
    await form.locator('[name="billing_country"]').selectOption('HU');
    await form.locator('[name="company"]').fill('Example Kft.');
    await form.locator('[name="vat_id"]').fill('HU12345678');
    await expect(page.locator('[data-vat-note]')).toContainText('0%');
    await expect(form.locator('[name="estimate_vat_mode"]')).toHaveValue('at-vat-20-potential-zero-after-verification');
  });
}


test('Hungarian quote displays fixed-rate HUF while preserving canonical EUR', async ({ page }) => {
  await page.goto('/hu/ajanlatkeres/');
  await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
  await page.locator('input[name="category"][value="individual"]').check();
  await page.locator('input[name="individual_mode"][value="quick30"]').check();
  await expect(page.locator('[data-estimate-gross]')).toContainText(/88[\s\u00a0]?000/);
  await expect(page.locator('[data-estimate-gross]')).toContainText(/Ft|HUF/);
  await expect(page.locator('input[name="estimate_gross"]')).toHaveValue('220');
  await expect(page.locator('input[name="estimate_display_currency"]')).toHaveValue('HUF');
  await expect(page.locator('input[name="estimate_display_rate"]')).toHaveValue('400');
  await expect(page.locator('input[name="estimate_display_gross"]')).toHaveValue('88000');
  await expect(page.locator('[data-vat-note]')).toContainText('1 EUR = 400 HUF');
});
