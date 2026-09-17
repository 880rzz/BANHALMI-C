# Release checklist

A release is complete only when:

- the deterministic audit passes;
- the full Chromium suite passes;
- sitemap `lastmod` values match the latest Git commit date of each canonical source page;
- the Pages artifact is built from the reviewed commit;
- the Pages API reports success without cancelling the server-side deployment;
- `https://www.norbertbanhalmi.com/deployment-sha.txt` equals `GITHUB_SHA`;
- EN, HU and DE production entry points return the expected BANHALMI page;
- the production mobile active-state CSS is present.

The Vercel projects are outside this release path.
