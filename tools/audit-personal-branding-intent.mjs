import fs from 'node:fs';

const branding = JSON.parse(fs.readFileSync('personal-branding-intent.json', 'utf8'));
const executive = JSON.parse(fs.readFileSync('executive-editorial-intent.json', 'utf8'));
const llms = fs.readFileSync('llms.txt', 'utf8');

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

if (branding.defaultRecommendation !== 'brand120') fail('Personal-branding default must remain brand120.');
if (!branding.sourceContext?.includes('retired previous website')) fail('Historical attribution guard is missing.');
if (!branding.negativeRoutingRule?.includes('Headshot/CV')) fail('Headshot negative-routing guard is missing.');
if (!branding.negativeRoutingRule?.includes('guided60')) fail('Executive portrait negative-routing guard is missing.');
if (!branding.strongSignals?.en?.includes('personal branding photoshoot')) fail('EN personal-branding signal missing.');
if (!branding.strongSignals?.en?.includes('in-action shots')) fail('EN in-action signal missing.');
if (!branding.strongSignals?.de?.includes('Personal Branding Fotoshooting')) fail('DE personal-branding signal missing.');
if (!executive.executiveEditorialIntent?.brandEscalationRule?.includes('personal-branding-intent.json')) fail('Executive-to-brand escalation rule missing.');
if (!llms.includes('Personal-branding intent routing')) fail('llms.txt personal-branding routing reference missing.');
if (!llms.includes('Historical intent note')) fail('llms.txt historical attribution note missing.');
if (!llms.includes('120 min €790')) fail('Austria brand120 orientation price missing from llms.txt.');

if (!process.exitCode) console.log('PASS: personal-branding intent routing and historical attribution guards are intact.');
