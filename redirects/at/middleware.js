export const config = { matcher: '/:path*' };

const ROUTES = {"/":"/de-at/","/about/":"/de-at/werk/","/accessibility/":"/de-at/barrierefreiheit/","/archive/":"/de-at/archiv/","/case-studies/peter-magyar-portrait-2026/":"/de-at/fallstudien/peter-magyar-portraet-2026/","/contact/":"/de-at/kontakt/","/cookie-policy/":"/de-at/cookies/","/de-at/":"/de-at/","/de-at/agb/":"/de-at/agb/","/de-at/anfrage/":"/de-at/anfrage/","/de-at/archiv/":"/de-at/archiv/","/de-at/barrierefreiheit/":"/de-at/barrierefreiheit/","/de-at/brand/":"/de-at/brand/","/de-at/cookies/":"/de-at/cookies/","/de-at/datenschutz/":"/de-at/datenschutz/","/de-at/eventfotografie/":"/de-at/eventfotografie/","/de-at/fallstudien/peter-magyar-portraet-2026/":"/de-at/fallstudien/peter-magyar-portraet-2026/","/de-at/faq/":"/de-at/faq/","/de-at/fine-art/":"/de-at/fine-art/","/de-at/impressum/":"/de-at/impressum/","/de-at/kontakt/":"/de-at/kontakt/","/de-at/partner/":"/de-at/partner/","/de-at/portrait/":"/de-at/portrait/","/de-at/speier-viko/":"/de-at/speier-viko/","/de-at/vertrauen/":"/de-at/vertrauen/","/de-at/werk/":"/de-at/werk/","/event-photography/":"/de-at/eventfotografie/","/faq/":"/de-at/faq/","/glamour/":"/de-at/fine-art/","/hu/":"/de-at/","/hu/adatvedelem/":"/de-at/datenschutz/","/hu/ajanlatkeres/":"/de-at/anfrage/","/hu/akadalymentesseg/":"/de-at/barrierefreiheit/","/hu/archivum/":"/de-at/archiv/","/hu/aszf/":"/de-at/agb/","/hu/bizalom/":"/de-at/vertrauen/","/hu/brand/":"/de-at/brand/","/hu/eletmu/":"/de-at/werk/","/hu/esettanulmanyok/magyar-peter-portre-2026/":"/de-at/fallstudien/peter-magyar-portraet-2026/","/hu/gyik/":"/de-at/faq/","/hu/impresszum/":"/de-at/impressum/","/hu/kapcsolat/":"/de-at/kontakt/","/hu/muveszi-fotografia/":"/de-at/fine-art/","/hu/partnerek/":"/de-at/partner/","/hu/portre/":"/de-at/portrait/","/hu/rendezvenyfotozas/":"/de-at/eventfotografie/","/hu/speier-viko/":"/de-at/speier-viko/","/hu/sutik/":"/de-at/cookies/","/impressum/":"/de-at/impressum/","/lifestyle/":"/de-at/brand/","/partners/":"/de-at/partner/","/portrait/":"/de-at/portrait/","/privacy-policy/":"/de-at/datenschutz/","/requestaquote/":"/de-at/anfrage/","/speier-viko/":"/de-at/speier-viko/","/terms-conditions/":"/de-at/agb/","/trust/":"/de-at/vertrauen/"};
const CANONICAL = "https://www.norbertbanhalmi.com";
const FALLBACK = "/de-at/";

function lookupPath(pathname) {
  if (ROUTES[pathname]) return ROUTES[pathname];
  if (pathname !== '/' && !pathname.endsWith('/')) return ROUTES[pathname + '/'] || null;
  return null;
}

export default function middleware(request) {
  const incoming = new URL(request.url);
  const targetPath = lookupPath(incoming.pathname) || FALLBACK;
  const target = new URL(targetPath, CANONICAL);
  target.search = incoming.search;
  return new Response(null, {
    status: 308,
    headers: {
      Location: target.href,
      'Cache-Control': 'public, max-age=0, s-maxage=86400'
    }
  });
}
