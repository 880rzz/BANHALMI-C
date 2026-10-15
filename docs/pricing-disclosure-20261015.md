# Pricing disclosure — 2026-10-15

## Problem and implementation

The 12 canonical service pages placed visible example prices before the contact CTA. On three quote pages, the closed comparison guide exposed starting prices in its summary before service selection. This made the price the first decision rather than the purpose and scope.

Move each service page's existing investment/example blocks, without changing amounts or copy, into a default-closed native details panel after the next-step contact section (Fine Art: after the early purpose-selection CTAs and professional-scope introduction). Keep the Fine Art extra-image fee/inclusions paragraph in that same panel before duration choices. Reuse the existing disclosure styles: no stylesheet, script, tracking or consent changes.

On the three quote pages, move the detailed comparison after the request form, and move its price note inside the closed panel. The interactive calculator, live estimate, selected options, PDF download, service context and form remain available.

## SEO, GEO and search intent

Fresh GSC API evidence is stored in `pricing-disclosure-gsc-20261015.json`: 2026-09-15 through 2026-10-12, 94 query/page pairs, no pagination truncation. Query filters include executive, headshot, personal brand, brand photography, visual positioning and localized portrait terms. GSC rows are query/page observations, not site-wide totals; UTM variants remain separate in the raw evidence.

The German homepage already receives personal-brand search visibility (personal brand fotograf wien: 5 impressions, 1 click, position 3; personal brand fotografie wien: 8 impressions, no clicks, position 3). The Hungarian homepage remains the main observed portrait entry (portré fotózás budapest: 41 impressions, 1 click, position 4.63, plus 32 impressions on its UTM variant). Executive portrait on /portrait/ has only one impression. This does not justify a broad title/H1 rewrite or moving homepage intent to new landing pages. No improvement in ranking is claimed.

Intent ownership remains: Portrait = headshots / executive portrait; Lifestyle and localized Brand = personal branding / strategic visual positioning; Event = commercial and institutional event photography; Fine Art = commissioning with the separate ART archive as evidence; Quote = conversion. All 15 titles, H1s, metadata, canonicals, hreflang and JSON-LD blocks were compared with base main and remain byte-identical. Visible price occurrence counts also match the base. Native details retains the full price text in server HTML, available without JavaScript. Existing Vienna/Budapest entity and service relationships remain intact.

## Validation and release status

- Source integrity comparison: PASS on all 15 pages; exact metadata/JSON-LD preservation and unchanged price counts.
- Static disclosure audit: PASS; closed panels, price-free summaries, CTA/form before comparison, retained calculator markers, parseable JSON-LD.
- Full `npm test`: result recorded in PR after execution.
- Added browser regression: 15 pages at 12 widths, keyboard opening/closing, 44px targets, panel/page overflow, calculator readiness, and no-JavaScript opening.
- Local Playwright browser download failed (truncated archive). Browser execution must be proven by CI; no local rendered success is claimed.
- PR, CI, merge, deployment and exact-live verification: pending when this change was authored. The unrelated cache fix is PR #141.

## Measurement

Begin the measurement window only after exact-live verification. Observe at least 28 settled days: query/page clicks, impressions, CTR and position for protected homepage and service clusters; quote starts, submissions and available conversion events. Report observed change without attributing causality from a single day. Do not add new analytics events or load third parties without consent.

Change ID: pricing-disclosure-20261015. Repository: 880rzz/BANHALMI-C. Risk: medium UX, low content/SEO; amounts and calculator logic unchanged. Production status: pending.
