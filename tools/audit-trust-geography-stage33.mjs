import fs from 'node:fs';

const failures=[];
const pages={
  'trust/index.html':['substantial New York reference archive','/privacy-policy/'],
  'hu/bizalom/index.html':['jelentős New York-i referenciaanyaggal','/hu/adatvedelem/'],
  'de-at/vertrauen/index.html':['umfangreichen New-York-Referenzarchiv','/de-at/datenschutz/']
};
for(const [file,tokens] of Object.entries(pages)){
  const html=fs.readFileSync(file,'utf8');
  for(const token of tokens) if(!html.includes(token)) failures.push(`${file}: missing ${token}`);
}
const en=fs.readFileSync('trust/index.html','utf8');
if(en.includes('/privacy-policy/#processors')) failures.push('trust/index.html still contains the broken #processors fragment');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('Stage 33 Trust Center audit passed: geography is consistent and no broken processors fragment remains.');
