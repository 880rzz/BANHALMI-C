import fs from 'node:fs';
const pages=['contact/index.html','hu/kapcsolat/index.html','de-at/kontakt/index.html','requestaquote/index.html','hu/ajanlatkeres/index.html','de-at/anfrage/index.html','speier-viko/index.html','hu/speier-viko/index.html','de-at/speier-viko/index.html'];
const expected={name:'name',email:'email',phone:'tel',company:'organization'};
const failures=[];
for(const file of pages){const h=fs.readFileSync(file,'utf8');for(const [name,value] of Object.entries(expected)){const tags=[...h.matchAll(new RegExp(`<input\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`,'gi'))].map(m=>m[0]);if(!tags.length)failures.push(`${file}: missing ${name} field`);for(const tag of tags)if(!new RegExp(`autocomplete=["']${value}["']`,'i').test(tag))failures.push(`${file}: ${name} must use autocomplete=${value}`)}const hp=[...h.matchAll(/<input\b(?=[^>]*\bname=["']website["'])[^>]*>/gi)].map(m=>m[0]);if(!hp.length)failures.push(`${file}: honeypot missing`);for(const tag of hp)for(const token of ['autocomplete="off"','aria-hidden="true"','tabindex="-1"'])if(!tag.includes(token))failures.push(`${file}: honeypot missing ${token}`)}
if(failures.length){console.error('Form autocomplete audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('Form autocomplete audit passed across all 9 BANHALMI forms.');
