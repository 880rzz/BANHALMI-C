import { test, expect } from '@playwright/test';

const routes=[
  "/glamour/",
  "/hu/muveszi-fotografia/",
  "/de-at/fine-art/"
];
for(const route of routes){
  test(route+' keeps the private Fine Art journey focused and complete',async({page})=>{
    await page.addInitScript(()=>{
      const now=Date.now();
      localStorage.setItem('banhalmi_consent_v3',JSON.stringify({choice:'essential',version:'3.0',savedAt:now,expiresAt:now+180*24*60*60*1000}));
    });
    await page.goto(route);
    const hero=page.locator('[data-fine-art-private-journey="stage23"]');
    await expect(hero).toHaveCount(1);
    await expect(page.locator('.hero.service-hero [data-fine-art-resource]')).toHaveCount(0);
    await expect(page.locator('#archive-references [data-fine-art-resource]')).toHaveCount(2);
    await hero.locator('a[href="#fine-art-selected-work"]').click({force:true});
    await expect(page).toHaveURL(/#fine-art-selected-work$/);
    await expect(page.locator('#fine-art-selected-work')).toBeVisible();
    await page.goto(route);
    await page.locator('[data-fine-art-private-journey="stage23"] a[href="#private-conversation"]').click({force:true});
    await expect(page).toHaveURL(/#private-conversation$/);
    await expect(page.locator('#private-conversation')).toBeVisible();
    await page.goto(route);

    const legacyDrawer=page.locator('details[data-fine-art-archive="stage23"]');
    const continuous=page.locator('[data-fine-art-archive="stage79"]');
    const drawerCount=await legacyDrawer.count();
    const continuousCount=await continuous.count();
    expect(drawerCount+continuousCount).toBe(1);

    const extendedCount=await page.locator('[data-archive-extended]').count();
    expect(extendedCount).toBeGreaterThan(0);
    const archiveRoot=continuousCount?continuous:legacyDrawer;
    await expect(archiveRoot.locator('[data-archive-extended]')).toHaveCount(extendedCount);

    if(continuousCount){
      await expect(page.locator('.fine-art-archive-summary-copy,.fine-art-archive-action,.fine-art-archive-toggle')).toHaveCount(0);
      await expect(page.getByText(/Extended artistic archive|Bővített művészeti archívum|Erweitertes Kunstarchiv/i)).toHaveCount(0);
    }else{
      await expect(legacyDrawer).not.toHaveAttribute('open','');
    }

    const restrictedCount=await page.locator('figure[data-age-restricted="true"]').count();
    expect(restrictedCount).toBeGreaterThan(0);
    await expect(page.locator('figure[data-age-restricted="true"] img.age-restricted-preview')).toHaveCount(restrictedCount);
    const coreButton=page.locator('#fine-art-selected-work > .wrap > .collage-gallery > figure:not([data-age-restricted]) button[data-lightbox-src]').first();
    await coreButton.click({force:true});
    await expect(page.locator('[data-universal-lightbox]')).toHaveClass(/open/);
    await page.locator('.universal-lightbox-close').click({force:true});
    if(!continuousCount)await legacyDrawer.locator('summary').click({force:true});
    if(!continuousCount)await expect(legacyDrawer).toHaveAttribute('open','');
    const archiveButton=archiveRoot.locator('figure:not([data-age-restricted]) button[data-lightbox-src]').first();
    await archiveButton.click({force:true});
    await expect(page.locator('[data-universal-lightbox]')).toHaveClass(/open/);
    await expect(page.locator('[data-universal-lightbox]')).toHaveAttribute('aria-hidden','false');
  });
}
