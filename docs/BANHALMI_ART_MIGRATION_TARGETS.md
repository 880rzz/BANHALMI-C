# BANHALMI ART migration targets

This file protects the professional destination URLs used by legacy `banhalmi.art` redirects.

## Stable Hungarian destinations

| Legacy source | Canonical destination | Purpose |
|---|---|---|
| `https://www.banhalmi.art/ajanlatkeres` | `https://www.norbertbanhalmi.com/hu/ajanlatkeres/` | Hungarian quote request |
| `https://www.banhalmi.art/kapcsolat` | `https://www.norbertbanhalmi.com/hu/kapcsolat/` | Hungarian contact page |

These destinations are content-equivalent professional replacements and must remain indexable, self-canonical, included in the sitemap, and free of redirect chains.

## Governance

- Artistic records remain on `www.banhalmi.art`.
- Current commercial and professional services live on `www.norbertbanhalmi.com`.
- Do not redirect obsolete artistic URLs to professional pages unless the destination satisfies the same user intent.
- Do not redirect unrelated removed URLs to a homepage. Let them return a real 404 response.
- The central external identity reference for Norbert Banhalmi is Wikidata `Q56391118`.

Any future rename of the destinations above must update the redirect map in `880rzz/ART` in the same release, using one direct permanent redirect only.
