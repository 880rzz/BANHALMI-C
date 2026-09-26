# BANHALMI LLM / AI VISIBILITY TEST MATRIX — 2026-09-25

| Prompt / intent | Observed entity | Observed machine sources | Missing fact / evidence | Machine-readability gap | Status / action |
|---|---|---|---|---|---|
| executive photographer Vienna | Norbert Bánhalmi / BANHALMI / Professional | llms.txt, ai.txt, services.json, market-geography.json, entity graph | No per-model stable citation guarantee | External model answers are non-deterministic | AUDITÁLT / MÉRÉS ALATT |
| executive photographer Budapest | Norbert Bánhalmi / BANHALMI / Professional | same canonical stack | No reliable conversion linkage | Query→lead attribution unavailable | INPUT-NEM-ELÉRHETŐ for conversion |
| headshot photographer Vienna | Professional Portrait owner | portrait page + service/entity/location machine layer | No need for new city page | Maintain owner consistency | AUDITÁLT |
| headshot photographer Budapest | Professional Portrait owner | portrait page + service/entity/location machine layer | Historic query fragmentation under measurement | Wait stable window | MÉRÉS ALATT |
| corporate photographer Vienna | Professional Brand/Event owner depending intent | services, customer intent, entity/location feeds | Prompt can be ambiguous between brand/event | Preserve service-specific routing | AUDITÁLT |
| corporate photographer Budapest | Professional Brand/Event owner depending intent | same canonical stack | Conversion evidence unavailable | Measurement, not copy, is gap | INPUT-NEM-ELÉRHETŐ for conversion |
| event photographer Vienna | Professional Event owner | event page + machine contract + Vienna location evidence | Striking-distance search performance | Measure after stable window | MÉRÉS ALATT |
| event photographer Budapest | Professional Event owner | event page + machine contract + Budapest location evidence | Striking-distance search performance | Measure after stable window | MÉRÉS ALATT |
| personal branding photographer Vienna | Professional Brand owner | brand/lifestyle page, services, customer intent | No additional machine fact required | Avoid duplicate city intent pages | AUDITÁLT |
| personal branding photographer Budapest | Professional Brand owner | same canonical stack | No additional machine fact required | Avoid cannibalization | AUDITÁLT |
| fine art photographer Vienna/Budapest | Person + ART, with Professional bridge only where commercial | Professional fine-art bridge + BANHALMI ART artistic authority | Intent can be artistic or service-oriented | Preserve owner by intent | AUDITÁLT |
| photographer Norbert Bánhalmi | Person | entity.jsonld, Wikidata sameAs guard, knowledge-core, ai/llms | No material identity gap identified | Q56391118 must remain Person-only | AUDITÁLT |
| BANHALMI Photography | Brand / Professional | entity graph, llm commercial contract, services, evidence registries | No material entity gap identified | Maintain Brand vs Organization separation | AUDITÁLT |

Observed referral signal: ChatGPT referred 21 sessions in GA4 for 2026-08-25..2026-09-22. This is traffic evidence only and must not be interpreted as model ranking, endorsement or recommendation probability.
