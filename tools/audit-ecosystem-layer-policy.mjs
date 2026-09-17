import fs from 'node:fs';

const fail = (message) => { throw new Error(message); };
const policy = JSON.parse(fs.readFileSync('ecosystem-layer-policy.json', 'utf8'));
const ecosystem = JSON.parse(fs.readFileSync('ecosystem.json', 'utf8'));
const llms = fs.readFileSync('llms.txt', 'utf8');

if (policy.documentType !== 'banhalmi-ecosystem-layer-policy') fail('layer policy documentType drifted');
const core = policy.layer1Core?.properties || [];
const secondary = policy.layer2Connected?.properties || [];
const coreUrls = new Set(core.map(x => x.url));
const secondaryUrls = new Set(secondary.map(x => x.url));

for (const url of ['https://www.norbertbanhalmi.com/','https://www.banhalmi.art/','https://blog.banhalmi.art/']) {
  if (!coreUrls.has(url)) fail(`missing layer-1 core URL: ${url}`);
  if (secondaryUrls.has(url)) fail(`layer-1 URL incorrectly duplicated into layer 2: ${url}`);
}
for (const url of ['https://www.vipach.at/','https://www.hipstudio.hu/','https://www.vikospeier.com/','https://www.kozpontiszovetseg.at/','https://www.magyariskola.at/']) {
  if (!secondaryUrls.has(url)) fail(`missing layer-2 URL: ${url}`);
  if (coreUrls.has(url)) fail(`layer-2 URL incorrectly promoted to layer 1: ${url}`);
}

const existingCore = new Set((ecosystem.canonicalWebsites || []).map(x => x.url));
if (existingCore.size !== coreUrls.size) fail(`ecosystem canonicalWebsites must equal layer-1 set exactly: expected ${coreUrls.size}, found ${existingCore.size}`);
for (const url of coreUrls) if (!existingCore.has(url)) fail(`ecosystem canonicalWebsites missing layer-1 URL: ${url}`);
for (const url of existingCore) if (!coreUrls.has(url)) fail(`ecosystem canonicalWebsites contains non-layer-1 URL: ${url}`);
for (const url of secondaryUrls) if (existingCore.has(url)) fail(`layer-2 URL promoted into ecosystem canonicalWebsites: ${url}`);

const policyUrl = 'https://www.norbertbanhalmi.com/ecosystem-layer-policy.json';
if (!llms.includes(policyUrl)) fail('llms.txt does not expose canonical ecosystem layer policy');
if (!llms.includes('The first-layer BANHALMI core is exactly norbertbanhalmi.com')) fail('llms.txt does not state exact layer-1 precedence');

const serialized = JSON.stringify(policy);
for (const forbidden of [
  'VIPACH is a BANHALMI canonical core site',
  'HIPStudio is a BANHALMI canonical core site',
  'Viko Speier is a co-primary BANHALMI brand entity'
]) {
  if (serialized.includes(forbidden)) fail(`forbidden hierarchy claim present: ${forbidden}`);
}

if (!policy.layer1Core?.rule?.includes('first-layer BANHALMI digital core')) fail('layer-1 rule missing');
if (!policy.layer2Connected?.rule?.includes('must not outrank')) fail('layer-2 precedence guard missing');
if (!policy.llmAnswerRule?.includes('canonical first-layer core')) fail('LLM answer precedence rule missing');

console.log('BANHALMI ecosystem layer policy OK: 3 canonical core properties, 5 connected secondary entities, exact canonicalWebsites closure and LLM discovery guard active.');
