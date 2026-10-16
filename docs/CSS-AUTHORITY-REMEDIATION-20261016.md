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

## Phase 1.1: remove dynamic CSS loaders in the Git source (2026-10-16)

The runtime CSS insertion blocks were removed directly from `assets/js/fluid-rhythm-boot.js` and `assets/js/site-config.js`. The published artifact compiler now rejects reintroduced legacy loader code rather than rewriting those scripts. Typography integrity and descriptive navigation loading remain intact. This is a source-authority cleanup only: the source HTML still references two stylesheets until the second CSS source and its source-era audits are migrated, and the build still produces one published CSS asset.

## Verified UHD alignment regression and root-cause correction

The 180-sample browser audit (15 URLs × 12 viewports) detected 48 source-branch alignment failures at 2560px and 3840px: all 12 service H1 axes began 40px to the right of their pricing and footer text. The CI evidence shows a 1680px editorial hero wrap versus a 1760px canonical page/footer wrap. The independent `--bn-content-max:1680px` declaration was replaced with `--bn-content-max:var(--apple-page-max)` so hero, pricing and footer follow the same width owner. The exhaustive browser audit must pass at the original 4px tolerance before release; this correction is not itself production proof.

### Shadowed priority removal (source CSS)

Removed 50 earlier `!important` markers from `fluid-4k-rhythm.css` where a later declaration has the **exact same selector, enclosing at-rule context, CSS property, value and `!important` priority**. The last effective declaration was preserved; this is targeted no-op cascade simplification, not a blanket priority strip. Fluid debt drops from 1389 to **1339** and the two-source total from 1988 to **1938**. The CI debt ceiling is reduced to prevent rollback, and the existing 180-sample/browser/visual tests must verify no regression. This is source-committed, not production-verified.

## Phase 2: canonical tokens and component ownership (not yet performed)

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

## Integrated correction ledger (PR #151)

- All four service owners have 3 EN/HU/DE routes; each of the 12 pages places its unchanged, initially closed pricing disclosure directly below the hero.
- The approved portrait H1 and descriptive copy are protected by localized source and browser assertions. JSON-LD WebPage headlines match the visible H1.
- The shipped artifact has one locally requested stylesheet; legacy injection by both `fluid-rhythm-boot.js` and `site-config.js` is disabled in the output artifact.
- The native service disclosure is at least 48 px high, keyboard operable and styled through one shared component rule. It is excluded from the generic section padding contract.
- Service H1, lead, pricing disclosure and first footer text column share a measured optical x-axis across 390, 768 and 1440 px; H1 and lead sizes must match across all 12 routes.
- External-link arrows are assigned only to off-site HTTP(S) text links. Internal, language, fragment, action and image links have none, and glyphs are aria-hidden.
- The migration-era source specificity budget is now **599 site.css + 1,389 fluid CSS = 1,988 !important** (from the 2,081 initial count), with a CI rule forbidding increases. The production bundler additionally eliminates exact duplicate rules without altering ordering.
- These are branch/CI claims, not evidence of release to the public domain.

## Canonical token responsibilities

- `--apple-page-max`: standard main and footer canvas; fullscreen imagery is an intentionally documented exception
- `--apple-gutter`: common side inset for main copy, hero content, pricing and footer
- `--apple-reading-max`: long-form reading measure (do not stretch body paragraphs to the full 4K canvas)
- `--apple-section-space`: non-pricing section rhythm
- `--bn-service-price-heading`, `--bn-service-price-body`, `--bn-service-price-meta`: pricing hierarchy, shared EN/HU/DE
- H1/H2/H3 sizes: `data/design-authority.json` contract; specialized homepage display and artwork remain documented exceptions

## Priority debt removal rule

Do not mass-strip `!important`. Consolidate one selector family at a time, retain equivalent computed style at 375–3840 px, and lower the budget in `tools/audit-css-priority-debt.mjs` as soon as the component passes the full browser gates. The final source consolidation requires rewriting the source-era tests and build scripts that still read `fluid-4k-rhythm.css`; until that dependency is removed, production already emits one CSS, but Git retains two compatibility sources.

### Source deduplication milestone

Safely removed 34 identical earlier leaf rules from `site.css` and 22 from `fluid-4k-rhythm.css`, preserving their last identical occurrences. This reduced a further 74 source `!important` declarations and roughly 5.6 KB of duplicate CSS. The compiled bundle still passes through the exact-rule deduper for cross-source matches.
