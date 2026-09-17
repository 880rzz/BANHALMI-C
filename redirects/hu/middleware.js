export const config = { matcher: '/:path*' };

const ROUTES = {"/":"/hu/","/about/":"/hu/eletmu/","/accessibility/":"/hu/akadalymentesseg/","/archive/":"/hu/archivum/","/case-studies/peter-magyar-portrait-2026/":"/hu/esettanulmanyok/magyar-peter-portre-2026/","/contact/":"/hu/kapcsolat/","/cookie-policy/":"/hu/sutik/","/de-at/":"/hu/","/de-at/agb/":"/hu/aszf/","/de-at/anfrage/":"/hu/ajanlatkeres/","/de-at/archiv/":"/hu/archivum/","/de-at/barrierefreiheit/":"/hu/akadalymentesseg/","/de-at/brand/":"/hu/brand/","/de-at/cookies/":"/hu/sutik/","/de-at/datenschutz/":"/hu/adatvedelem/","/de-at/eventfotografie/":"/hu/rendezvenyfotozas/","/de-at/fallstudien/peter-magyar-portraet-2026/":"/hu/esettanulmanyok/magyar-peter-portre-2026/","/de-at/faq/":"/hu/gyik/","/de-at/fine-art/":"/hu/muveszi-fotografia/","/de-at/impressum/":"/hu/impresszum/","/de-at/kontakt/":"/hu/kapcsolat/","/de-at/partner/":"/hu/partnerek/","/de-at/portrait/":"/hu/portre/","/de-at/speier-viko/":"/hu/speier-viko/","/de-at/vertrauen/":"/hu/bizalom/","/de-at/werk/":"/hu/eletmu/","/event-photography/":"/hu/rendezvenyfotozas/","/faq/":"/hu/gyik/","/glamour/":"/hu/muveszi-fotografia/","/hu/":"/hu/","/hu/adatvedelem/":"/hu/adatvedelem/","/hu/ajanlatkeres/":"/hu/ajanlatkeres/","/hu/akadalymentesseg/":"/hu/akadalymentesseg/","/hu/archivum/":"/hu/archivum/","/hu/aszf/":"/hu/aszf/","/hu/bizalom/":"/hu/bizalom/","/hu/brand/":"/hu/brand/","/hu/eletmu/":"/hu/eletmu/","/hu/esettanulmanyok/magyar-peter-portre-2026/":"/hu/esettanulmanyok/magyar-peter-portre-2026/","/hu/gyik/":"/hu/gyik/","/hu/impresszum/":"/hu/impresszum/","/hu/kapcsolat/":"/hu/kapcsolat/","/hu/muveszi-fotografia/":"/hu/muveszi-fotografia/","/hu/partnerek/":"/hu/partnerek/","/hu/portre/":"/hu/portre/","/hu/rendezvenyfotozas/":"/hu/rendezvenyfotozas/","/hu/speier-viko/":"/hu/speier-viko/","/hu/sutik/":"/hu/sutik/","/impressum/":"/hu/impresszum/","/lifestyle/":"/hu/brand/","/partners/":"/hu/partnerek/","/portrait/":"/hu/portre/","/privacy-policy/":"/hu/adatvedelem/","/requestaquote/":"/hu/ajanlatkeres/","/speier-viko/":"/hu/speier-viko/","/terms-conditions/":"/hu/aszf/","/trust/":"/hu/bizalom/"};
const CANONICAL = "https://www.norbertbanhalmi.com";
const FALLBACK = "/hu/";

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
