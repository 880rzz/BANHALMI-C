import { test, expect } from '@playwright/test';

const routes = ['/requestaquote/', '/hu/ajanlatkeres/', '/de-at/anfrage/'];

for (const path of routes) {
  test(`hardens quote dates, status, PDF placement and zero starting price on ${path}`, async ({ page }) => {
    await page.goto(path);
    const form = page.locator('[data-smart-quote]');
    await expect(form).toHaveCount(1);
    await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
    await expect(form.locator('input[type="radio"][name="category"]:checked')).toHaveCount(0);
    await expect(form.locator('input[type="radio"][value="headshotcv"]')).not.toBeChecked();
    await expect(form.locator('[name="estimate_gross"]')).toHaveValue('0');
    await expect(form.locator('[name="estimate_net"]')).toHaveValue('0');
    await expect(form.locator('[name="estimate_vat"]')).toHaveValue('0');
    await expect(form.locator('[data-form-note]')).toHaveAttribute('role', 'status');
    await expect(form.locator('[data-form-note]')).toHaveAttribute('aria-live', 'polite');
    const today = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    });
    const min = await form.locator('input[type="date"]').first().getAttribute('min');
    expect(min).not.toBe(today);
    expect(min).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    await expect(form.locator('[name="submission_key"]')).not.toHaveValue('');
    const submitBox = await form.locator('.quote-submit-actions').boundingBox();
    const pdfBox = await form.locator('.quote-submit-pdf-actions').boundingBox();
    expect(submitBox).not.toBeNull();
    expect(pdfBox).not.toBeNull();
    expect(pdfBox.y).toBeGreaterThanOrEqual(submitBox.y + submitBox.height - 1);
  });
}

test('quote amount grows only after a package is selected', async ({ page }) => {
  await page.goto('/requestaquote/');
  const form = page.locator('[data-smart-quote]');
  await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
  await expect(form.locator('[name="estimate_gross"]')).toHaveValue('0');
  await form.locator('input[type="radio"][value="individual"]').check();
  await form.locator('input[type="radio"][value="headshotcv"]').check();
  await expect(form.locator('[name="estimate_gross"]')).toHaveValue('120');
});

test('preserves entered quote data when delivery is not explicitly verified', async ({ page }) => {
  await page.goto('/requestaquote/');
  const form = page.locator('[data-smart-quote]');
  await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
  await form.locator('input[type="radio"][value="individual"]').check();
  await form.locator('input[type="radio"][value="headshotcv"]').check();
  await form.locator('[name="name"]').fill('Preserved Client');
  await form.locator('[name="email"]').fill('client@example.com');
  await form.locator('[name="customer_type"]').selectOption('private');
  await form.locator('[name="billing_country"]').selectOption('AT');
  await form.locator('[name="message"]').fill('Keep this content until delivery is verified.');
  await form.locator('[name="date_coordination_requested"]').check();
  await form.locator('[name="privacy_acknowledged"]').check();
  await page.route('**/api/banhalmi-form', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ok:true, submissionId:'UNVERIFIED-1'})
  }));
  await form.locator('[type="submit"]').click();
  await expect(form.locator('[data-form-note]')).toContainText('UNVERIFIED-1');
  await expect(form.locator('[name="name"]')).toHaveValue('Preserved Client');
  await expect(form.locator('[name="email"]')).toHaveValue('client@example.com');
});

test('clears quote data only when both email deliveries are explicitly verified', async ({ page }) => {
  await page.goto('/requestaquote/');
  const form = page.locator('[data-smart-quote]');
  await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1, { timeout: 10000 });
  await form.locator('input[type="radio"][value="individual"]').check();
  await form.locator('input[type="radio"][value="headshotcv"]').check();
  await form.locator('[name="name"]').fill('Verified Client');
  await form.locator('[name="email"]').fill('verified@example.com');
  await form.locator('[name="customer_type"]').selectOption('private');
  await form.locator('[name="billing_country"]').selectOption('AT');
  await form.locator('[name="message"]').fill('Verified delivery test.');
  await form.locator('[name="date_coordination_requested"]').check();
  await form.locator('[name="privacy_acknowledged"]').check();
  await page.route('**/api/banhalmi-form', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ok:true, submissionId:'VERIFIED-1', adminEmailSent:true, customerEmailSent:true})
  }));
  await form.locator('[type="submit"]').click();
  await expect(form.locator('[data-form-note]')).toContainText('VERIFIED-1');
  await expect(form.locator('[name="name"]')).toHaveValue('');
  await expect(form.locator('[name="email"]')).toHaveValue('');
  await expect(form.locator('input[type="radio"][name="category"]:checked')).toHaveCount(0);
  await expect(form.locator('input[type="radio"][value="headshotcv"]')).not.toBeChecked();
  await expect(form.locator('[name="estimate_gross"]')).toHaveValue('0');
  await expect(form.locator('[name="estimate_net"]')).toHaveValue('0');
  await expect(form.locator('[name="estimate_vat"]')).toHaveValue('0');
  await expect(form.locator('[name="submission_key"]')).not.toHaveValue('');
});
