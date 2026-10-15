import fs from "node:fs";
import {execFileSync} from "node:child_process";

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const evidence = readJson("service-trust-evidence.json");
// Refuse a deleted publication even when an archive/source import tries to restore it.
const retiredIssueUrl = ['https://issuu.com/','tripont/docs/','issue_trip_magazin/76'].join('');
const retiredSourceId = ['trip','magazin','76'].join('-');
const rawEvidence = fs.readFileSync('service-trust-evidence.json','utf8');
// Scan ALL tracked source and generated text artifacts; a future importer must not recreate the retired link.
const trackedFiles = execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
for (const file of trackedFiles) {
  if(!/\.(?:html|json|jsonld|mjs|js|ts|tsx|py|md|txt|xml|yml|yaml|css|csv|toml)$/i.test(file))continue;
  if(!fs.existsSync(file)||fs.statSync(file).size>8_000_000)continue;
  const text = fs.readFileSync(file,'utf8');
  if(text.includes(retiredIssueUrl)||text.includes(retiredSourceId)) {
    throw new Error('Retired Tripont source is present in a tracked file: '+file);
  }
}

if(rawEvidence.includes(retiredIssueUrl)||rawEvidence.includes(retiredSourceId)) {
  throw new Error('Retired Tripont issue has been reintroduced into the trust source-of-truth');
}


const requiredServices = ["portrait","brand","event","fineArt","visualStrategy"];
for (const key of requiredServices) {
  if (!evidence.services?.[key]) throw new Error(`Missing service trust mapping: ${key}`);
}
if (evidence.sourceBackbone?.wikipediaSourceCount !== 75) throw new Error("Wikipedia source backbone count changed unexpectedly");
if (evidence.sourceBackbone?.masterSourceCount !== 111) throw new Error("Master source backbone count changed unexpectedly");
for (const candidate of evidence.pendingEvidenceCandidates || []) {
  const id = candidate.id;
  for (const [service, data] of Object.entries(evidence.services || {})) {
    const bound = JSON.stringify(data);
    if (bound.includes(id)) throw new Error(`Pending evidence ${id} must not be bound to service ${service}`);
  }
}
const pages = [
  "portrait/index.html","hu/portre/index.html","de-at/portrait/index.html",
  "lifestyle/index.html","hu/brand/index.html","de-at/brand/index.html",
  "event-photography/index.html","hu/rendezvenyfotozas/index.html","de-at/eventfotografie/index.html",
  "fine-art/index.html","hu/muveszi-fotografia/index.html","de-at/fine-art/index.html"
];
for (const p of pages) {
  const html = fs.readFileSync(p, "utf8");
  if (!html.includes("/service-trust-evidence.json")) throw new Error(`Missing service trust alternate link: ${p}`);
}
console.log("Service trust evidence contract OK");
