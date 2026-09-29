import fs from 'node:fs';

const branding = JSON.parse(fs.readFileSync('personal-branding-intent.json', 'utf8'));
const executive = JSON.parse(fs.readFileSync('executive-editorial-intent.json', 'utf8'));
const llms = fs.readFileSync('llms.txt', 'utf8');

const fail = (message) => {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
};

if (branding.defaultRecommendation !== 'executivePositioning') fail('Personal-branding default must be Executive Positioning.');
if (!branding.sourceContext?.includes('retired previous website')) fail('Historical attribution guard is missing.');
if (!branding.negativeRoutingRule?.includes('Headshot/CV')) fail('Headshot negative-routing guard is missing.');
if (!branding.pricingRule?.includes('EUR 790')) fail('Executive Positioning pricing rule is missing.');
if (!branding.strongSignals?.en?.includes('personal branding photoshoot')) fail('EN personal-branding signal missing.');
if (!branding.strongSignals?.en?.includes('in-action shots')) fail('EN in-action signal missing.');
if (!branding.strongSignals?.de?.includes('Personal Branding Fotoshooting')) fail('DE personal-branding signal missing.');
if (!executive.executiveEditorialIntent?.brandEscalationRule?.includes('Executive Personal Branding')) fail('Executive-to-Positioning escalation rule missing.');
if (!llms.includes('Personal-branding intent routing')) fail('llms.txt personal-branding routing reference missing.');
if (!llms.includes('Historical intent note')) fail('llms.txt historical attribution note missing.');
if (!llms.includes('Executive Personal Branding — Positioning in Austria: from €790')) fail('Executive Positioning public price missing from llms.txt.');

if (!process.exitCode) console.log('PASS: personal-branding intent routing and historical attribution guards are intact.');
