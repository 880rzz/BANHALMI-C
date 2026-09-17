import fs from 'node:fs';

const pages=[
  'contact/index.html','hu/kapcsolat/index.html','de-at/kontakt/index.html',
  'requestaquote/index.html','hu/ajanlatkeres/index.html','de-at/anfrage/index.html',
  'speier-viko/index.html','hu/speier-viko/index.html','de-at/speier-viko/index.html'
];
const map={name:'name',email:'email',phone:'tel',company:'organization'};

function setAutocomplete(tag,value){
  if(/\bautocomplete=["'][^"']*["']/i.test(tag)) return tag.replace(/\bautocomplete=(["'])[^"']*\1/i,`autocomplete="${value}"`);
  return tag.replace(/\s*\/?>(?=$)/,m=>` autocomplete="${value}"${m.startsWith('/')?'/':''}>`);
}

for(const file of pages){
  let html=fs.readFileSync(file,'utf8');
  let changed=0;
  for(const [name,value] of Object.entries(map)){
    const re=new RegExp(`<input\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`,`gi`);
    html=html.replace(re,tag=>{const next=setAutocomplete(tag,value);if(next!==tag)changed++;return next});
  }
  const honeypots=[...html.matchAll(/<input\b(?=[^>]*\bname=["']website["'])[^>]*>/gi)];
  if(!honeypots.length) throw new Error(`${file}: honeypot field missing`);
  for(const m of honeypots){if(!/autocomplete=["']off["']/i.test(m[0])||!/aria-hidden=["']true["']/i.test(m[0])||!/tabindex=["']-1["']/i.test(m[0])) throw new Error(`${file}: honeypot semantics drift`)}
  for(const [name,value] of Object.entries(map)){
    const tags=[...html.matchAll(new RegExp(`<input\\b(?=[^>]*\\bname=["']${name}["'])[^>]*>`,'gi'))].map(m=>m[0]);
    if(!tags.length) throw new Error(`${file}: expected ${name} input`);
    for(const tag of tags) if(!new RegExp(`autocomplete=["']${value}["']`,'i').test(tag)) throw new Error(`${file}: ${name} autocomplete not set to ${value}`);
  }
  fs.writeFileSync(file,html);
  console.log(`${file}: normalized browser autofill semantics (${changed} fields changed).`);
}
