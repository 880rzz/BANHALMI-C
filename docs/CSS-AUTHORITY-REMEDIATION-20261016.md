# BANHALMI-C CSS authority remediation — 2026-10-16

Status: TRANSITIONAL / NOT PRODUCTION VERIFIED.

## Evidence from main

- `assets/css/site.css`: 205,565 UTF-8 characters; 633 `!important` occurrences.
- `assets/css/fluid-4k-rhythm.css`: 106,172 UTF-8 characters; 1,448 `!important` occurrences.
- Total: **2,081 `!important` occurrences**, before counting runtime and generated design rules.
- `assets/js/fluid-rhythm-boot.js` can load the second CSS dynamically.
- `tools/restore-production-design-authority.mjs` generates additional `!important` rules.
- `data/design-authority.json` contains intended H1/H2/H3, content width and footer tokens, but not all CSS uses those tokens.
- Existing source-level audits assume that both CSS sources exist and some audit expectations must evolve with the new contract.

## Phase 1: one *delivered* CSS asset (this PR)

`tools/build-single-runtime-css.mjs` runs after integrity checks on the copied Pages artifact, before browser QA. It concatenates source rules in the same cascade order, removes the second stylesheet links from the output HTML, and disables dynamic insertion in the artifact's fluid boot script. Typography JS remains operational. The separate source CSS remains in Git for rollback and so legacy source checks can continue until a migration is verified.

This step deliberately does **not** claim reduced specificity, reduced CSS bytes, corrected spacing, fewer `!important` directives, or a new visual design. Its sole acceptance condition is one runtime CSS request per canonical HTML page with no cascade order changes. Browser and accessibility checks must pass before merge.


## Measured root causes and work performed

Initial Chromium CI scan (15 URLs × 390/768/1440px) exposed these source/live-artifact differences:

- At 1440px, the standard service H1 and taxonomy text began at x=176px, while the footer began at x=24px. The homepage hero intentionally has a narrower x=270px axis and is not the shared component baseline.
- At 768px, service text began at x≈32.3px and footer at x=20px; at 390px the difference was 20px vs 18px.
- Although the HTML bundler removed the fluid CSS link from 101 pages, service pages still reloaded it through `assets/js/site-config.js`. Homepage pages did not load this adapter. This was a real P1 runtime cascade duplication, not just a source-level mismatch.
- The published-artifact bundler now neutralizes the two known runtime CSS injection paths (`site-config.js` and `fluid-rhythm-boot.js`), and the browser gate checks both stylesheet links and requested resources.
- The footer canonical wrap now uses the same `--apple-page-max` and `--apple-gutter` variables as primary content. Five obsolete size/padding priorities were removed by editing the existing five declarations; no new override layer was appended.
- The service eyebrow-to-H1 separation was repaired inside its existing responsive rule.
- The existing exact-rule deduper runs on the production artifact; it removes only identical leaf rules in the same at-rule context and retains later copies. No assertion of broad `!important` elimination is made.

The final measured browser result is still required before closing these changes. Preserve the untouched original source CSS until production acceptance; do not declare the two-source authoring system permanently consolidated yet.

## Phase 2: canonical tokens and component ownership (partially implemented; full cleanup open)

- Choose one spacing/gutter axis for the main content and footer; preserve documented wide-gallery exceptions.
- Map and remove duplicate selectors, dead rules, and invalid legacy overrides using computed-style evidence across EN/HU/DE.
- Give H1, H2, H3, lead, descriptions, eyebrow, card, pricing, navigation, footer and consent UI one documented owner each.
- Replace specificity wars with component selectors or cascade layers, then remove `!important` individually after visual regression.
- Remove obsolete runtime geometry mutation, not essential interactive behavior.
- Change source audits and builder assumptions **only after** behavior is proven.
- Retire the secondary CSS source only when no build tool or test depends on it.

## Release gates

Verify source SHA → Pages artifact SHA → live SHA; audit mobile 375/390, tablet 768/1024, desktop 1440/1920 and UHD 3840. Cover all 12 service variants, home EN/HU/DE, legal and quote pages, footer disclosure, pricing panel open/closed, typing / alignment, no overflow, no broken links, canonical/hreflang/schema parity and pixel geometry.

Do not merge this draft PR if browser tests show any regression. Do not describe this as the final design cleanup.
