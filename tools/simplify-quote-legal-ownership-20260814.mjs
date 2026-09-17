import fs from 'node:fs';

const pages=[
 {file:'requestaquote/index.html',terms:'/terms-conditions/',privacy:'/privacy-policy/',bridge:`<section class="section-band quote-legal-bridge" data-quote-legal-owner="terms"><div class="wrap"><div class="section-head reveal"><span class="eyebrow">Commercial clarity</span><h2>The estimate is not the contract</h2><p>The calculator is an orientation tool. Fees, booking, payment, delivery and usage rights become binding only in the accepted written offer together with the Terms &amp; Conditions.</p></div><div class="service-actions"><a class="btn-link" href="/terms-conditions/">Read the Terms &amp; Conditions →</a><a class="btn-link" href="/privacy-policy/">Privacy Notice →</a></div></div></section>`},
 {file:'hu/ajanlatkeres/index.html',terms:'/hu/aszf/',privacy:'/hu/adatvedelem/',bridge:`<section class="section-band quote-legal-bridge" data-quote-legal-owner="terms"><div class="wrap"><div class="section-head reveal"><span class="eyebrow">Pénzügyi átláthatóság</span><h2>A kalkuláció nem szerződés</h2><p>A kalkulátor tájékoztató eszköz. A díj, foglalás, fizetés, átadás és képfelhasználás akkor válik kötelezővé, amikor az írásos ajánlatot elfogadják; az ajánlat és az ÁSZF együtt irányadó.</p></div><div class="service-actions"><a class="btn-link" href="/hu/aszf/">ÁSZF megnyitása →</a><a class="btn-link" href="/hu/adatvedelem/">Adatkezelési tájékoztató →</a></div></div></section>`},
 {file:'de-at/anfrage/index.html',terms:'/de-at/agb/',privacy:'/de-at/datenschutz/',bridge:`<section class="section-band quote-legal-bridge" data-quote-legal-owner="terms"><div class="wrap"><div class="section-head reveal"><span class="eyebrow">Kaufmännische Klarheit</span><h2>Die Kalkulation ist kein Vertrag</h2><p>Der Kalkulator dient der Orientierung. Honorar, Buchung, Zahlung, Übergabe und Bildnutzung werden erst mit dem angenommenen schriftlichen Angebot verbindlich; Angebot und AGB gelten gemeinsam.</p></div><div class="service-actions"><a class="btn-link" href="/de-at/agb/">AGB öffnen →</a><a class="btn-link" href="/de-at/datenschutz/">Datenschutzerklärung →</a></div></div></section>`}
];
function range(html){
 const m=/<section\b[^>]*class=["'][^"']*payment-invoicing-clarity[^"']*["'][^>]*>/i.exec(html);if(!m)throw new Error('payment-invoicing-clarity section missing');
 let depth=1;const re=/<\/?section\b[^>]*>/gi;re.lastIndex=m.index+m[0].length;let t;
 while((t=re.exec(html))){depth+=/^<section\b/i.test(t[0])?1:-1;if(depth===0)return{start:m.index,end:re.lastIndex}}
 throw new Error('payment-invoicing-clarity unclosed');
}
for(const p of pages){
 let html=fs.readFileSync(p.file,'utf8');
 if(/data-quote-legal-owner=["']terms["']/i.test(html))throw new Error(`${p.file}: already simplified`);
 const r=range(html);html=html.slice(0,r.start)+p.bridge+html.slice(r.end);
 if(/payment-invoicing-clarity/i.test(html))throw new Error(`${p.file}: old payment legal block survived`);
 if(!html.includes(p.terms)||!html.includes(p.privacy))throw new Error(`${p.file}: canonical legal links missing`);
 fs.writeFileSync(p.file,html);console.log(`${p.file}: replaced duplicated payment rules with canonical legal bridge.`);
}
