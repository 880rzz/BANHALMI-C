# BANHALMI-C - javítási és kiadászárási prompt

## Feladat

Folytasd a `880rzz/BANHALMI-C` meglévő #119 javítását. Ez nem új általános audit. A cél: az emberi szöveg, a magyar/angol/német szolgáltatásválasztás, az áradatok, a kalkulátor, a PDF és a beküldött adatok ugyanazt a valós szolgáltatást jelentsék.

Az ügyfél útja: **cél -> megfelelő csomag -> benne foglalt tartalom -> felárak -> tájékoztató becslés -> írásos egyeztetés**. Ne adj újabb magyarázó réteget, ha egy ellentmondás vagy ismétlés megszüntetése elegendő.

## Határok és aktuális állapot

Kizárólag a BANHALMI-C repót módosítsd. A `880rzz/ART` és a Wix blog csak olvasható; az ART-on másik munkafolyamat dolgozik. Az ART régi `/glamour/#service` hivatkozásáról és nyelvi eltéréseiről külön átadás készüljön, ott ne legyen commit vagy deploy.

Minden írás előtt olvasd vissza az aktuális `main` és PR-head SHA-t. Történeti kiindulás: main `9f55a682a0f9f2dbbbe7fc2cb9b542ca40d4f21b`; #119 head `a2beb5a5d067803aa6df83c38acb8d3e6a95c68c`; branch `fix/pricing-content-parity-20261006`. Ezek ellenőrzendő referenciaértékek, nem vakon használandó aktuális adatok.

A #119 és a külön `BANHALMI-C-clarity-remediation-20261006.zip` nem azonos. Valódi diff alapján egyeztesd őket; ne írj vissza régi teljes fájlokat, és ne írd felül másik munkafolyamat változását.

## Javítási követelmények

1. Mindhárom nyelven különüljön el a szakmai művészportfólió és a személyes Fine Art. A Fine Art nem jelent automatikusan aktot. A Professional a megrendelés és az aktuális ár forrása; az ART az életműé és a kiállítási dokumentációé.
2. A csomagösszehasonlítás mutassa az időkeretet, a retusált képek számát, annak projektenkénti vagy személyenkénti értelmét, a további képek díját, a kiszállást és a becslés nem kötelező státuszát. HU: forint elsőként, a rögzített 400 HUF/EUR árszabási aránnyal. EN/DE: euró elsőként.
3. A családi esemény kártyájának címkéje a saját rádiógombját aktiválja. Kattintással, billentyűzettel és oda-vissza kategóriaváltással is teszteld.
4. A családi árak a meglévő `private-event-pricing.json` adataiból származzanak: 1/2/3/4 óra = 390/590/790/990 EUR. Az alapárakat, az adószabályt, a kiegészítőket és a vállalati díjakat ne változtasd meg.
5. A csomagban foglalt bécsi/budapesti városi kiszálláshoz legyen explicit városválasztás és pontos cím. A külső helyszín nem stúdió. A város és ország legyen összhangban. A díjmentesség ne terjedjen ki automatikusan más helyszínre. Szabad szövegből ne találj ki városhatárt.
6. Szüntesd meg a globális vállalati ártábla családi árakra történő időzített átírását. A privát adatvetület a canonical privát adatokból származzon; az egyezést teszt védje. Kategóriaváltás után se szivárogjon át családi ár a vállalati opciókra.
7. A kalkulátor, a PDF és a payload azonos szolgáltatási kontextust, canonical csomagkódot, városi jogosultságot, utazási tételt, nettót, adót és bruttót mutasson. A meglévő backend-mezőket ne törd el. Családi vagy Business esemény ne kapjon téves C-Level elnevezést.
8. A #119 elavult szövegegyezési tesztjeit a jóváhagyott új szöveghez igazítsd. Az interakciós, kontextus- és összegellenőrzéseket tartsd meg. Ne hagyj ki bukó tesztet, és ne csökkents Lighthouse-küszöböt.

## Védett rétegek

Maradjon ép a title/meta/H1, canonical/hreflang, sitemap, indexelés, JSON-LD, személy/szervezet szereposztás, telephely-, telefon- és csatornatulajdonlás, bizonyítékok és hozzájárulás-kezelés. Nem keletkezhet új, erősebb gépi állítás a látható oldalnál. Nincs garantált Google-rangsor, AI-ajánlás vagy jogi megfelelőségi tanúsítás.

## Kötelező elfogadási esetek

- Kétórás családi fotózás Bécsen/Budapesten belül, pontos címmel: 590 EUR / 236 000 HUF, városi kiszállás 0; a helyszín továbbra is külső helyszín.
- Ugyanez városon kívüli AT/HU standard kiszállással, egy járművel: 830 EUR / 332 000 HUF. Más országban az utazás egyedi; a részösszeg nem végleges teljes ár.
- Vállalati C-Level két óra plusz standard kiszállás: 1130 EUR; Business egy óra plusz kiszállás: 730 EUR. Családi -> vállalati -> családi váltás után is.
- Hiányzó vagy ellentmondó város/ország/cím ne eredményezzen érvényes díjmentes kiszállást.
- Képszám, további fotós, kiegészítők, HUF/EUR, adóstátusz, időtartam és reset ne regresszáljon.
- PDF-letöltés és elfogott POST: azonos szolgáltatás és összegek. Ne küldj tesztlevelet éles címre. Az elfogott POST nem bizonyítja a külső Cloudflare backend validálását vagy az email-kézbesítést: az külön staging-integrációs kapu.
- Teljes `npm test`, eredeti és új E2E, Chromium/WebKit, kritikus 375-3840 px megjelenítések, mobil/desktop Lighthouse és valódi képernyőképes ellenőrzés.

## Kiadás és lezárás

Ne írj közvetlenül mainre. A saját branchre dolgozz, frissítsd a #119 leírását. Csak az exact head teljes zöld CI-je után merge-elj `expected_head_sha` megadásával. Ezután ellenőrizd az új main SHA-t, az immutable artifactot, deploymentet, a custom domain `deployment-sha.txt` válaszát, az érintett HTML/JS/JSON byte-egyezést és a renderelt oldalt.

Reverse audit: a build/restore/generator útvonalak és cache-kulcsok ne írhassák vissza a hibát. Külön jelentsd: helyileg tesztelt, PR-ben, CI-ellenőrzött, deployolt, exact-live ellenőrzött, illetve külső backenddel még nem igazolt. Csak valódi tesztszámot és visszaolvasott SHA-t közölj. A merge vagy a zöld CI önmagában nem production-bizonyíték. A blokkoló okot nevezd meg; ne ígérj nem létező háttérmunkát.
