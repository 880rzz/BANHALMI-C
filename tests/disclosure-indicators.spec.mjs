import { test, expect } from '@playwright/test';

const pages = [
  '/', '/hu/', '/de-at/',
  '/requestaquote/', '/hu/ajanlatkeres/', '/de-at/anfrage/',
  '/portrait/', '/hu/portre/', '/de-at/portrait/',
  '/lifestyle/', '/hu/brand/', '/de-at/brand/',
  '/event-photography/', '/hu/rendezvenyfotozas/', '/de-at/eventfotografie/'
];

const personaHomes = [
  { path: '/', artist: '/fine-art/', quote: '/requestaquote/?service=event', artistText: 'Professional artist or performer portfolio', organizerText: 'I am organising photography for someone else' },
  { path: '/hu/', artist: '/hu/muveszi-fotografia/', quote: '/hu/ajanlatkeres/?service=event', artistText: 'Művész vagy előadó szakmai portfóliója', organizerText: 'Másnak szervezem a fotózást' },
  { path: '/de-at/', artist: '/de-at/fine-art/', quote: '/de-at/anfrage/?service=event', artistText: 'Portfolio für Künstler:innen und Performer:innen', organizerText: 'Ich organisiere das Shooting für andere' }
];

for (const home of personaHomes) {
  test(`artist and organiser entry paths stay distinct: ${home.path}`, async ({ page }) => {
    await page.goto(home.path);
    const artist = page.locator('[data-persona-path="artist-portfolio"]');
    const organizer = page.locator('[data-persona-path="organizer"]');
    await expect(artist).toHaveAttribute('href', home.artist);
    await expect(artist).toContainText(home.artistText);
    await expect(organizer).toHaveAttribute('href', home.quote);
    await expect(organizer).toContainText(home.organizerText);
  });
}

for (const path of pages) {
  for (const width of [390, 1440]) {
    test(`native disclosure indicators and activation: ${path} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(path);
      const summaries = page.locator('details > summary');
      const count = await summaries.count();
      let checked = 0;
      for (let index = 0; index < count; index += 1) {
        const summary = summaries.nth(index);
        if (!(await summary.isVisible())) continue;
        const details = summary.locator('xpath=..');
        const isFooterDisclosure = await details.evaluate(node => node.matches('.site-footer .footer-accordion'));
        checked += 1;
        if (isFooterDisclosure) {
          await expect(summary).not.toHaveCSS('pointer-events', 'none');
          await expect(details).toHaveJSProperty('open', false);
          const expanded = await summary.getAttribute('aria-expanded');
          if (expanded !== null) expect(expanded).toBe('false');
          if (index % 2 === 0) await summary.click();
          else {
            await summary.focus();
            await page.keyboard.press('Space');
          }
          await expect(details).toHaveJSProperty('open', true);
          const expandedAfter = await summary.getAttribute('aria-expanded');
          if (expandedAfter !== null) expect(expandedAfter).toBe('true');
          continue;
        }
        const assertMarker = async open => {
          const state = await summary.evaluate(node => {
            const pseudo = getComputedStyle(node, '::after').content;
            const explicit = [...node.querySelectorAll('[aria-hidden="true"]')]
              .filter(child => ['+', '−', '–'].includes(child.textContent.trim())).length;
            return { pseudo, explicit };
          });
          expect(state.pseudo).toBe(open ? '"−"' : '"+"');
          expect(state.explicit).toBe(0);
          const expanded = await summary.getAttribute('aria-expanded');
          if (expanded !== null) expect(expanded).toBe(open ? 'true' : 'false');
        };
        const initiallyOpen = await details.evaluate(node => node.open);
        await assertMarker(initiallyOpen);
        if (index % 2 === 0) {
          await summary.click();
        } else {
          await summary.focus();
          await page.keyboard.press('Space');
        }
        await expect(details).toHaveJSProperty('open', !initiallyOpen);
        await assertMarker(!initiallyOpen);
      }
      expect(checked, `${path}: expected visible interactive disclosures`).toBeGreaterThan(0);
    });
  }
}
