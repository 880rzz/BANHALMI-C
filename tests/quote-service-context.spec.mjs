import { test, expect } from '@playwright/test';

const quoteRoutes=['/requestaquote/','/hu/ajanlatkeres/','/de-at/anfrage/'];
const contexts=[
  {
    "service": "portrait",
    "category": "individual",
    "panel": "individual"
  },
  {
    "service": "brand",
    "category": "brand",
    "panel": "brand"
  },
  {
    "service": "event",
    "category": "event",
    "panel": "event"
  },
  {
    "service": "fine-art",
    "category": "art",
    "panel": "art"
  }
];
function amount(text){const cleaned=String(text).replace(/[^0-9,.-]/g,'').replace(/\.(?=\d{3})/g,'').replace(',','.');return Number.parseFloat(cleaned);}
for(const quoteRoute of quoteRoutes){
  for(const context of contexts){
    test(quoteRoute+' applies '+context.service+' before the first estimate',async({page})=>{
      await page.goto(quoteRoute+'?service='+context.service);
      await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1,{timeout:10000});
      const form=page.locator('[data-smart-quote]');
      await expect(form).toHaveAttribute('data-service-context',context.service);
      await expect(form).toHaveAttribute('data-service-context-source','url');
      await expect(form.locator('input[name="service_context"]')).toHaveValue(context.service);
      const categorySelector='input[name="category"][value="'+context.category+'"]'+(context.category==='event'?':not([data-private-event])':'');
      await expect(form.locator(categorySelector).first()).toBeChecked();
      await expect(form.locator('[data-panel="'+context.panel+'"]').first()).toBeVisible();
      const gross=amount(await page.locator('[data-estimate-gross]').textContent());
      expect(Number.isFinite(gross)).toBe(true);
      expect(gross).toBeGreaterThanOrEqual(0);
      const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).not.toContain('?service=');
      const switchHrefs=await page.locator('.lang-switch a[hreflang]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href')));
      expect(switchHrefs.length).toBe(3);
      for(const href of switchHrefs) expect(href).toContain('service='+context.service);
    });
  }
  test(quoteRoute+' supports private-event as a distinct event intent',async({page})=>{
    await page.goto(quoteRoute+'?service=private-event');
    await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1,{timeout:10000});
    const form=page.locator('[data-smart-quote]');
    const privateOption=form.locator('input[name="category"][data-private-event="true"]');
    await expect(privateOption).toHaveCount(1);
    await expect(privateOption).toBeChecked();
    await expect(form).toHaveAttribute('data-private-event-active','true');
    await expect(form).toHaveAttribute('data-service-context','private-event');
    await expect(form.locator('input[name="service_context"]')).toHaveValue('private-event');
    await expect(page).toHaveURL(/service=private-event/);
    for(const link of await page.locator('.lang-switch a[hreflang]').all()) await expect(link).toHaveAttribute('href',/service=private-event/);
    await expect(form.locator('input[name="event_duration"][value="event120"]')).toBeChecked();
    const gross=amount(await page.locator('[data-estimate-gross]').textContent());
    expect(gross).toBe(quoteRoute.startsWith('/hu/')?236000:590);
  });
  test(quoteRoute+' ignores missing or unsupported service context safely',async({page})=>{
    await page.goto(quoteRoute+'?service=unsupported');
    await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1,{timeout:10000});
    const form=page.locator('[data-smart-quote]');
    await expect(form).not.toHaveAttribute('data-service-context');
    await expect(form.locator('input[name="service_context"]')).toHaveCount(0);
  });
}

test('manual category change synchronizes the public URL and localized language links',async({page})=>{
  await page.goto('/requestaquote/?service=brand');
  await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1,{timeout:10000});
  await page.locator('input[name="category"][value="event"]:not([data-private-event])').check();
  await expect(page).toHaveURL(/service=event/);
  await expect(page.locator('[data-smart-quote] input[name="service_context"]')).toHaveValue('event');
  for(const link of await page.locator('.lang-switch a[hreflang]').all()) await expect(link).toHaveAttribute('href',/service=event/);
});

const serviceRoutes=[
  {
    "route": "/portrait/index.html",
    "service": "portrait",
    "category": "individual",
    "kind": "commercial"
  },
  {
    "route": "/lifestyle/index.html",
    "service": "brand",
    "category": "brand",
    "kind": "commercial"
  },
  {
    "route": "/event-photography/index.html",
    "service": "event",
    "category": "event",
    "kind": "commercial"
  },
  {
    "route": "/hu/portre/index.html",
    "service": "portrait",
    "category": "individual",
    "kind": "commercial"
  },
  {
    "route": "/hu/brand/index.html",
    "service": "brand",
    "category": "brand",
    "kind": "commercial"
  },
  {
    "route": "/hu/rendezvenyfotozas/index.html",
    "service": "event",
    "category": "event",
    "kind": "commercial"
  },
  {
    "route": "/de-at/portrait/index.html",
    "service": "portrait",
    "category": "individual",
    "kind": "commercial"
  },
  {
    "route": "/de-at/brand/index.html",
    "service": "brand",
    "category": "brand",
    "kind": "commercial"
  },
  {
    "route": "/de-at/eventfotografie/index.html",
    "service": "event",
    "category": "event",
    "kind": "commercial"
  },
  {
    "route": "/glamour/index.html",
    "service": "fine-art",
    "category": "art",
    "kind": "fine-art"
  },
  {
    "route": "/hu/muveszi-fotografia/index.html",
    "service": "fine-art",
    "category": "art",
    "kind": "fine-art"
  },
  {
    "route": "/de-at/fine-art/index.html",
    "service": "fine-art",
    "category": "art",
    "kind": "fine-art"
  }
];
for(const item of serviceRoutes){
  test(item.route+' carries its service into the localized quote builder',async({page})=>{
    await page.goto(item.route);
    const selector=item.kind==='commercial'?'#next-step article.card:first-child a.btn-link':'#private-conversation a.btn-primary';
    const link=page.locator(selector).first();
    await expect(link).toHaveAttribute('href',new RegExp('\\?service='+item.service+'$'));
    await link.click();
    await expect(page).toHaveURL(new RegExp('service='+item.service));
    await expect(page.locator('[data-pricing-ready="true"]')).toHaveCount(1,{timeout:10000});
    const categorySelector='input[name="category"][value="'+item.category+'"]'+(item.category==='event'?':not([data-private-event])':'');
    await expect(page.locator(categorySelector).first()).toBeChecked();
    await expect(page.locator('[data-smart-quote] input[name="service_context"]')).toHaveValue(item.service);
  });
}
