# Service-owner routing — 2026-10-15

## Evidence and interpretation

Read GSC for https://www.norbertbanhalmi.com/ with query, page and country dimensions: 597 homepage rows and 609 property-wide rows for 2026-09-15–2026-10-12; 479 filtered service-query rows for the 90-day window 2026-07-15–2026-10-12. None of these requests was truncated. The country is measured; query language is inferred lexically and may remain undetermined. Homepage locale and query language are separate dimensions. Raw GSC rows and the per-query classification are kept in the private report, not published with the website.

Most observed search visibility is on homepages; explicit portrait, headshot, personal-branding, artist-portfolio and artistic-commissioning queries have relevant existing service destinations. Broad photographer/city, brand-name and ambiguous portfolio queries do not warrant homepage redirects. Country alone does not justify choosing a language. No new boudoir/product/family/baby/wedding/real-estate/training service or landing page is invented from search exposure.

## Changes and root cause

Existing service cards and machine owner mappings were already present, but the first homepage service summary was unlinked, and portrait/brand service H1s described an outcome without naming the service. Strengthen the existing hierarchy rather than creating duplicate city/keyword landing pages:

- Convert the first homepage service summary into four contextual links in EN/HU/DE, retaining home title, H1, self-canonical, hreflang and broad local/brand intent.
- Make the six localized portrait and brand H1s explicit and keep their WebPage headlines synchronized. Service titles, prices, calculator, image content and layout rules are unchanged.
- Add localized Service alternateName values to nine portrait/brand/art service records; do not equate Fine Art with nudity.
- Expose the language-specific owner map through service-owner-routing.json and llms.txt. This is a semantic preference for search engines/assistants, never an HTTP or referrer redirect.

Event routes retain their current headings; there is insufficient evidence for a larger event-copy rewrite. General and ambiguous queries remain with the homepage or manual scope review. Historic snapshots in the existing authority matrix are preserved as historic evidence.

## Verification and measurement

Verify source contracts, protected homepage metadata, self-canonicals/hreflang, service headline parity, Service aliases, real internal-link destinations, prices and native pricing panels. Browser/CI must verify changed headings and early links across responsive widths and the existing full regression suite. Do not weaken gates to accommodate new copy.

Release status at authoring: pending PR/CI. No ranking migration or KPI improvement is claimed. Start a 28-settled-day measurement window after verified deployment: query/page/country distribution, service-page share of impressions/clicks, protected homepage signals, and quote conversions where available. Low-volume query/URL observations are not unique search counts; UTM variants are normalized only in the private analysis.

## CI remediation

The first run passed all 165 functional tests and the full responsive layout audit, then caught an Apple visual-contract regression at 1440px: the new homepage eyebrow exceeded the long-prose threshold while retaining 1.28px tracking. Shorten the four link labels to their service names, preserving all destinations and the detailed service H1/schema vocabulary. The fix reuses existing typography; no CSS override or weakened audit. Add a compact-label source guard.
