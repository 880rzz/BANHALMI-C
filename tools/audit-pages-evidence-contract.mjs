import fs from 'node:fs';

const overlay = JSON.parse(fs.readFileSync('llm-canonical-overlay.json','utf8'));
const vercel = JSON.parse(fs.readFileSync('vercel.json','utf8'));

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
  'machine-manifest.json'
]) requireContract(fs.existsSync(file),`Deployable protected evidence/source asset missing: ${file}`);

const manifest=JSON.parse(fs.readFileSync('machine-manifest.json','utf8'));
const serializedManifest=JSON.stringify(manifest);
for(const token of [
  'Press / Editorial Photography',
  'Institutional / Diplomatic Event Photography',
  'International Editorial Image Circulation',
  'Wikimedia Commons Licensed Distribution',
  'Bécsi Napló',
  'pressInstitutionalEvidence',
  'mediaUsageEvidence',
  'protectedPressInstitutionalEvidence',
  'protectedMediaUsageEvidence',
  'https://www.norbertbanhalmi.com/external-photography-evidence.json',
  'https://www.norbertbanhalmi.com/press-institutional-evidence.json',
  'https://www.norbertbanhalmi.com/media-usage-evidence.json'
]) requireContract(serializedManifest.includes(token),`Machine manifest lost protected evidence assertion/reference: ${token}`);

requireContract(vercel?.git?.deploymentEnabled===true,'Vercel Git deployment must remain enabled');
requireContract(!serializedManifest.includes('older projection code must not erase current commercial, geography, role or ecosystem semantics'),'Machine manifest still pins obsolete exact policy prose instead of semantic evidence keys');

console.log('Deployment evidence contract passed: protected evidence files, canonical references and machine-manifest semantics are pinned independently of any removed Pages workflow.');
