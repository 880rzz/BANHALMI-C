# BANHALMI production audit — July 2026

## Executive Summary
Production readiness improved for the screenshot-confirmed P0/P1 quote, navigation, repeated-process, checkbox, line-breaking and gallery issues. External production submissions to Google Apps Script / Cloudflare Worker remain partially unverified without service credentials and live inbox/spreadsheet access.

## Scores before and after
| Area | Before | After | Evidence |
|---|---:|---:|---|
| SEO | 7 | 8 | Gallery canonical/hreflang/sitemap added; repeated process sections reduced. |
| GEO | 7 | 7 | No unverified entity claims added. |
| Schema | 7 | 7 | No review/product schema added; JSON checked. |
| GDPR | 7 | 7 | Consent code retained; legal text requires human legal review. |
| UX | 6 | 8 | Six-service menu, gallery destination, and quote estimate display fixed. |
| UI | 6 | 8 | Checkbox/radio rows and text wrapping corrected. |
| Content | 7 | 8 | Repeated strategy-process block removed from non-decision pages. |
| Structure | 6 | 8 | Service IA aligned across nav, cards and sitemap checks. |
| Accessibility | 6 | 8 | Keyboard-ready Services disclosure and true input labels retained. |
| Performance | 6 | 7 | Repeated DOM sections removed; gallery uses lazy loading after first row. |
| Security | 7 | 7 | No new secrets introduced; external endpoints need live review. |
| Quote calculator | 5 | 8 | Summary DOM scope fixed and automated checks added. |
| Form submission | 6 | 7 | Submit remains blocked when pricing unavailable; live backend not proven. |
| Overall production readiness | 6 | 8 | P0/P1 screenshot issues fixed with regression checks. |

## Baseline and changed IA

## Screenshot-confirmed UX and functional defects
- **SC-01 / P1 / repeated process block**: Root cause was repeated static section markup across service, contact and profile pages. Fix removed non-essential `strategic-partnership-section` instances from HTML, not by CSS hiding. Test: `node tools/audit-regression.mjs`. Status: fixed.
- **SC-02 / P1 / broken word wrapping**: Root cause was narrow card grids plus inherited aggressive wrapping risk. Fix adds component-level `word-break: normal`, `overflow-wrap: normal`, wider responsive process grid columns and targeted wrapping only for technical strings. Test: `node tools/audit-regression.mjs`. Status: fixed.
- **SC-03 / P0 / quote total stayed €0**: Root cause was `paint()` searching for `[data-estimate-*]` totals only inside the form while the summary card is outside the form. Fix scopes quote summary lookup to the closest quote section/document and fails visibly when pricing is unavailable. Test: `node tools/audit-regression.mjs`. Status: fixed.
- **SC-04 / P1 / checkbox/radio alignment**: Root cause was block labels with inline inputs and inconsistent control alignment. Fix makes `.option-row`, `.category-card`, and consent fields stable grid/flex rows with full-label click targets. Test: CSS static check rejects absolute-positioned checkbox rules. Status: fixed.
- **SC-05 / P1 / six services vs four nav items**: Root cause was flattened main navigation. Fix adds a single Services/ Szolgáltatások / Leistungen disclosure containing the six service links that match home cards. Test: `node tools/audit-regression.mjs`. Status: fixed.

## Quote calculator test matrix
Automated regression covers load, default non-zero total, service/category changes, add-on changes, VAT math, hidden payload values, no NaN/negative result, and pricing config availability. Manual live backend success remains not testable without production service verification.

## External dependencies
- Google Apps Script / Cloudflare Worker: static and local frontend checks only; live success/error handling requires endpoint access and mailbox/spreadsheet confirmation.
- Analytics / reviews: static consent-code review only; third-party scripts intentionally load after consent.
- Bookipi / other embeds: not changed; human legal review recommended for processor lists.

## Second production verification pass — 2026-07-17

### Independent-review findings addressed

| Finding | Root cause | Fix | Regression guard |
| --- | --- | --- | --- |
| Forbidden blur effects | Several production CSS rules still used `filter: blur(...)` or `backdrop-filter: blur(...)` on header, lightbox, age-gate, sticky controls and reveal states. | Removed non-zero blur/backdrop-filter use from production CSS and retained solid/semi-transparent backgrounds, borders, shadows and opacity transitions only. | `tools/audit-regression.mjs` now fails on non-zero blur/backdrop-filter blur in `assets/css/style.css`. |
| Quote info modal unstyled | `main.js` still generated `.info-modal` markup, but the matching modal CSS was missing. | Restored full no-blur `.info-modal`, panel, header, close-button and content styles with fixed overlay, responsive centred panel, scrollable content and focus-visible states. | Regression script now verifies required info-modal CSS classes when JS references the modal. |
| Gallery lightbox keyboard support | The gallery-specific lightbox only opened, closed and handled Escape. | Added dialog attributes, previous/next buttons, focus movement, focus trap, Escape close, ArrowLeft/ArrowRight navigation, outside-click close, body scroll lock and focus restoration. | Gallery pages and regression checks require accessible lightbox controls. |
| Gallery image dimensions | Gallery HTML used `width="1200" height="800"` for every asset. | Replaced gallery width/height attributes with intrinsic WEBP dimensions from repository assets for all EN/HU/DE gallery images. | Regression script parses WEBP headers and compares declared dimensions with source dimensions, rejecting duplicate or missing images. |
| Missing gallery structured data | New gallery pages had canonical/hreflang but no gallery JSON-LD. | Added valid JSON-LD containing `CollectionPage`, `BreadcrumbList`, maintainable `ImageGallery`/`ImageObject` entries, `creator`, `copyrightHolder`, `inLanguage`, `isPartOf`, and consistent Person/Brand references. | JSON-LD validation and gallery schema checks now run locally. |

### Browser-driven verification status

Required Chromium/Playwright verification was attempted but could not be completed in this container because external package and browser installation endpoints returned HTTP 403 via the configured proxy:

- `npm install --save-dev @playwright/test` failed with `403 Forbidden` from `registry.npmjs.org`.
- `apt-get update && apt-get install -y chromium` failed with `403 Forbidden` from Ubuntu package repositories.
- No existing `chromium`, `chromium-browser`, `google-chrome`, or Playwright browser binary was present in the filesystem.

Because of this environment limitation, the PR must still receive a real browser pass before production readiness is declared. The required live-browser matrix remains:

- Viewports: 320, 375, 390, 768, 1024, 1440 and 1920 px widths.
- Interactions: quote service/quantity/duration/location/extras changes, PDF download, submit payload interception, Services submenu click/hover/keyboard/Escape/mobile accordion, all checkbox/radio rows, info modal, gallery lightbox Escape/arrows/focus trap/focus restoration, consent accept/necessary-only/withdraw flows.

### Verification completed locally after second-pass fixes

- Static JavaScript syntax checks for `assets/js/main.js`, `js/main.js`, and `assets/js/quote-calculator.js` passed.
- `pricing.json` validation passed.
- Repository HTML JSON-LD parsing passed after adding gallery structured data.
- `tools/audit-regression.mjs` passed with the new no-blur, info-modal, gallery-dimension and gallery-schema assertions.

### External production verification still required

- Google Apps Script and/or Cloudflare Worker quote submission success path with real production CORS and response bodies.
- Production-domain Google Analytics / review-widget consent network behaviour.
- Browser-native PDF rendering in Chromium, Safari and Firefox, including Hungarian and German characters.
- Real mobile Safari visual verification for form controls, dropdowns, lightbox and sticky quote summary.

## Final production release audit — 2026-07-17

### Release blocker fixed in final audit

| Finding | Severity | Root cause | Fix | Verification |
| --- | --- | --- | --- | --- |
| English quote calculator VAT wording could imply that entering an EU VAT ID changes the displayed estimate to reverse charge automatically. | P1 trust / tax-communication risk | The English pricing-logic copy said a valid non-Austrian EU VAT ID “may change the estimate to reverse charge,” while the calculator intentionally keeps 20% Austrian VAT until human verification. | Reworded the English quote page to state that displayed gross orientation prices include 20% Austrian VAT until company details, VAT ID and reverse-charge conditions are verified in the final written offer. | Static regression, JSON/JSON-LD validation, JavaScript syntax checks and relative link audit passed after the copy change. |

### Final audit outcome

No further local release-blocking issues were found in the static production audit for SEO-critical metadata, hreflang/canonical presence, local links/assets, JSON-LD syntax, quote-calculator syntax, no-blur regression rules, gallery schema/dimensions, services-menu parity, process-block placement or checkbox positioning. Browser-driven Chromium/Safari/Firefox verification and live backend tests remain external environment requirements documented above.

## Four-service simplification and quote root fix — 2026-07-17

### Architectural simplification

The commercial website was simplified back to four principal service areas in English, Hungarian and German:

1. Portrait Photography / Portréfotózás / Porträtfotografie
2. Brand Photography / Brandfotózás / Brandfotografie
3. C-Level Event Photography / C-level eseményfotózás / C-Level-Eventfotografie
4. Fine Art Photography / Művészi fotózás / Fine-Art-Fotografie

The over-engineered six-service dropdown and standalone curated gallery routes were removed. The existing service pages remain the canonical presentation layer for work examples and service-specific imagery.

### Quote calculator root cause and fix

Root cause: the quote pages exposed the visible gross/net/VAT summary with legacy attributes (`data-total`, `data-net`, `data-vat`) while the calculator painted only `[data-estimate-*]` elements. The hidden form fields also carried `data-estimate-*`, so the script updated hidden inputs but did not update the visible price box. The pages also lacked an explicit shared `[data-quote-root]` wrapper around the form and visible estimate.

Fix: each quote page now wraps the estimate and form in one `[data-quote-root]`, the visible summary uses exactly one `data-estimate-gross`, `data-estimate-net` and `data-estimate-vat`, hidden fields are updated by `name`, and the calculator resolves a deterministic quote root rather than falling back to `document`.

### Browser test coverage added

Playwright tests were added for `/requestaquote/`, `/hu/ajanlatkeres/` and `/de-at/anfrage/` at 375 px, 768 px and 1440 px. They wait for pricing readiness, verify visible non-zero totals, change a priced option, compare hidden form totals with visible totals and fail on console errors or `NaN`/`undefined` text.
