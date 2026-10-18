# Human voice / two-brand journeys — implementation phase 1

## Implemented on the working branch

- Four Professional homepage choices in HU/EN/DE, retaining visible secondary CV/headshot and organiser routes.
- One primary homepage action opens the existing simple contact form; the detailed price calculator remains a secondary action.
- Shorter homepage explanation and artist/performer wording in shared runtime and static navigation; existing service URLs are retained.
- Personal artistic intent points to the companion ART private-photography pages. Release ART first and verify those destinations before releasing the Professional links.
- Shared pricing, written terms, backend service IDs and existing calculator links remain intact. No prices, image counts, tax rates or pricing formulas were changed.
- Canonical machine-core, services, customer intent, ecosystem and LLM projection source now record the private-ART/professional-portfolio boundary. Legacy combined service-page details and calculator paths remain compatible during the next editorial pass.
- A formal-Hungarian correction removes informal address from the canonical portrait intent source.

## Verification scope

The isolated local browser report in the companion ART change covers 72 route/viewport cases at 320, 375, 390, 768, 1024, 1440, 1920, 2560 and 3840 px. This verifies local geometry, four primary choices and private entry presence; it does not prove production deployment or full GDPR compliance. HU mobile/desktop screenshots were visually inspected. The three-language private menu and language-switch actions are additionally exercised by the local browser runner.

Source tests and companion artifact-idempotence checks are run before publication; actual CI and production state must be read from the GitHub runs and live responses rather than inferred from this document.

## Remaining scope

Full editorial simplification of all service pages, the combined legacy Fine Art detail blocks, the advanced calculator, every translated policy/FAQ and the blog remains open. The lower service-price overview on the homepage is still separate from the first service selector. This phase is not the final 141-page closure.

Next: unify that homepage price/choice presentation, simplify the portrait/brand/event/artist service pages without modifying commercial terms, then validate runtime privacy and the full production release.
