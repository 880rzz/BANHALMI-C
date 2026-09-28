import fs from "node:fs";

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const evidence = readJson("service-trust-evidence.json");

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
  "glamour/index.html","hu/muveszi-fotografia/index.html","de-at/fine-art/index.html"
];
for (const p of pages) {
  const html = fs.readFileSync(p, "utf8");
  if (!html.includes("/service-trust-evidence.json")) throw new Error(`Missing service trust alternate link: ${p}`);
}
console.log("Service trust evidence contract OK");
