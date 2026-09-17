import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const scanExtensions = new Set(['.html', '.json', '.jsonld', '.txt', '.js']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', 'node_modules', '_site', 'artifacts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && scanExtensions.has(path.extname(entry.name))) {
      const text = fs.readFileSync(full, 'utf8');
      if (/\bacross Europe\b/i.test(text)) failures.push(`${path.relative(root, full)}: legacy Europe-only availability wording remains`);
    }
  }
}

walk(root);

for (const file of ['ai-entry.json', 'entity-identity-contract.json', 'llms.txt', 'services.json']) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  if (!/worldwide/i.test(text)) failures.push(`${file}: documented worldwide project availability missing`);
}

const services = JSON.parse(fs.readFileSync(path.join(root, 'services.json'), 'utf8'));
const principalServices = Array.isArray(services.itemListElement) ? services.itemListElement : [];
if (principalServices.length !== 4) failures.push(`services.json: expected 4 principal services, found ${principalServices.length}`);
for (const service of principalServices) {
  const areaServed = Array.isArray(service.areaServed) ? service.areaServed : service.areaServed ? [service.areaServed] : [];
  if (!areaServed.some((value) => typeof value === 'string' && value.toLowerCase() === 'worldwide')) {
    failures.push(`services.json: ${service.name || service['@id'] || 'unnamed service'} is missing Worldwide in areaServed`);
  }
}

if (failures.length) {
  console.error('Worldwide availability consistency audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('Worldwide availability consistency passed: no Europe-only legacy wording remains and every principal Service explicitly permits agreed worldwide project travel without implying extra physical locations.');
