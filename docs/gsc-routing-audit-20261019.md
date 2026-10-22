# GSC routing audit — 2026-10-19

Window: 2026-09-19–2026-10-16. Professional: 556 visible query/page pairs; ART: 48; Blog: 14. Every response reports no remaining pagination. This window predates the new ecosystem release. GSC hides some queries, so this does not prove coverage of all searches. City is identified from query text; Search Console has no city dimension. HU/EN/DE × Budapest/Vienna maps to existing localized service pages, without inventing duplicate city pages.

## Findings

Not all observed service queries reach their intended service page. The table records individual query/page observations, not deduplicated query totals. General photographer and ambiguous portfolio queries require manual review; they are not automatically redirected. Brand searches may legitimately surface several ecosystem properties.

| Query | Observed | Recommended | Impressions | Position |
|---|---|---|---:|---:|
| photography | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/ | 433 | 1.67 |
| portré fotózás budapest | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/hu/portre/ | 49 | 4.22 |
| boudoir photography | https://www.norbertbanhalmi.com/hu/ | https://www.banhalmi.art/private-photography.html | 45 | 3 |
| photography | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/ | 44 | 3.77 |
| boudoir photography | https://www.norbertbanhalmi.com/de-at/ | https://www.banhalmi.art/private-photography.html | 31 | 3.16 |
| portré fotózás | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/hu/portre/ | 26 | 4.04 |
| boudoir photography | https://www.norbertbanhalmi.com/hu/ | https://www.banhalmi.art/private-photography.html | 21 | 5.19 |
| portré fotózás budapest | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/hu/portre/ | 21 | 10.86 |
| portraitfotografie | https://www.norbertbanhalmi.com/de-at/ | https://www.norbertbanhalmi.com/de-at/portrait/ | 19 | 3.58 |
| fotografie porträt | https://www.norbertbanhalmi.com/de-at/ | https://www.norbertbanhalmi.com/de-at/portrait/ | 18 | 3.11 |
| portré | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/hu/portre/ | 15 | 5.07 |
| professional photographer | https://www.norbertbanhalmi.com/de-at/ | https://www.norbertbanhalmi.com/ | 14 | 14.21 |
| budapest photographer | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/ | 13 | 1.62 |
| professional photographer | https://www.norbertbanhalmi.com/de-at/ | https://www.norbertbanhalmi.com/ | 13 | 6.31 |
| brand fotograf | https://www.norbertbanhalmi.com/ | https://www.norbertbanhalmi.com/de-at/brand/ | 12 | 8.17 |
| portréfotózás budapest | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/hu/portre/ | 12 | 21.17 |
| intim portré fotózás | https://www.norbertbanhalmi.com/hu/ | https://www.banhalmi.art/hu/private-photography.html | 11 | 6.18 |
| künstler portraits | https://www.norbertbanhalmi.com/ | https://www.norbertbanhalmi.com/de-at/portrait/ | 11 | 9.82 |
| personal brand fotografie wien | https://www.norbertbanhalmi.com/de-at/ | https://www.norbertbanhalmi.com/de-at/brand/ | 11 | 5.36 |
| portrait künstler | https://www.norbertbanhalmi.com/ | https://www.norbertbanhalmi.com/de-at/portrait/ | 11 | 3 |
| aktfotózás | https://www.norbertbanhalmi.com/hu/ | https://www.banhalmi.art/hu/exhibitions/ebredes.html | 10 | 6.7 |
| headshot | https://www.norbertbanhalmi.com/ | https://www.norbertbanhalmi.com/portrait/ | 10 | 3.7 |
| portraitfotografie | https://www.norbertbanhalmi.com/de-at/ | https://www.norbertbanhalmi.com/de-at/portrait/ | 10 | 5 |
| brand photographer | https://www.norbertbanhalmi.com/ | https://www.norbertbanhalmi.com/lifestyle/ | 9 | 9.56 |
| professzionális portré fotózás | https://www.norbertbanhalmi.com/hu/ | https://www.norbertbanhalmi.com/hu/portre/ | 9 | 6.22 |

## Six language/city cells

| Language | City in query | Visible pairs | Flagged Professional pairs |
|---|---|---:|---:|
| hu | Budapest | 31 | 8 |
| hu | Vienna | 3 | 1 |
| en | Budapest | 12 | 11 |
| en | Vienna | 2 | 2 |
| de | Budapest | 0 | 0 |
| de | Vienna | 13 | 12 |

## Action and limits

Artistic nude belongs to localized Ébredés, including current enquiries; general private portraits and boudoir use the ART private page. Professional portrait, branding, event and artist-portfolio intents use their existing service owners. Preserve brand homepages and existing prices. Do not redirect a homepage wholesale to fix search intent. Improve explicit, localized internal links and machine routing, then measure after production readback. Query language ambiguity is recorded rather than guessed. UTM variants are normalized only for destination comparison; raw evidence is retained. Cannibalization results include multiple languages and UTM URLs, so the reported count is not a count of true competing content pages.

Measurement starts after exact-live verification; allow at least 28 settled days for comparison. No ranking improvement or complete keyword routing is claimed.

Classification correction: the two observed Hungarian intimate-portrait variants belong to ART private photography, not Professional portrait. Their raw GSC observations and mismatch totals remain unchanged. The English brand owner is intentionally `/lifestyle/`, whose canonical service is brand photography.
