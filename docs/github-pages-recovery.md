# GitHub Pages deployment recovery

The BANHALMI production site is published from the protected `main` branch through GitHub Pages with **GitHub Actions** as the publishing source.

## Verified failure mode

On 2026-08-06 several different reviewed commits produced valid Pages artifacts. In every case, the GitHub Pages service kept the deployment in `deployment_queued` state. The official `actions/deploy-pages@v5` action contains a hard maximum timeout of `600000` milliseconds. Values above that limit are reduced to ten minutes, after which the action explicitly cancels the Pages deployment.

The full repository audit, Chromium regression suite, live-link audit and production-routing audit passed. This is therefore a GitHub Pages deployment-queue failure, not a repository build, artifact, route or application failure.

A second failure mode was verified on 2026-08-09: with one production Actions run left waiting on Pages, `cancel-in-progress: false` kept every newer verified `main` release behind that stale local workflow run. That means a healthy newer artifact can be prevented from even reaching the Pages API although it is the release that should ultimately become production.

## Permanent recovery architecture

The repository includes a custom GitHub Actions workflow at `.github/workflows/pages.yml` that:

1. runs the complete static repository audit;
2. creates an immutable artifact from the reviewed commit;
3. excludes repository-only tests, tools, workflow files and internal documentation;
4. verifies the required English, Hungarian and German production entry points;
5. rejects symbolic links;
6. uploads the verified artifact through the official Pages artifact action;
7. passes the exact uploaded `artifact_id` to a repository-owned direct Pages API client;
8. obtains the same GitHub Actions OIDC token required by Pages;
9. binds `pages_build_version` to the verified commit SHA, matching the official Pages action;
10. polls the deployment status for up to 45 minutes;
11. does not cancel a server-side Pages deployment when the local polling window expires;
12. lets a newer verified `main` Actions run supersede an older local workflow run in the single `github-pages-production` concurrency group; and
13. requires exact-live SHA verification on the custom domain before the current release is considered successful.

The direct Pages API client is `tools/deploy-pages-api.mjs`. It calls the documented Pages deployment and status endpoints but contains no cancellation endpoint. The workflow has `contents: read`, `pages: write` and `id-token: write` permissions. It cannot commit, push or rewrite the source repository.

## Local workflow supersession versus Pages cancellation

`cancel-in-progress: true` applies to the GitHub Actions run, not to the Pages deployment API. When a newer reviewed `main` commit arrives, it may supersede the stale local workflow so the current verified artifact can progress. The repository-owned deployment client still does not cancel the already-created server-side Pages deployment: the server-side deployment remains active and can finish in Pages' queue.

This distinction is deliberate. Local workflow supersession prevents an old Actions run from indefinitely blocking newer releases, while the absence of a Pages `/cancel` call avoids deleting a deployment merely because GitHub's backend is slow. The newest run still has to reach `succeed` and then pass exact-live SHA verification against `deployment-sha.txt`; therefore a stale SHA cannot be reported as the successful current release.

## Why the official deploy action is not used

The official deploy action is safe under normal Pages response times, but its fixed ten-minute maximum is unsuitable while the Pages backend leaves otherwise valid deployments in `deployment_queued` for longer. Its timeout handler cancels the server-side deployment, preventing GitHub from completing it later.

The repository-owned client separates local monitoring from server-side cancellation. A temporary GitHub queue delay may still make a workflow wait or eventually report a timeout, but the already-created Pages deployment remains active instead of being deleted.

## Operational rule

- Keep **Settings → Pages → Build and deployment → Source** set to **GitHub Actions**.
- Do not switch back to the generated branch deployment.
- Do not repeatedly create no-op commits to force new deployments.
- Do not add `actions/deploy-pages` back while its hard maximum remains `600000` milliseconds.
- Keep the previously successful production version active until a newer deployment reports `succeed` and passes exact-live SHA verification.
- Every deployment must use the verified commit SHA as its `pages_build_version`.
- A newer reviewed `main` release may supersede a stale local Actions run, but the direct Pages API client itself does not cancel the server-side deployment.
- If API polling expires, inspect both the existing server-side deployment and the current `main` release before retrying.
