import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflowFile = '.github/workflows/pages.yml';
const clientFile = 'tools/deploy-pages-api.mjs';
const recoveryFile = 'docs/github-pages-recovery.md';
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const file of [workflowFile, clientFile, recoveryFile]) {
  assert(fs.existsSync(file), `${file} is missing`);
}

const workflow = fs.readFileSync(workflowFile, 'utf8');
const client = fs.readFileSync(clientFile, 'utf8');
const recovery = fs.readFileSync(recoveryFile, 'utf8');

for (const token of [
  'name: Deploy production site to GitHub Pages',
  'branches:\n      - main',
  'workflow_dispatch:',
  'contents: read',
  'pages: write',
  'id-token: write',
  'group: github-pages-production',
  'cancel-in-progress: true',
  'run: npm run audit',
  'git archive --format=tar HEAD',
  'outputs:\n      artifact_id:',
  'id: upload',
  'steps.upload.outputs.artifact_id',
  'actions/configure-pages@v5',
  'actions/upload-pages-artifact@v4',
  'path: _site',
  'timeout-minutes: 50',
  'PAGES_ARTIFACT_ID: ${{ needs.build.outputs.artifact_id }}',
  "PAGES_POLL_INTERVAL_MS: '10000'",
  "PAGES_POLL_TIMEOUT_MS: '2700000'",
  'run: node tools/deploy-pages-api.mjs',
  'Verify exact commit is live on the custom domain',
  'expected="$GITHUB_SHA"',
  'deployment-sha.txt'
]) {
  assert(workflow.includes(token), `${workflowFile}: required contract token missing: ${token}`);
}

for (const excluded of [
  '_site/.github',
  '_site/tests',
  '_site/tools',
  '_site/docs',
  '_site/package.json',
  '_site/package-lock.json',
  '_site/playwright.config.mjs'
]) {
  assert(workflow.includes(excluded), `${workflowFile}: internal artifact exclusion missing: ${excluded}`);
}

for (const requiredArtifact of [
  '_site/.nojekyll',
  '_site/CNAME',
  '_site/index.html',
  '_site/hu/index.html',
  '_site/de-at/index.html',
  '_site/robots.txt',
  '_site/sitemap.xml',
  '_site/assets/css/style.css',
  '_site/assets/js/quote-calculator.js'
]) {
  assert(workflow.includes(`test -f ${requiredArtifact}`), `${workflowFile}: artifact assertion missing: ${requiredArtifact}`);
}

for (const token of [
  'ACTIONS_ID_TOKEN_REQUEST_URL',
  'ACTIONS_ID_TOKEN_REQUEST_TOKEN',
  '/pages/deployments',
  'artifact_id: artifactId',
  'const buildVersion = sha;',
  'pages_build_version: buildVersion',
  'oidc_token: oidcToken',
  "currentStatus === 'succeed'",
  'PAGES_POLL_TIMEOUT_MS',
  'The deployment was intentionally left active and was not cancelled.'
]) {
  assert(client.includes(token), `${clientFile}: required deployment-client token missing: ${token}`);
}

const syntaxCheck = spawnSync(process.execPath, ['--check', clientFile], { encoding: 'utf8' });
assert(
  syntaxCheck.status === 0,
  `${clientFile}: JavaScript syntax check failed: ${syntaxCheck.stderr || syntaxCheck.stdout}`
);

assert(!client.includes('`${sha}-${runId}-${runAttempt}`'), `${clientFile}: Pages build version must be the real commit SHA`);
assert(!/contents:\s*write/i.test(workflow), `${workflowFile}: source write permission is forbidden`);
assert(!/git\s+(push|commit)/i.test(workflow), `${workflowFile}: source mutation command is forbidden`);
assert(!/cancel-in-progress:\s*false/i.test(workflow), `${workflowFile}: stale Actions runs must not indefinitely block the latest verified main release`);
assert(!workflow.includes('actions/deploy-pages@'), `${workflowFile}: capped deploy-pages action must not be used`);
assert(!client.includes('/cancel'), `${clientFile}: server-side Pages deployment cancellation endpoint is forbidden`);
assert(workflow.includes('Symbolic links are forbidden in the Pages artifact.'), `${workflowFile}: symlink rejection is missing`);

for (const token of [
  'deployment_queued',
  '600000',
  'direct Pages API client',
  'verified commit SHA',
  'does not cancel',
  'GitHub Actions',
  'supersede',
  'server-side deployment remains active',
  'exact-live SHA verification'
]) {
  assert(recovery.includes(token), `${recoveryFile}: recovery architecture guidance missing: ${token}`);
}

if (failures.length) {
  console.error(`Stage 26 Pages API workflow audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Stage 26 Pages API deployment contract passed: audited, SHA-bound, latest-run superseding and server-side non-cancelling.');
