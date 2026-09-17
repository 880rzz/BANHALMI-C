import { appendFile } from 'node:fs/promises';

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Required environment variable is missing: ${name}`);
  return value;
};

const apiBase = process.env.GITHUB_API_URL || 'https://api.github.com';
const repository = required('GITHUB_REPOSITORY');
const githubToken = required('GITHUB_TOKEN');
const artifactId = Number(required('PAGES_ARTIFACT_ID'));
const sha = required('GITHUB_SHA');
const oidcRequestUrl = required('ACTIONS_ID_TOKEN_REQUEST_URL');
const oidcRequestToken = required('ACTIONS_ID_TOKEN_REQUEST_TOKEN');
const outputFile = required('GITHUB_OUTPUT');
const pollIntervalMs = Number(process.env.PAGES_POLL_INTERVAL_MS || 10_000);
const pollTimeoutMs = Number(process.env.PAGES_POLL_TIMEOUT_MS || 2_700_000);

if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error(`Invalid Git commit SHA: ${sha}`);
if (!Number.isSafeInteger(artifactId) || artifactId <= 0) {
  throw new Error(`Invalid Pages artifact ID: ${process.env.PAGES_ARTIFACT_ID}`);
}
if (!Number.isFinite(pollIntervalMs) || pollIntervalMs < 5_000) {
  throw new Error(`Invalid polling interval: ${pollIntervalMs}`);
}
if (!Number.isFinite(pollTimeoutMs) || pollTimeoutMs < 600_000) {
  throw new Error(`Invalid polling timeout: ${pollTimeoutMs}`);
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readJson(response, label) {
  const text = await response.text();
  let body = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = { message: text }; }
  }
  if (!response.ok) {
    const detail = body?.message || response.statusText || 'Unknown API error';
    throw new Error(`${label} failed (${response.status}): ${detail}`);
  }
  return body;
}

async function githubApi(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
}

async function obtainOidcToken() {
  const response = await fetch(oidcRequestUrl, {
    headers: { Authorization: `Bearer ${oidcRequestToken}` }
  });
  const body = await readJson(response, 'OIDC token request');
  if (!body?.value) throw new Error('OIDC token response did not contain a value');
  return body.value;
}

async function writeOutput(name, value) {
  if (value === undefined || value === null || value === '') return;
  await appendFile(outputFile, `${name}=${String(value).replaceAll('\n', '%0A')}\n`);
}

const finalFailureStatuses = new Set([
  'deployment_failed',
  'deployment_content_failed',
  'deployment_cancelled',
  'deployment_lost'
]);

const buildVersion = sha;
const oidcToken = await obtainOidcToken();
const createResponse = await githubApi(`${apiBase}/repos/${repository}/pages/deployments`, {
  method: 'POST',
  body: JSON.stringify({
    artifact_id: artifactId,
    pages_build_version: buildVersion,
    oidc_token: oidcToken
  })
});
const deployment = await readJson(createResponse, 'Pages deployment creation');
const deploymentId = deployment?.id || deployment?.status_url?.split('/').pop() || buildVersion;
const statusUrl = deployment?.status_url || `${apiBase}/repos/${repository}/pages/deployments/${deploymentId}`;
const pageUrl = deployment?.page_url || '';

await writeOutput('deployment_id', deploymentId);
await writeOutput('page_url', pageUrl);
console.log(`Created Pages deployment ${deploymentId} for commit ${buildVersion} and artifact ${artifactId}.`);
console.log(`Polling without automatic cancellation for up to ${Math.round(pollTimeoutMs / 60_000)} minutes.`);

const startedAt = Date.now();
let lastStatus = '';
let transientErrors = 0;

while (Date.now() - startedAt < pollTimeoutMs) {
  await sleep(pollIntervalMs);
  try {
    const response = await githubApi(statusUrl);
    const status = await readJson(response, 'Pages deployment status request');
    const currentStatus = status?.status || 'unknown_status';
    transientErrors = 0;
    if (currentStatus !== lastStatus) {
      console.log(`Pages deployment status: ${currentStatus}`);
      lastStatus = currentStatus;
    }
    if (currentStatus === 'succeed') {
      await writeOutput('status', currentStatus);
      await writeOutput('page_url', status?.page_url || pageUrl);
      console.log('Pages deployment reported success.');
      process.exit(0);
    }
    if (finalFailureStatuses.has(currentStatus)) {
      throw new Error(`Pages deployment reached permanent failure status: ${currentStatus}`);
    }
  } catch (error) {
    transientErrors += 1;
    if (finalFailureStatuses.has(lastStatus)) throw error;
    console.warn(`Temporary deployment status error ${transientErrors}: ${error.message}`);
    if (transientErrors >= 12) {
      throw new Error(`Pages status endpoint failed repeatedly: ${error.message}`);
    }
  }
}

await writeOutput('status', lastStatus || 'deployment_queued');
throw new Error(
  `Pages deployment did not reach a final state within ${Math.round(pollTimeoutMs / 60_000)} minutes. ` +
  'The deployment was intentionally left active and was not cancelled.'
);
