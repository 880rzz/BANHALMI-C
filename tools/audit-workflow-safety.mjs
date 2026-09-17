import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dir=path.resolve(import.meta.dirname,'../.github/workflows');
const errors=[];
const workflows=new Map();

for(const name of await readdir(dir)){
  if(!/\.ya?ml$/.test(name)||name.startsWith('_')) continue;
  const text=await readFile(path.join(dir,name),'utf8');
  workflows.set(name,text);

  if(/contents:\s*write/i.test(text)) errors.push(name+': contents write permission is forbidden');
  if(/git\s+push/i.test(text)) errors.push(name+': permanent workflow must not push');
  if(/git\s+commit/i.test(text)) errors.push(name+': permanent workflow must not commit');

  for(const forbidden of [/npm\s+run\s+fix:/i,/npm\s+run\s+sync:/i,/sync-sitemap-lastmod\.mjs/i,/\s--write(?:\s|$)/i]){
    if(forbidden.test(text)) errors.push(name+': permanent workflow invokes a source-mutating maintenance command: '+forbidden);
  }
}

const packageText=await readFile(path.resolve(import.meta.dirname,'../package.json'),'utf8');
if(!packageText.includes('git diff --exit-code')) errors.push('package.json test contract must prove tracked source remains identical to committed HEAD after audits');

const pages=workflows.get('pages.yml')||'';
const sourceAuditPos=pages.indexOf('- name: Run source contract audits');
const artifactPos=pages.indexOf('- name: Prepare immutable Pages artifact');
const browserPos=pages.indexOf('- name: Run exhaustive browser QA');
const lighthouseMobilePos=pages.indexOf('- name: Run mobile Lighthouse strict 100 gate');
const lighthouseDesktopPos=pages.indexOf('- name: Run desktop Lighthouse strict 100 gate');
const uploadPos=pages.indexOf('- name: Upload the exact audited Pages artifact');

if([sourceAuditPos,artifactPos,browserPos,lighthouseMobilePos,lighthouseDesktopPos,uploadPos].some((p)=>p<0) || !(sourceAuditPos<artifactPos && artifactPos<browserPos && browserPos<lighthouseMobilePos && lighthouseMobilePos<lighthouseDesktopPos && lighthouseDesktopPos<uploadPos)){
  errors.push('pages.yml must run source audits first, build an immutable committed artifact, then browser QA and both Lighthouse 100 gates before uploading the deployable artifact');
}
if(!/git archive --format=tar HEAD \| tar -xf - -C _site/.test(pages)) errors.push('pages.yml must build the public artifact from committed HEAD, never from a possibly mutated working tree');
if(!/printf '%s\\n' \"\$GITHUB_SHA\" > _site\/deployment-sha\.txt/.test(pages)) errors.push('pages.yml must stamp the exact source SHA into the artifact');
if(!/Verify exact .*commit is live on custom domain/i.test(pages)) errors.push('pages.yml must verify the exact deployed SHA on the custom domain');
if(!/needs:\s*exact-live/.test(pages)) errors.push('pages.yml production live gate must depend on exact-live verification');
if(!pages.includes('fetch-depth: 0')) errors.push('pages.yml must use full Git history for truthful per-page sitemap lastmod rendering');
if(!pages.includes('render-production-sitemap-lastmod.mjs _site')) errors.push('pages.yml must render production sitemap lastmod from Git history');

for (const token of [
  'llm-canonical-overlay.json',
  'market-geography.json',
  'people-roles.json',
  'llm-commercial-contract.json',
  'approximately 50 professional photographer partners/collaborators',
  'independent professional partner/collaborator',
  '1190 Döbling',
  'XII. kerület / District 12 / Hegyvidék',
  'protectedCanonicalOverlay'
]) {
  if (!pages.includes(token)) errors.push(`pages.yml anti-rollback production gate missing token: ${token}`);
}

const emergency=workflows.get('emergency-pages-deploy.yml')||'';
for(const token of ['audit-machine-core.mjs','audit-authority-integrity.mjs','audit-llm-commercial-contract.mjs','harden-production-artifact.mjs','llm-canonical-overlay.json','approximately 50','independent professional partner','1190 Döbling','XII. kerület']){
  if(!emergency.includes(token)) errors.push(`emergency-pages-deploy.yml must not bypass current LLM/authority contract: missing ${token}`);
}
if(/without quality gates/i.test(emergency)) errors.push('emergency-pages-deploy.yml must not advertise or implement a quality-gate bypass');

const liveProbe=workflows.get('live-production-probe.yml')||'';
if(/Unsupported (?:employee|worksFor) semantics|Employment regression|worksFor regression/i.test(liveProbe)) errors.push('live-production-probe.yml must not block a corrective PR by requiring production to already contain the proposed semantic fix; post-deploy semantic checks belong in llm-live-integrity.yml');
if(!liveProbe.includes('deployment-sha.txt')) errors.push('live-production-probe.yml must still verify the exact current main deployment SHA');

const harden=await readFile(path.resolve(import.meta.dirname,'./harden-production-artifact.mjs'),'utf8');
const generatePos=harden.indexOf('generateMachineProjections(root)');
const overlayPos=harden.indexOf('applyLlmCanonicalOverlay(root)');
if(generatePos<0||overlayPos<0||generatePos>=overlayPos) errors.push('harden-production-artifact.mjs must apply the protected LLM overlay after machine projection generation');
for(const token of ['llm-canonical-overlay.json','people-roles.json','market-geography.json','llm-commercial-contract.json']){
  if(!harden.includes(token)) errors.push(`harden-production-artifact.mjs protected contract missing: ${token}`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Workflow safety audit passed: permanent workflows are read-only; tracked source must remain unchanged after audits; normal and emergency deploys use committed HEAD and hardened artifacts; corrective PRs are not blocked by stale production semantics; generated machine projections are overlaid by the protected current LLM contract; truthful sitemap freshness is release-gated; live anti-rollback tokens are mandatory.');
