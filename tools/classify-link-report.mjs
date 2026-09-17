import fs from 'node:fs';

const file = 'link-audit-results.json';
if (!fs.existsSync(file)) {
  console.error('FAIL link audit report was not created');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(file, 'utf8'));
const criticalPrefixes = [
  'https://www.norbertbanhalmi.com/',
  'https://www.banhalmi.art/'
];
const definite = [];
const transient = [];

for (const result of report.results || []) {
  if (result.reachable) continue;
  const isCritical = criticalPrefixes.some((prefix) => result.url.startsWith(prefix));
  const isDefiniteBroken = result.status === 404 || result.status === 410;
  if (isCritical || isDefiniteBroken) definite.push(result);
  else transient.push(result);
}

for (const result of transient) {
  console.warn(`WARN transient or bot-protected external URL: ${result.url} (${result.status || result.error})`);
}
for (const result of definite) {
  console.error(`FAIL definite broken URL: ${result.url} (${result.status || result.error})`);
}

console.log(`Classified ${report.checked || 0} checked URLs: ${definite.length} definite failure(s), ${transient.length} transient warning(s).`);
if (definite.length) process.exitCode = 1;
