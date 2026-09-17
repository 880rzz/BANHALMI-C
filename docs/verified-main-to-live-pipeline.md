# Verified main-to-live pipeline

A production change is complete only after all five gates pass:

1. deterministic repository audit;
2. Chromium browser regression suite, including EN/HU/DE mobile navigation;
3. immutable GitHub Pages artifact creation;
4. Pages API deployment without cancellation;
5. custom-domain smoke test that reads `deployment-sha.txt` and confirms it matches `GITHUB_SHA`.

The public artifact contains `deployment-sha.txt`; repository-only tests, tools, workflows and documentation remain excluded.

Commits created through a GitHub App may not emit a new `push` workflow event. In that case, use the existing `workflow_dispatch` control for the Pages and full-audit workflows. This is an event-delivery limitation, not permission to bypass any gate.
