import {test,expect} from '@playwright/test';
import {serviceRoutes,quoteRoutes} from '../tools/audit-pricing-disclosure.mjs';
const widths=[375,390,621,768,1024,1180,1280,1440,1600,1920,2560,3840];
for(const route of [...serviceRoutes,...quoteRoutes]){
 test(route+' pricing stays optional, keyboard accessible and responsive',async({page})=>{
  await page.goto('/'+route+'/');
  const panel=page.locator('[data-pricing-disclosure]');
  const summary=panel.locator(':scope > summary');
  await expect(panel).not.toHaveAttribute('open','');
  const price=panel.locator('.service-price-examples, .quote-price-note').first();
  await expect(price).toBeHidden();
  await summary.focus();await page.keyboard.press('Enter');
  await expect(panel).toHaveAttribute('open','');await expect(price).toBeVisible();
  for(const width of widths){
   await page.setViewportSize({width,height:1000});
   const size=await summary.boundingBox();expect(size.height).toBeGreaterThanOrEqual(44);
   if(serviceRoutes.includes(route)){
    const rhythm=await summary.evaluate(el=>{
      const style=getComputedStyle(el);
      return {line:parseFloat(style.lineHeight),font:parseFloat(style.fontSize)};
    });
    expect(Math.abs(rhythm.line-rhythm.font*1.45),route+' pricing summary line-height at '+width).toBeLessThan(.7);
    const note=panel.locator('.service-price-currency-note');
    if(await note.count()){
      const typography=await note.first().evaluate(el=>{
        const probe=document.createElement('span');
        probe.style.fontSize='var(--bn-service-price-meta)';
        el.parentElement.appendChild(probe);
        const expected=parseFloat(getComputedStyle(probe).fontSize);
        probe.remove();
        return {actual:parseFloat(getComputedStyle(el).fontSize),expected};
      });
      expect(Math.abs(typography.actual-typography.expected),route+' currency note font size at '+width).toBeLessThan(.6);
    }
   }
   // The shared H2 !important must resolve its scoped token, not eclipse the
   // price disclosure's restrained editorial heading at any breakpoint.
   if(serviceRoutes.includes(route)){
    const actual=await panel.locator('.service-price-examples h2').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    const reference=await panel.locator('.service-price-examples').evaluate(el=>{
      const probe=document.createElement('span');
      probe.style.fontSize='var(--bn-service-price-heading)';
      el.appendChild(probe);
      const value=parseFloat(getComputedStyle(probe).fontSize);
      probe.remove();
      return value;
    });
    expect(Math.abs(actual-reference),route+' price H2 token mismatch at '+width).toBeLessThan(.6);
   }
   const overflow=await panel.evaluate(el=>el.scrollWidth>el.clientWidth+1);expect(overflow,route+' panel overflow at '+width).toBe(false);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route+' page overflow at '+width).toBe(true);
  }
  await summary.focus();await page.keyboard.press('Space');await expect(panel).not.toHaveAttribute('open','');await expect(price).toBeHidden();
  if(quoteRoutes.includes(route)){
   await expect(page.locator('[data-smart-quote]')).toBeVisible();
   await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1);
   await expect(page.locator('[data-download-quote-pdf]')).toBeEnabled();
  }
 });
}
test('pricing can be opened without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 await page.goto('http://127.0.0.1:4173/portrait/');
 const panel=page.locator('[data-pricing-disclosure]');await panel.locator('summary').click();
 await expect(panel.locator('.service-price-examples')).toBeVisible();await context.close();
});
