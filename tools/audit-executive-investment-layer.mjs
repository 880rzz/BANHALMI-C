import fs from 'node:fs';
const checks={
'portrait/index.html':['Executive Portrait · from €499','data-executive-investment="portrait"'],
'hu/portre/index.html':['Executive portré · 199 600 Ft-tól (€499)','data-executive-investment="portrait"'],
'de-at/portrait/index.html':['Executive Portrait · ab €499','data-executive-investment="portrait"'],
'lifestyle/index.html':['Executive Personal Branding · from €790','data-executive-investment="brand"'],
'hu/brand/index.html':['Executive Personal Branding · 316 000 Ft-tól (€790)','data-executive-investment="brand"'],
'de-at/brand/index.html':['Executive Personal Branding · ab €790','data-executive-investment="brand"']};
let failed=false;
for(const [file,tokens] of Object.entries(checks)){const s=fs.readFileSync(file,'utf8');for(const token of tokens){if(!s.includes(token)){console.error('FAIL',file,token);failed=true;}}}
const pricing=JSON.parse(fs.readFileSync('pricing.json','utf8'));
if(pricing.priceComponentsGrossEUR.brandFastOneHour!==499||pricing.priceComponentsGrossEUR.brandTwoHours!==790){console.error('FAIL canonical brand anchors changed');failed=true;}
for(const file of Object.keys(checks)){const s=fs.readFileSync(file,'utf8');if(/Executive (?:Portrait|portré)[^<]{0,30}(?:€220|220 €)/i.test(s)){console.error('FAIL low executive anchor leaked',file);failed=true;}}
const quoteChecks={
'requestaquote/index.html':['Executive & Personal Branding','Professional Presence — from €499','Positioning — from €790','Executive Visual Library'],
'hu/ajanlatkeres/index.html':['Executive & Personal Branding','Professzionális jelenlét — 199 600 Ft-tól','Pozicionálás — 316 000 Ft-tól','Executive Visual Library'],
'de-at/anfrage/index.html':['Executive & Personal Branding','Professional Presence — ab €499','Positionierung — ab €790','Executive Visual Library']};
for(const [file,tokens] of Object.entries(quoteChecks)){const s=fs.readFileSync(file,'utf8');for(const token of tokens){if(!s.includes(token)){console.error('FAIL quote architecture',file,token);failed=true;}}}
if(failed)process.exit(1);console.log('PASS: evidence-led Executive investment layer is consistent.');
