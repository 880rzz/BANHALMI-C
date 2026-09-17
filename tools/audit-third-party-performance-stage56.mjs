import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const failures=[];
const homes=['index.html','hu/index.html','de-at/index.html'];
for(const file of homes){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  if(/<script\b[^>]*src=[\"']https:\/\/(?:cdn\.trustindex\.io|elfsightcdn\.com)\//i.test(html)) failures.push(file+': third-party review script must not load from static HTML');
}
const main=fs.readFileSync(path.join(root,'assets/js/main.js'),'utf8');
for(const token of ['readChoice() === \"all\"','details && !details.open','elfsightcdn.com/platform.js']){
  if(!main.includes(token)) failures.push('main.js missing gated review-loader contract: '+token);
}
if(main.includes('cdn.trustindex.io') || main.includes('trustindex-richsnippet')) failures.push('main.js: Trustindex rich-snippet generator must remain absent; self-serving LocalBusiness/Organization ratings are not an eligible Google review rich-result strategy');
if(failures.length){for(const failure of failures) console.error('FAIL '+failure);process.exit(1);}
console.log('Stage 56 third-party performance audit passed: Trustindex rich-snippet generation is absent, while Elfsight remains consent-plus-interaction gated and absent from static HTML.');
