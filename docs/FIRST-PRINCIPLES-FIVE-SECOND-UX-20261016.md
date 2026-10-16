# BANHALMI Professional — öt másodperces megértés, első elvek

Dátum: 2026-10-16. Integrációs ág: PR #151. Cél: gyorsabb megértés új arculat vagy marketingréteg hozzáadása nélkül.

## Alapelv

A látogató öt másodperc alatt tudjon válaszolni: **mit nyújt a BANHALMI, kinek, hol, és mi a következő lépés?** A kívánt élmény első elvekből építkező, radikálisan áttekinthető és fotográfia-központú. Nem utánozunk más márkát vagy személyt.

## Védett hierarchia

1. Kép és BANHALMI-azonosság: valódi fotográfia, nem dekoratív effekt.
2. A szolgáltatások neve: portré, headshot, branding, rendezvény; lokalizált EN/HU/DE megfogalmazással.
3. H1: megőrzi a jóváhagyott pozicionálást; nem alakul kulcsszóhalmazzá.
4. Első leíró mondat: **szolgáltatás + célközönség + Bécs/Budapest**, legfeljebb 200 karakter.
5. Második mondat/blokk: **kézzelfogható eredmény**, legfeljebb 210 karakter. Részletes folyamat és szakmai háttér lejjebb olvasható.
6. Egyetlen vizuálisan elsődleges CTA; a galéria és a videóhívás alárendelt, de elérhető.

## Technikai és tartalmi korlátok

- Egyetlen kanonikus CSS-forrás; nincs új override-réteg, vizuális keretrendszer vagy szükségtelen animáció.
- Az ismert 12 képernyőszélesség és mindhárom nyelv regressziós tesztje marad.
- A 12 szolgáltatásoldal elfogadott szövege, ára, alapértelmezetten zárt ármodulja változatlan.
- Szolgáltatásválasztás közvetlenül elérhető; a szolgáltatásnevek a hozzájuk tartozó URL-re mutatnak.
- Megmaradnak az indexelési, hreflang, sémákra, GDPR-ra, hozzáférhetőségre és 44 px-es interakciós felületekre vonatkozó követelmények.
- A fotók maradnak a vizuális bizonyítékok; nincs általános grafikai zaj, öncélú kártya vagy túlméretezett tipográfia.

## Most megvalósított rész

EN/HU/DE főoldali nyitó bekezdések szolgáltatás- és helyszínközpontúvá váltak, a második bekezdések több mint fele törölhető ismétlést vesztettek. A `tools/audit-homepage-five-second-clarity.mjs` statikus szerződés ellenőrzi a tömör, konkrét nyitást és az egyetlen elsődleges CTA-t. A tényleges **öt másodperces felhasználói megértés még nem került viselkedéses teszttel igazolásra**: szükséges valódi mobil/desktop render, első képernyőn látható információ audit és felhasználói próba. Nem állítható, hogy a mérhető öt másodperces cél már teljesült.
