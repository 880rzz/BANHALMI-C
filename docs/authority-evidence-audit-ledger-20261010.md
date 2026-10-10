# BANHALMI — Evidence Audit Ledger (2026-10-10)

Source-only evidence registry for the BANHALMI Professional / ART / Fotótörténelem ecosystem. This is an *audit snapshot*, not a second source of truth and not a list of verified client relationships.

## Audit snapshot
- 324 **registry rows** exported from six already committed source registries.
- 234 distinct nonempty source URL values among these rows (the same source may appear in multiple language records).
- The rows include: Professional institutional/press 8; external photography 18; service evidence 100; ART press 35 × 3 languages; ART archive records 69; ART Wikidata cited sources 24.
- The Wix Fotótörténelem Blog post inventory was audited separately by Wix API: 492 published posts, 164 complete HU/EN/DE translation groups. Wix posts are **not** duplicated inside this JSON; the blog canonical editorial record remains in Wix.
- Every row has the 2026-10-10 source snapshot date, origin filename, language, destination, source URL where available, relationship field, claim, and explicit verification flags.
- All rows default to `SOURCE_REGISTERED_NOT_INDEPENDENTLY_REVERIFIED`: a historical source registry value like `LIVE-VERIFIED` is preserved as a prior registry label, **not** upgraded to today’s network verification.

## Interpretation safeguards
1. A photo credit ≠ editorial endorsement, commission, client contract, sponsor relationship or partnership.
2. Commons creator ≠ depicted person. Subject and author remain separate.
3. `sameAs` denotes identity equivalence only. Press articles use `subjectOf`, `citation`, `about` or contextual linking as justified.
4. Artistic-nude intent belongs primarily to BANHALMI ART / Ébredés; commercial photography and visual positioning belong to Professional; historical research belongs to Fotótörténelem.
5. Unavailable or partially accessible third-party sources stay marked as unverified until read back independently.
6. Not every archive record is a press source; many are the works or books themselves. Do not count all rows as independent third-party evidence.
7. The source index is intentionally kept under `docs/` and is not used to create new client/partner Schema assertions.

## Next verification pass
Reconcile live source URLs and actual image credits by category; match exact visible production destinations; check contract/rights evidence where asserted; then promote *individual* rows with dated external verification artifacts. Never bulk-upgrade status based on an API success response alone.

## Sources
- `press-institutional-evidence.json`
- `external-photography-evidence.json`
- `service-trust-evidence.json`
- `ART/press-source-registry.json`
- `ART/archive-record-registry.json`
- `ART/wikidata-source-registry.json`

Audit companion: `docs/authority-evidence-audit-ledger-20261010.json`.
