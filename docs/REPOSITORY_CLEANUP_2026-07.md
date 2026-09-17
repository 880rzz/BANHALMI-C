# Repository cleanup — July 2026

This cleanup removes files and code paths introduced solely for the now-removed standalone commercial gallery and six-service dropdown architecture. Photographic assets were not deleted because the same `/assets/img/**/gallery/` directories are still used by service pages, archive pages and structured-data records.

| Path | Action | Reason | References checked | Classification | Replacement |
| --- | --- | --- | --- | --- | --- |
| `gallery/index.html` | Deleted | Standalone curated commercial gallery route removed. | HTML, sitemap, llms files, services data, regression script. | Gallery-only public page. | Service pages: `/portrait/`, `/lifestyle/`, `/event-photography/`, `/glamour/`. |
| `hu/gallery/index.html` | Deleted | Standalone Hungarian gallery route removed. | HTML, sitemap, llms files, services data, regression script. | Gallery-only public page. | Service pages: `/hu/portre/`, `/hu/brand/`, `/hu/rendezvenyfotozas/`, `/hu/muveszi-fotografia/`. |
| `de-at/gallery/index.html` | Deleted | Standalone German gallery route removed. | HTML, sitemap, llms files, services data, regression script. | Gallery-only public page. | Service pages: `/de-at/portrait/`, `/de-at/brand/`, `/de-at/eventfotografie/`, `/de-at/fine-art/`. |
| `.nav-services`, `.nav-services-toggle`, `.nav-submenu` CSS | Removed | Six-service dropdown removed in favour of flat four-service navigation. | All HTML nav markup, shared CSS, regression script. | Obsolete navigation CSS. | Flat `.nav-links` menu. |
| Services dropdown JavaScript | Removed | Dropdown no longer exists. | Shared JS, all nav markup, regression script. | Obsolete navigation JS. | Existing mobile menu logic. |
| Commercial gallery lightbox bootstrap for `[data-gallery-lightbox]` | Removed | Standalone commercial gallery pages were deleted. | Gallery pages deleted, universal service-page lightbox retained. | Gallery-only JS. | Universal lightbox used by service galleries. |
| Gallery sitemap entries | Removed | Deleted routes must not be indexable. | `sitemap.xml`, regression script. | Obsolete SEO entries. | Four service URLs remain in sitemap. |

## Verification

- `rg` confirmed no `nav-services`, `nav-submenu` or `nav-services-toggle` references remain in production HTML/CSS/JS.
- `tools/audit-regression.mjs` fails if deleted gallery route files or `/gallery/`, `/hu/gallery/`, `/de-at/gallery/` route references return.
- Internal link and asset validation checks all remaining local `href` and `src` targets.


## Portrait-related standalone page search matrix

The cleanup pass explicitly searched all `index.html` directories, sitemap entries, canonical/hreflang clusters, JSON-LD blocks, `services.json`, `entity.jsonld`, `entity-graph.json`, `knowledge.json`, `llms.txt`, `llms-full.txt`, redirects, internal links, regression tests and documentation for standalone pages representing portrait sub-services outside the surviving Portrait pages.

| Searched separated service family | English standalone page result | Hungarian standalone page result | German standalone page result | Action |
| --- | --- | --- | --- | --- |
| Professional headshots | No standalone `/headshot/` or `/headshots/` page found. | No standalone `/hu/headshot/` page found. | No standalone `/de-at/headshot/` or `/de-at/headshots/` page found. | Terminology remains consolidated in Portrait pages. |
| Executive portrait photography | No standalone `/executive-portrait/` page found. | No standalone `/hu/executive-portre/` page found. | No standalone `/de-at/executive-portraet/` page found. | Terminology remains consolidated in Portrait pages. |
| C-level business portrait photography | No standalone `/c-level-business-photography/` page found. | No standalone `/hu/c-level-uzleti-fotozas/` page found. | No standalone `/de-at/c-level-businessfotografie/` page found. | Terminology remains consolidated in Portrait pages. |
| Lifestyle portraiture / personal visual positioning as individual-person services | No standalone `/lifestyle-portrait/` or `/visual-positioning/` page found. `/lifestyle/` is retained as the required Brand Photography URL and copy is organisation-focused. | No standalone `/hu/lifestyle-portre/` or `/hu/vizualis-pozicionalas/` page found. | No standalone `/de-at/lifestyle-portraet/` or `/de-at/visuelle-positionierung/` page found. | Individual lifestyle and personal visual-positioning copy remains consolidated in Portrait; organisational lifestyle/campaign imagery remains under Brand. |

Result: no extra English/Hungarian/German content-bearing portrait-subservice page families remained to migrate or delete. The redundant URLs actually present in the repository were legacy redirect-only routes, listed below, and were removed so they cannot act as duplicate static pages.

## Additional redundant route cleanup — July 2026 follow-up

The second cleanup pass searched every `index.html` directory, `sitemap.xml`, JSON/JSON-LD service data, AI/GEO files, internal links, regression tests and documentation for standalone routes that no longer fit the four-service architecture. No additional headshot/executive/C-level portrait content pages were found beyond the surviving `/portrait/`, `/hu/portre/` and `/de-at/portrait/` pages; useful portrait-range copy had already been consolidated there. The pass did find legacy redirect-only HTML routes that could still behave as duplicate public URLs on static hosting, so they were removed and documented for production-level redirects.

| Deleted path | Former purpose | Surviving destination | Content migrated to | Sitemap removal | Schema removal | Redirect status |
| --- | --- | --- | --- | --- | --- | --- |
| `de/portrait/index.html` | Legacy German redirect alias for the portrait service. | `/de-at/portrait/` | Existing German portrait page; no unique copy in redirect page. | Not present in sitemap before deletion. | No standalone Service node; redirect page removed. | Configure production 301: `/de/portrait/` → `/de-at/portrait/`. |
| `de/brand/index.html` | Legacy German redirect alias for the brand service. | `/de-at/brand/` | Existing German brand page; no unique copy in redirect page. | Not present in sitemap before deletion. | No standalone Service node; redirect page removed. | Configure production 301: `/de/brand/` → `/de-at/brand/`. |
| `de/eventfotografie/index.html` | Legacy German redirect alias for the C-Level Event service. | `/de-at/eventfotografie/` | Existing German event page; no unique copy in redirect page. | Not present in sitemap before deletion. | No standalone Service node; redirect page removed. | Configure production 301: `/de/eventfotografie/` → `/de-at/eventfotografie/`. |
| `de/fine-art/index.html` | Legacy German redirect alias for the fine-art service. | `/de-at/fine-art/` | Existing German fine-art page; no unique copy in redirect page. | Not present in sitemap before deletion. | No standalone Service node; redirect page removed. | Configure production 301: `/de/fine-art/` → `/de-at/fine-art/`. |
| `de-at/glamour/index.html` | Legacy German fine-art/glamour redirect route. | `/de-at/fine-art/` | Existing German fine-art page; no unique copy in redirect page. | Not present in sitemap before deletion. | No standalone Service node; redirect page removed. | Configure production 301: `/de-at/glamour/` → `/de-at/fine-art/`. |
| `mybest/index.html` | Legacy gallery redirect route. | Artistic archive / surviving service pages, depending campaign context. | No unique service copy; standalone commercial gallery has been removed. | Not present in sitemap before deletion. | No standalone Service node; redirect page removed. | Configure production 301: `/mybest/` → `https://www.banhalmi.art/#works` or a current archive destination. |
| `de-at/mybest/index.html` | Legacy German gallery redirect route. | Artistic archive / surviving German service pages, depending campaign context. | No unique service copy; standalone commercial gallery has been removed. | Not present in sitemap before deletion. | No standalone Service node; redirect page removed. | Configure production 301: `/de-at/mybest/` → `https://www.banhalmi.art/#works` or a current archive destination. |

Because this static repository does not currently contain a hosting-native redirect configuration file, the HTML redirect pages were not retained as duplicate public pages. The production hosting layer should implement the 301 rules above.
