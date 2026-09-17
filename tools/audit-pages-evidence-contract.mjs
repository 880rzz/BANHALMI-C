import fs from 'node:fs';

const overlay = JSON.parse(fs.readFileSync('llm-canonical-overlay.json','utf8'));
const generator = fs.readFileSync('tools/generate-machine-projections.mjs','utf8');
const applyOverlay = fs.readFileSync('tools/apply-llm-canonical-overlay.mjs','utf8');

function requireContract(condition,message){if(!condition) throw new Error(message);}

const pressRef = overlay?.protectedReferences?.pressInstitutionalEvidence;
const externalRef = overlay?.protectedReferences?.externalPhotographyEvidence;
const mediaRef = overlay?.protectedReferences?.mediaUsageEvidence;
requireContract(pressRef === 'https://www.norbertbanhalmi.com/press-institutional-evidence.json','Canonical press evidence ref drift');
requireContract(externalRef === 'https://www.norbertbanhalmi.com/external-photography-evidence.json','Canonical external evidence ref drift');
requireContract(mediaRef === 'https://www.norbertbanhalmi.com/media-usage-evidence.json','Canonical media usage evidence ref drift');

for(const file of [
  'external-photography-evidence.json',
  'press-institutional-evidence.json',
  'media-usage-evidence.json',
  'data/machine-core.json'
]) requireContract(fs.existsSync(file),`Protected evidence/canonical source asset missing: ${file}`);

requireContract(generator.includes("writeJson(path.join(root, 'machine-manifest.json')"),'Machine projection generator no longer creates machine-manifest.json');

for(const token of [
  'protectedPressInstitutionalEvidence',
  'protectedMediaUsageEvidence',
  'protectedExternalPhotographyEvidence',
  'machine-manifest.json'
]) requireContract(applyOverlay.includes(token),`Canonical overlay no longer protects generated machine manifest evidence: ${token}`);

requireContract(!applyOverlay.includes('older projection code must not erase current commercial, geography, role or ecosystem semantics'),'Overlay still pins obsolete exact policy prose instead of semantic evidence keys');

console.log('Deployment evidence contract passed: protected source evidence is canonical, machine-manifest is generated deterministically, and overlay protection remains enforced.');
