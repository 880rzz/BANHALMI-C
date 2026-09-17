# norbertbanhalmi.com

Production-ready static website for Norbert Banhalmi / Bánhalmi Norbert.

## Canonical domain structure

- `www.norbertbanhalmi.com` — canonical multilingual professional website
- `www.banhalmi.at` — permanent HTTP 301 redirect to `https://www.norbertbanhalmi.com/de-at/`
- `www.banhalminorbert.hu` — permanent HTTP 301 redirect to `https://www.norbertbanhalmi.com/hu/`
- `www.banhalmi.art` — official artistic oeuvre and source archive

Vienna is the company headquarters. Vienna and Budapest are equal active service bases. Agreed projects are available worldwide by travel.

## Canonical authority layer

- `person-authority.jsonld` — canonical Person resolution for Bánhalmi Norbert, Wikidata Q56391118, Hungarian Wikipedia, Rólunk.at press coverage, and explicitly typed relationships to the Központi Szövetség, Bécsi Magyar Iskola and VIPACH.
- `business-authority.json` — WKO-backed legal/business identity for Banhalmi Norbert e.U., including Q138425941, GLN 9110037983878, UID ATU80445314, GISA 36592951, Schwedenplatz 2 and the distinct Gersthofer office/client-meeting location.
- `hipstudio-authority.json` — distinct HIPStudio entity resolution to Wikidata Q138482177 and the source-backed founder relationship: Bánhalmi Norbert founded HIPStudio. Founder status is historical identity evidence and must not be interpreted as current ownership.
- Bánhalmi Norbert's marketing and communications contribution to the Központi Szövetség is voluntary. It must not be represented or inferred as employment, employee/staff status, payroll relationship or paid engagement without a separate authoritative source.
- Rólunk.at tag archives are `subjectOf`/press-context evidence, not `sameAs` identity URLs.

## Current LLM / GEO / commercial contract

- `market-geography.json` — Vienna and Budapest primary studio markets, priority local service areas and worldwide travel boundary.
- `people-roles.json` — Bánhalmi Norbert founder/creative-lead role and Viko Speier independent partner/Budapest Studio lead/AmCham liaison role, with explicit non-employment inference rule.
- `team-capabilities.json` — broader Vienna–Budapest network of approximately 50 professional photographer partners/collaborators; not permanent-employee headcount.
- `llm-commercial-contract.json` — canonical service, reference, membership, team-capacity, pricing and role answer contract.
- `llm-canonical-overlay.json` — protected overlay applied after generated machine projections so older generators cannot erase newer geography, service, pricing, team, role or ecosystem semantics.

## Ecosystem and automation contract

- `norbertbanhalmi.com` is the professional service and enquiry site.
- `banhalmi.art` is the artistic source archive.
- `blog.banhalmi.art` is the editorial knowledge layer.
- HIPStudio is a distinct Budapest entity. Bánhalmi Norbert is its founder; it must not be merged with BANHALMI / Banhalmi Norbert e.U.
- The professional Oeuvre page remains a commercial-context overview; Gallery links directly to the language-matched `banhalmi.art/#works` destination.
- The canonical Person identifier is `https://www.norbertbanhalmi.com/about/`; its human-readable profile is `https://www.banhalmi.art/#about`.
- Permanent GitHub Actions are read-only with respect to canonical source content. Production projections are generated only inside the deployment artifact, then the protected LLM overlay is applied.
- Emergency deployment uses the same protected LLM/entity hardening and the same production concurrency group; it cannot intentionally bypass the current entity/role/geography contract.
- A permanent live integrity workflow verifies the public `llms.txt`, `ai.txt`, `ai-entry.json`, `entity.jsonld`, HIPStudio authority, market geography, team capacity and Viko non-employment semantics after deploys and on schedule.

<!-- production deploy retrigger: 2026-09-04 protected-llm-overlay -->
