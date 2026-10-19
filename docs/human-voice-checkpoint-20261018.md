# Human voice / ecosystem implementation checkpoint

## Contract and baseline

Use `BANHALMI-ECOSYSTEM-HUMAN-VOICE-MASTER-PROMPT-20261018.md` as the full execution brief. The current user explicitly assigns private artistic commissions to ART and career-facing artist/performer portfolios to Professional. Older combined-service contracts must be migrated with equivalent functional safeguards, not silently preserved or disabled.

Initial main commits:
- BANHALMI-C: `d8fdf8431e7436e246143734b52f065c62cd5f9c`.
- ART: `31fbabe05177dd30f990fe10d731cc364d6253c6`.

Both initial `npm test` suites completed successfully before changes. This proves the existing automated contracts, not actual five-second comprehension or runtime privacy.

`human-voice-baseline-20261018.json` records the exact source text, headings, links and file hashes for 57 Professional sitemap pages. ART retains an equivalent 84-page file. These are source baselines, not claims of completed editorial review; runtime/non-sitemap discovery is still pending.

## First implementation slice

Professional homepage hero labels, EN/HU/DE:

| Purpose | Before | After |
|---|---|---|
| EN quote | Start with a conversation | Pricing & quote |
| HU quote | Kezdjük egy beszélgetéssel | Árak és ajánlat |
| DE quote | Mit einem Gespräch beginnen | Preise & Angebot |
| EN art gallery | Open the Best of Gallery | Art gallery ↗ |
| HU art gallery | Válogatott galéria megnyitása | Művészeti galéria ↗ |
| DE art gallery | Best-of-Galerie öffnen | Kunstgalerie ↗ |
| EN consultation | Book a 15-minute video call | Book a call |
| HU consultation | Foglaljon 15 perces videóhívást | Beszéljünk |
| DE consultation | 15-minütiges Videogespräch buchen | Gespräch buchen |

The primary quote label now describes its actual calculator destination. All destinations, prices, H1s, metadata, CSS and booking behavior are retained. The gallery label identifies the separate art destination. This slice does not complete the four-service IA, price simplification or ART private route.

Targeted source checks passed after the edit: homepage clarity contract, navigation/CTA contract, homepage metadata parity. Final full-suite, CI, artifact, browser and production status must be read from actual later results.

## Next implementation dependencies

1. Discover navigation/runtime sources and non-sitemap pages; identify every generator that can reintroduce old copy.
2. Inspect `customer-intent-model.json`, `customer-needs.json`, `services.json`, `service-intent-copy.json`, `ecosystem.json`, `service-owner-routing.json`, and corresponding ART machine documents before changing ownership.
3. Existing `tools/audit-audience-journeys.mjs` enforces the combined artist/private Fine Art page and quote handoffs. Preserve deep-link behavior while migrating this explicit old content contract to the new two-brand intent contract. No pricing, consent or quote arithmetic test may be weakened.
4. Create ART private commission pages in three languages, with an existing working contact route and only verified privacy/process statements. Keep collector interest separate; no invented editions or availability.
5. Simplify the Professional homepage choice structure and artist service, then the offer/request journey and other page types. Preserve existing headshot and group options as secondary routes.
6. Keep source, schema, machine documents, navigation and search ownership consistent. Verify build idempotence, full tests and rendered responsive states before release.

No complete semantic/privacy/production certification is implied by this checkpoint. No main-branch changes or live publication are recorded here.
