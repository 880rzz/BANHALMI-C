# Strict Apple Web Design Contract

This repository treats the following as a release-blocking visual contract for every published page, every supported language, and every audited viewport.

## Typography
- System/SF-style sans-serif hierarchy.
- H1: 34–50 px on small mobile, 34–58 px through tablet, 40–76 px on desktop.
- H2: 24–42 px on mobile, up to 48 px on larger viewports.
- H3: 18–34 px.
- Long-form body copy: 16–21.5 px.
- H1 line-height: 0.98–1.18. H2/H3 line-height: 1.02–1.30.
- Long-form body line-height: 1.40–1.72.
- Body weight: 300–600. Heading weight: 500–750.
- Body tracking must remain effectively neutral; heading tracking must remain restrained.

## Alignment and reading measure
- Long-form prose is left/start aligned. No justified body copy.
- Centered text is reserved for short hero, CTA, statement, error, or footer copy.
- Long prose must never be centered merely for decoration.
- Elements that are left-aligned within the same semantic content group share one optical start axis; headings, descriptions, links, lists and structured records must not drift independently.
- Long prose width is capped at 860 px; normal reading measure should remain narrower where possible.
- Text columns must not collapse below a usable reading width.

## Layout and full-width surfaces
- Colored top-level section surfaces span the full viewport width.
- Content inside those surfaces uses centered constrained wrappers.
- Standard desktop content wrappers are capped at 1280 px through 1599 px viewports.
- From 1600 px the standard wrapper may open to 1440 px; from 1920 px to 1600 px; from 2560 px (4K-class) to 1760 px. Photographs and full-bleed surfaces may use up to 1920 px. Long prose remains capped at 860 px at every width.
- Information-dense structured components (service/process grids, partner grids, archive/reading records and quote workspaces) may use a separate structured canvas: 1320 px below 1600 px, then the same stepped wrapper as above.
- The structured canvas must be applied to the real rendered component and, where necessary, its semantic wrapper; it must not remain trapped inside a narrower legacy parent.
- Standard and structured wrappers remain geometrically centered and use the same optical start-axis system.
- Mobile/tablet content keeps visible side gutters unless the element explicitly declares full-bleed semantics.
- Responsive use of space means narrow prose remains narrow while structured records expand only when their information architecture benefits from it; no desktop-only centred ribbon is allowed to waste usable width.
- No horizontal document overflow.
- No `content-visibility:auto` on top-level sections where it can create blank visual bands.

## Spacing rhythm
- Related heading/copy blocks remain visually attached without collision or arbitrary voids.
- Colored editorial sections require meaningful vertical breathing room.
- Spacing follows a small, repeated rhythm rather than arbitrary one-off values: 8 / 12 / 16 / 24 / 40 / fluid section 48–96.
- Heading to description: 12–16 px. Description to link or CTA: 20–28 px. Card gap: 16–24 px.
- Rows, cards and groups use the same canonical spacing scale unless their information architecture explicitly requires a documented exception.
- Short pages keep the footer at the bottom of the viewport using the canonical `min-height: 100dvh` document grid.

## Cards, cells, rows, and columns
- Cards are used only for real content units, not as decoration around every paragraph.
- Card/cell corner radius is capped at 28 px.
- Bordered/colored cards keep sufficient inner padding.
- Text-bearing grid columns must remain wide enough to read.
- Dense desktop grids must collapse or reflow before text becomes cramped.
- Cards in the same semantic grid use a shared gap and comparable inset rhythm; isolated page-specific spacing patches are not accepted as the design authority.
- Same-type cards in the same rendered row use equal outer visual height on tablet/desktop/4K; content length must not make sibling cards visibly shorter or taller.
- CTA/action regions should align consistently toward the bottom when present. Mobile uses natural content height rather than forced empty space.

## Footer
- The desktop footer is a three-band composition: one compact primary information grid, one footer-bottom row, and one ecosystem row.
- The primary desktop information grid remains a single rendered row at the audited desktop widths; semantic items may wrap internally where required.
- Footer columns, metadata and legal records may wrap across multiple lines. A single-line footer is not a design requirement.
- Wrapping must occur between semantic fields/items; do not solve density by shrinking typography or widening the document.
- Atomic identifiers must remain intact: telephone numbers, email addresses, VAT/tax/company identifiers and similar IDs must not break internally.
- The retired rule requiring the complete footer/legal identifier area to stay on one line must never be restored by a generator, optimizer, restore, hardening or remediation job.
- On audited desktop viewports, the rendered footer must satisfy both the viewport-ratio and absolute-pixel limits from `data/design-authority.json`; “no overflow” alone is not sufficient.
- Intermediate tablet/compact-desktop widths use the canonical six-column compact geometry rather than allowing the footer to grow into a dominant page section.

## Controls and links
- Mobile/tablet interactive controls use at least a 44 px touch height; button-like controls also require a 44 px touch width.
- Primary and secondary CTAs remain visually distinct and concise.
- Navigation links, inline text links, utility links, disclosures and CTA links may differ by role, but each role must remain typographically, spatially and interactively consistent across pages and languages.

## Restore / rewrite authority
- `APPLE-DESIGN-CONTRACT.md`, `data/design-authority.json`, `tools/design-contract-policy.json`, and `assets/css/fluid-4k-rhythm.css` are canonical inputs for any automated generator, optimizer, restore, hardening, remediation or rewrite process that can affect layout.
- The production artifact must parser-discover the canonical `fluid-4k-rhythm.css` stylesheet in `<head>` before first layout; loading geometry only after runtime JavaScript executes is a release-blocking CLS regression.
- JavaScript loaders may verify/load the canonical stylesheet as a fallback and synchronize disclosure state, but must not inject hero, footer, cards, reviews, section-rhythm, gallery or mega-menu geometry.
- Such processes must preserve equal-height same-type desktop cards, the three-band desktop footer, semantic multi-line footer wrapping, and atomic identifier no-break behavior.
- A process that reintroduces the retired full-footer single-line rule, delays canonical geometry until runtime, or adds a runtime geometry patch is a regression and must fail the repository audit before release.

## Desktop Visual Redesign v2 — 2026-09-15
- Homepage-only visual authority: `main[data-homepage-redesign="stage76"]`.
- Desktop composition begins at `min-width:1180px`; mobile and tablet remain owned by the existing base design system.
- Desktop hero uses an editorial split: image-led left field and constrained positioning copy on the right.
- Decision paths use a three-column editorial grid; principal services use a two-column rule-separated grid; the oeuvre teaser uses an asymmetric copy/image composition.
- 1440, 1920 and 2560 px viewports must look materially different from the pre-redesign desktop while preserving readable prose and negative space.
- Footer geometry, reviews rhythm and deterministic multilingual navigation remain protected.
- SEO, canonical, hreflang, Schema, machine-readable evidence and trust semantics are presentation-external and must not be weakened by visual changes.
- U.S. Embassy in Austria / SelectUSA / AmCham evidence and ART ↔ Blog ↔ Professional intent separation remain protected. Event/publication evidence must not be reinterpreted as endorsement, client, partnership or exclusivity proof.
- `assets/js/fluid-rhythm-boot.js` must reference the current versioned `fluid-4k-rhythm.css` token as a runtime fallback, while production HTML parser-discovers the stylesheet directly.

## Live Pixel Geometry v19 — 2026-09-16
- Required desktop evidence viewports are 1440×900, 1920×1080 and 2560×1440. 3840×2160 is a separate 4K sanity gate.
- The release gate must render the production-equivalent artifact in Chromium and save full-page screenshots for EN `/`, `/portrait/`; HU `/hu/`, `/hu/portre/`; DE `/de-at/`, `/de-at/portrait/`.
- Homepage hero height is bounded by both an explicit viewport-specific pixel maximum and a viewport-height fraction. A hero that consumes the complete first fold is a visual failure even without overflow.
- Portrait gallery density must scale across desktop widths according to `data/design-authority.json`; wider desktop viewports must not create longer pages merely because the grid remains too sparse.
- Same-row editorial cards have a rendered-height tolerance; source declarations such as `height:100%` are not proof of equal visual height.
- Reviews spacing, three-band footer mass, and mega-menu first-content/bottom whitespace are rendered-geometry contracts rather than token-presence checks.
- Mega-menu screenshot evidence is captured after the opening transition has settled; transient animation frames are not accepted as final visual evidence.
- A green source/CI contract without the rendered geometry evidence is not sufficient release evidence.
- The automated contract is `tools/audit-live-pixel-geometry.mjs`; screenshot evidence is retained from the PR gate.

## Release rule
A visual failure on any published page, language, or audited viewport blocks release. The automated browser contracts include `tools/audit-apple-visual-quality.mjs` and `tools/audit-live-pixel-geometry.mjs` and must run together with the repository's exhaustive browser, first-principles, accessibility, contrast, Lighthouse, SEO, schema, GEO, GDPR, AI/LLM, trust, exact-live, and design-contract gates. Computed geometry, not token presence alone, is the release evidence.
