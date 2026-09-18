import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const expectations = [
  ['redirects/hu/vercel.json', 'https://www.norbertbanhalmi.com/hu/:path*'],
  ['redirects/at/vercel.json', 'https://www.norbertbanhalmi.com/de-at/:path*']
];

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
  if (config?.git?.deploymentEnabled !== true) failures.push(`${relativePath}: Git deployment must be enabled on BANHALMI-C`);
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

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log('Dedicated Vercel language-entry projects are valid: AT -> /de-at/ and HU -> /hu/, with permanent path-preserving redirects.');
