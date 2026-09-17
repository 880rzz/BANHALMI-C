import fs from 'node:fs';
import path from 'node:path';

const skip = new Set(['.git', '.github', 'node_modules', 'artifacts']);
const variants = [
  {
    heading: 'Contact', vienna: 'Vienna studio', budapest: 'Budapest studio',
    contactHref: '/contact/', contactLabel: 'Contact', whatsapp: 'WhatsApp +43 677 616 55592'
  },
  {
    heading: 'Kontakt', vienna: 'Studio Wien', budapest: 'Studio Budapest',
    contactHref: '/de-at/kontakt/', contactLabel: 'Kontakt', whatsapp: 'WhatsApp +43 677 616 55592'
  },
  {
    heading: 'Kapcsolat', vienna: 'Bécsi stúdió', budapest: 'Budapesti stúdió',
    contactHref: '/hu/kapcsolat/', contactLabel: 'Kapcsolat', whatsapp: 'WhatsApp +43 677 616 55592'
  }
];

function footer(variant) {
  return `<h3 class="footer-heading">${variant.heading}</h3><ul class="footer-contact-list"><li class="footer-studio"><strong><a class="footer-studio-link" href="https://maps.app.goo.gl/QsMeDA8Bgq5yKxAo8">${variant.vienna}</a></strong><span class="footer-address">Schwedenplatz 2, Top 8–9, 1010 Wien</span><a class="footer-phone" href="tel:+4367761655592">+43 677 616 55592</a><a class="footer-whatsapp" href="https://wa.me/4367761655592" rel="noopener noreferrer" target="_blank">${variant.whatsapp}</a></li><li class="footer-studio"><strong><a class="footer-studio-link" href="https://maps.app.goo.gl/nEvcjbCA1wmgQtXJA">${variant.budapest}</a></strong><span class="footer-address">Lágymányosi u. 15, 1111 Budapest</span><a class="footer-phone" href="tel:+36704698397">+36 70 469 8397</a></li></ul><div class="footer-contact-actions"><a href="${variant.contactHref}">${variant.contactLabel}</a><a href="mailto:hello@norbertbanhalmi.com">hello@norbertbanhalmi.com</a></div>`;
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
      /* Trust-center landing pages intentionally use the short legal footer;
         they do not contain the operational contact component. */
      if (!variant) continue;
      const pattern = new RegExp(`<h3 class="footer-heading">${variant.heading}<\\/h3><ul class="footer-contact-list">.*?<\\/ul><\\/div>`, 's');
      if (!pattern.test(html)) throw new Error(`${full}: footer contact block not found`);
      const next = html.replace(pattern, `${footer(variant)}</div>`);
      if (next !== html) {
        fs.writeFileSync(full, next, 'utf8');
        changed += 1;
      }
    }
  }
}

walk();
console.log(`Executive footer normalized: ${changed}/${checked} localized footer contact blocks updated.`);
