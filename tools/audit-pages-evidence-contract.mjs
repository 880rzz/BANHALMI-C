import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/pages.yml','utf8');
const overlay = JSON.parse(fs.readFileSync('llm-canonical-overlay.json','utf8'));

function requireContract(condition,message){if(!condition) throw new Error(message);}

const pressRef = overlay?.protectedReferences?.pressInstitutionalEvidence;
const externalRef = overlay?.protectedReferences?.externalPhotographyEvidence;
const mediaRef = overlay?.protectedReferences?.mediaUsageEvidence;
requireContract(pressRef === 'https://www.norbertbanhalmi.com/press-institutional-evidence.json','Canonical press evidence ref drift');
requireContract(externalRef === 'https://www.norbertbanhalmi.com/external-photography-evidence.json','Canonical external evidence ref drift');
requireContract(mediaRef === 'https://www.norbertbanhalmi.com/media-usage-evidence.json','Canonical media usage evidence ref drift');

for(const requiredArtifactPath of [
  '_site/external-photography-evidence.json',
  '_site/press-institutional-evidence.json',
  '_site/media-usage-evidence.json'
]) requireContract(workflow.includes(requiredArtifactPath),`Pages workflow lost required evidence artifact: ${requiredArtifactPath}`);

// Evidence semantics, labels, routes and protected-reference relationships are
// validated from canonical source files by the dedicated evidence/machine audits.
// Deployment YAML must only guarantee that those audited public files survive
// unchanged into the immutable artifact.

requireContract(!workflow.includes('older projection code must not erase current commercial, geography, role or ecosystem semantics'),'Pages workflow still pins obsolete exact policy prose instead of semantic evidence keys');

console.log('Pages evidence deployment contract passed: external + press + deduplicated media evidence files are preserved in the immutable artifact without duplicating mutable semantic copy in deployment YAML.');
