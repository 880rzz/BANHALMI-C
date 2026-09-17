# BANHALMI design regression policy — 2026-09-14

Historical screenshot defects are release-blocking, not advisory. The single geometry source of truth is `data/design-authority.json`; browser audits may read it but may not introduce competing canvas constants.

The exhaustive release matrix covers small phones, current phones, iPad/tablet, laptop, HD, Full HD, QHD and UHD/4K. Every published EN/HU/DE content page is checked for horizontal overflow, shell/media containment, canonical wrapper width and centering, header/footer containment, footer overgrowth, touch geometry, quote-control containment, surface roles and boxed active-navigation regressions.

Restore/build/audit tooling must not weaken these contracts or reintroduce historical 1200/1500 canvas values. Changes to the canonical design authority require the regression matrix and browser evidence to move together.
