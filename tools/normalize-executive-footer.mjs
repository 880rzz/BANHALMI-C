import fs from 'node:fs';
import path from 'node:path';

const skip = new Set(['.git', '.github', 'node_modules', 'artifacts']);
const variants = [
  {
    "heading": "Contact",
    "studioVienna": "Vienna studio",
    "officeVienna": "Vienna office",
    "studioBudapest": "Budapest studio",
    "officeNote": "Client meetings by appointment",
    "officeProfile": "Google Business Profile",
    "contactHref": "/contact/",
    "contactLabel": "Contact",
    "viennaPhoneHref": "+4367764733262",
    "viennaPhoneDisplay": "+43 677 647 332 62"
  },
  {
    "heading": "Kontakt",
    "studioVienna": "Studio Wien",
    "officeVienna": "Büro Wien",
    "studioBudapest": "Studio Budapest",
    "officeNote": "Kundentermine nach Vereinbarung",
    "officeProfile": "Google-Unternehmensprofil",
    "contactHref": "/de-at/kontakt/",
    "contactLabel": "Kontakt",
    "viennaPhoneHref": "+4367764733262",
    "viennaPhoneDisplay": "+43 677 647 332 62"
  },
  {
    "heading": "Kapcsolat",
    "studioVienna": "Bécsi stúdió",
    "officeVienna": "Bécsi iroda",
    "studioBudapest": "Budapesti stúdió",
    "officeNote": "Ügyféltalálkozás előzetes egyeztetéssel",
    "officeProfile": "Google Cégprofil",
    "contactHref": "/hu/kapcsolat/",
    "contactLabel": "Kapcsolat",
    "viennaPhoneHref": "+4367761655592",
    "viennaPhoneDisplay": "+43 677 616 55592"
  }
];

function footer(v) {
  return `<h3 class="footer-heading">${v.heading}</h3><ul class="footer-contact-list"><li class="footer-location footer-studio" data-location-role="studio"><strong><a class="footer-studio-link footer-location-link" href="https://maps.app.goo.gl/QsMeDA8Bgq5yKxAo8">${v.studioVienna}</a></strong><span class="footer-address">Schwedenplatz 2, Top 8–9, 1010 Wien</span><a class="footer-phone" href="tel:${v.viennaPhoneHref}">${v.viennaPhoneDisplay}</a></li><li class="footer-location footer-office" data-location-role="office"><strong><a class="footer-studio-link footer-location-link" href="https://g.page/r/CdO4Kej3jIkfEBM">${v.officeVienna}</a></strong><span class="footer-address">Gersthofer Straße 150–154/6/2, 1180 Wien</span><span class="footer-location-note">${v.officeNote}</span><a class="footer-location-profile" href="https://g.page/r/CdO4Kej3jIkfEBM">${v.officeProfile}</a></li><li class="footer-location footer-studio" data-location-role="studio"><strong><a class="footer-studio-link footer-location-link" href="https://maps.app.goo.gl/nEvcjbCA1wmgQtXJA">${v.studioBudapest}</a></strong><span class="footer-address">Lágymányosi u. 15, 1111 Budapest</span><a class="footer-phone" href="tel:+36704698397">+36 70 469 8397</a></li></ul><div class="footer-contact-actions"><a href="${v.contactHref}">${v.contactLabel}</a><a href="mailto:hello@norbertbanhalmi.com">hello@norbertbanhalmi.com</a><a class="footer-whatsapp" href="https://wa.me/${v.viennaPhoneHref.slice(1)}" rel="noopener noreferrer" target="_blank">WhatsApp ${v.viennaPhoneDisplay}</a></div>`;
}

let changed = 0;
let checked = 0;
function walk(dir = '.') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      let html = fs.readFileSync(full, 'utf8');
      if (!html.includes('class="site-footer"')) continue;
      checked += 1;
      const variant = variants.find((item) => html.includes(`<h3 class="footer-heading">${item.heading}</h3>`));
      if (!variant) continue;
      const pattern = new RegExp(`<h3 class="footer-heading">${variant.heading}<\\/h3><ul class="footer-contact-list">.*?<\\/ul><div class="footer-contact-actions">.*?<\\/div>`, 's');
      if (!pattern.test(html)) throw new Error(`${full}: footer contact block not found`);
      const next = html.replace(pattern, footer(variant));
      if (next !== html) { fs.writeFileSync(full, next, 'utf8'); changed += 1; }
    }
  }
}
walk();
console.log(`Executive footer normalized: ${changed}/${checked} localized footer contact blocks aligned to 3 physical locations.`);
