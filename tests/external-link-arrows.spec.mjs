import {test,expect} from '@playwright/test';

const routes=[
 '/','/hu/','/de-at/',
 '/portrait/','/hu/portre/','/de-at/portrait/',
 '/lifestyle/','/hu/brand/','/de-at/brand/',
 '/event-photography/','/hu/rendezvenyfotozas/','/de-at/eventfotografie/',
 '/fine-art/','/hu/muveszi-fotografia/','/de-at/fine-art/'
];

for(const route of routes){
 test(route+' renders only off-site text-link arrows',async({page})=>{
  await page.goto(route);
  const errors=await page.evaluate(()=>{
   const canonicalHost=h=>String(h||'').toLowerCase().replace(/^www\./,'');
   const local=canonicalHost(location.hostname);
   const violations=[];
   for(const a of document.querySelectorAll('a[href]')){
    const raw=a.getAttribute('href');
    let url=null;
    try{url=new URL(raw,document.baseURI);}catch{}
    const offsite=!!url&&['https:','http:'].includes(url.protocol)
      && canonicalHost(url.hostname)!==local
      && canonicalHost(url.hostname)!=='norbertbanhalmi.com';
    const excluded=a.matches('.brand,.footer-wko-profile,.btn,.btn-primary,.btn-secondary,.btn-ghost,.nav-cta,[role="button"]')
      || !!a.querySelector('img,picture,svg,video');
    const text=(a.textContent||'').replace(/\u2197/g,'').trim();
    const expected=offsite&&!excluded&&!!text;
    const glyphs=[...a.querySelectorAll(':scope > .banhalmi-link-arrow')];
    if(expected){
      if(glyphs.length!==1||glyphs[0].getAttribute('aria-hidden')!=='true')
        violations.push('external arrow: '+raw+' ('+glyphs.length+')');
    }else if(glyphs.length||/↗\s*$/.test(a.textContent||'')){
      violations.push('forbidden arrow: '+raw);
    }
   }
   return violations;
  });
  expect(errors).toEqual([]);
 });
}

test('added links and URL changes preserve external-only arrows and accessible labels',async({page})=>{
 await page.goto('/');
 await page.evaluate(()=>{
  const host=document.createElement('div');
  host.id='bn-external-arrow-test';
  host.innerHTML=[
   '<a id="bn-int" href="/hu/portre/">Internal ↗</a>',
   '<a id="bn-absolute-int" href="https://www.norbertbanhalmi.com/de-at/portrait/">Internal absolute</a>',
   '<a id="bn-external" href="https://example.org/guide">Outside ↗</a>',
   '<a id="bn-mail" href="mailto:test@example.org">Email ↗</a>',
   '<a id="bn-external-button" class="btn" href="https://example.org/">Button ↗</a>'
  ].join('');
  document.body.appendChild(host);
 });
 await expect(page.locator('#bn-int .banhalmi-link-arrow')).toHaveCount(0);
 await expect(page.locator('#bn-absolute-int .banhalmi-link-arrow')).toHaveCount(0);
 await expect(page.locator('#bn-mail .banhalmi-link-arrow')).toHaveCount(0);
 await expect(page.locator('#bn-external-button .banhalmi-link-arrow')).toHaveCount(0);
 await expect(page.locator('#bn-external .banhalmi-link-arrow')).toHaveCount(1);
 await expect(page.locator('#bn-external .banhalmi-link-arrow')).toHaveAttribute('aria-hidden','true');
 await expect(page.locator('#bn-external')).toHaveAccessibleName('Outside');
 await page.locator('#bn-external').evaluate(a=>a.setAttribute('href','/portrait/'));
 await expect(page.locator('#bn-external .banhalmi-link-arrow')).toHaveCount(0);
 await page.locator('#bn-int').evaluate(a=>a.setAttribute('href','https://example.org/new'));
 await expect(page.locator('#bn-int .banhalmi-link-arrow')).toHaveCount(1);
 await expect(page.locator('#bn-int')).toHaveAccessibleName('Internal');
});
