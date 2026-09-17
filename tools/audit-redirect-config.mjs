import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const expectations = [
  ['redirects/hu/vercel.json', 'https://www.norbertbanhalmi.com/hu/:path*'],
  ['redirects/at/vercel.json', 'https://www.norbertbanhalmi.com/de-at/:path*']
];
const rootExpectations = new Map([
  ['banhalmi.at', 'https://www.norbertbanhalmi.com/de-at/:path*'],
  ['www.banhalmi.at', 'https://www.norbertbanhalmi.com/de-at/:path*'],
  ['banhalminorbert.hu', 'https://www.norbertbanhalmi.com/hu/:path*'],
  ['www.banhalminorbert.hu', 'https://www.norbertbanhalmi.com/hu/:path*']
]);

const failures = [];
for (const [relativePath, destination] of expectations) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing`);
    continue;
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    failures.push(`${relativePath}: invalid JSON (${error.message})`);
    continue;
  }
  const redirects = config.redirects;
  if (!Array.isArray(redirects) || redirects.length !== 1) {
    failures.push(`${relativePath}: expected exactly one redirect rule`);
    continue;
  }
  const rule = redirects[0];
  if (rule.source !== '/:path*') failures.push(`${relativePath}: source must preserve all paths`);
  if (rule.destination !== destination) failures.push(`${relativePath}: unexpected destination ${rule.destination}`);
  if (rule.permanent !== true) failures.push(`${relativePath}: redirect must be permanent`);
}

const rootConfigPath = path.join(root, 'vercel.json');
if (!fs.existsSync(rootConfigPath)) {
  failures.push('vercel.json: missing root-level host routing for a repository-root Vercel project');
} else {
  let rootConfig;
  try {
    rootConfig = JSON.parse(fs.readFileSync(rootConfigPath, 'utf8'));
  } catch (error) {
    failures.push(`vercel.json: invalid JSON (${error.message})`);
  }

  if (rootConfig) {
    const redirects = Array.isArray(rootConfig.redirects) ? rootConfig.redirects : [];
    for (const [host, destination] of rootExpectations) {
      const rule = redirects.find((candidate) =>
        candidate.source === '/:path*' &&
        candidate.destination === destination &&
        candidate.permanent === true &&
        Array.isArray(candidate.has) &&
        candidate.has.some((condition) =>
          condition.type === 'header' &&
          String(condition.key || '').toLowerCase() === 'host' &&
          condition.value === host
        )
      );
      if (!rule) failures.push(`vercel.json: missing permanent Host-header redirect for ${host} -> ${destination}`);
    }
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log('Vercel language-domain redirects are valid for both monorepo-root and repository-root projects.');
