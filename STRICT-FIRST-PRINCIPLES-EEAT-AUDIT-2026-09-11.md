# BANHALMI strict first-principles E-E-A-T & Search Console readiness audit

Date: 2026-09-11
Scope: norbertbanhalmi.com professional layer, machine-readable authority graph, evidence registries, technical SEO, Search Console readiness, E-E-A-T, trust, performance, accessibility, legal/privacy and anti-rollback.

## Decision

Search Console submission is **BLOCKED** until the P1 items below are remediated, merged, deployed and exact-live verified.

## P1 blockers

### 1. Canonical brand semantics are still internally contradictory at source level
`data/machine-core.json` still stores `brand.positioning = "Professional Photography Team"`, while the protected naming contract explicitly retires that value in favour of `Photography Team`. The production overlay currently repairs downstream machine outputs, but this is a compensating layer rather than a first-principles source-of-truth fix.

Required remediation:
- canonical source must emit `Photography Team` directly;
- generated projections must no longer require semantic correction for this value;
- anti-rollback must fail if `Professional Photography Team` returns as a brand-positioning value.

### 2. Sitemap lastmod is not trustworthy
`sitemap.xml` still exposes 2026-08-11 for pages materially changed during September. Google should receive truthful freshness signals only. Stale lastmod dates reduce trust in the sitemap and weaken the value of Search Console resubmission.

Required remediation:
- production sitemap lastmod must be generated from the latest committed modification of each page source, or lastmod must be omitted where exact freshness cannot be guaranteed;
- release CI must validate the production sitemap rather than accepting a stale committed sitemap.

## E-E-A-T review

### Experience — strong
Signals present:
- continuous photographic practice since 1999 is explained in the biography;
- process-led service pages describe real portrait, brand and executive-event workflows;
- Péter Magyar portrait case study links original work, Commons/Wikidata and subsequent editorial reuse;
- client reviews, books, exhibitions and long-form archive create first-hand work evidence.

Risk:
- experience claims should stay tied to demonstrable projects and dated records rather than broad superlatives.

### Expertise — strong
Signals present:
- WKO/GISA professional photographer registration;
- Information Engineering, NYIP and applied-photographer education history;
- OM SYSTEM ambassador and professional photographic memberships;
- explicit executive portrait, brand photography and C-level event methodology.

Risk:
- the most important qualification claims should remain directly source-linked where possible rather than depending on self-description alone.

### Authoritativeness — very strong and improving
Signals present:
- WKO official business record;
- AmCham Austria membership/event credits;
- U.S. Embassy / SelectUSA event evidence with strict relationship boundaries;
- Bécsi Napló press attribution;
- independent editorial reuse of the Péter Magyar portrait;
- Wikimedia Commons / Wikidata entity resolution;
- separate media-usage and institutional evidence registries.

Risk:
- editorial publication, event access, membership, venue context, client relationship and endorsement must remain separate evidence types.

### Trust — strong, but P1 source consistency must be fixed
Signals present:
- legal notice, privacy, cookie, terms and accessibility pages;
- explicit VAT/GISA/GLN identity data;
- consent-first privacy model;
- relationship guardrails around political/editorial/institutional evidence;
- exact-live SHA deployment verification;
- anti-rollback CI and evidence-specific audits.

Risks:
- source-level contradiction masked by post-generation overlay;
- stale sitemap freshness metadata;
- old superseded PRs still contain obsolete entity wording and should never be treated as current authority.

## Technical SEO / crawling

PASS:
- canonical URLs and EN/DE-AT/HU hreflang present on representative pages;
- x-default present;
- robots.txt allows crawling and points to the canonical sitemap;
- service URLs are separated by user intent rather than thin keyword permutations;
- legacy redirects are guarded in CI;
- sitemap contains canonical public routes and image entries;
- structured-data layers include Person, Organization, Brand, WebSite/WebPage and relevant evidence datasets.

BLOCKER:
- sitemap lastmod freshness is stale.

## Content / intent quality

PASS:
- homepage starts from user situation instead of internal service jargon;
- executive portrait, brand photography and C-level event journeys are distinct;
- fine-art archive is separated from the commercial service layer;
- no evidence found that political reuse is being presented as political commissioning or endorsement;
- service copy avoids therapy/healing claims in fine-art positioning.

WATCH:
- broad phrases such as `substantial New York reference archive` should remain supportable by visible archive material and should never be upgraded into a market-office/location claim.

## Entity / Schema / LLM

PASS:
- Person Q56391118 and Organization Q138425941 are explicitly separated;
- BANHALMI primary brand and BANHALMI Photography alternate commercial name are modeled separately from the legal entity;
- secondary ecosystem entities are protected from being promoted to canonical-core status;
- external photography, press/institutional and media-usage evidence now have separate machine-readable registries;
- publication/tagging/reuse is not automatically promoted to client/partner/endorsement status.

BLOCKER:
- canonical source still contains the retired brand-positioning value and relies on overlay correction.

## Performance / UX / accessibility

Current release infrastructure includes:
- strict mobile and desktop Lighthouse gates;
- browser-layout audit;
- first-principles layout audit;
- visual capture;
- E2E interaction tests;
- accessibility page and skip-link semantics;
- responsive EN/HU/DE layouts.

Search Console should wait until the final audit-fix release passes these gates again and is exact-live verified.

## Search Console go/no-go gate

GO only when all are true:
1. canonical source semantics are internally consistent;
2. sitemap freshness is truthful in the deployed artifact;
3. full source-contract, browser, E2E, mobile Lighthouse and desktop Lighthouse gates are green;
4. exact deployed SHA matches main;
5. live `robots.txt`, `sitemap.xml`, canonical homepages and key service/case-study URLs return successfully;
6. live machine evidence endpoints contain the current external, press/institutional and deduplicated media-usage registries;
7. no unresolved PR review conversations remain;
8. no P1 trust or relationship-inference findings remain.

Only after this gate should the sitemap be submitted/resubmitted and priority URLs be requested for indexing in Search Console.
