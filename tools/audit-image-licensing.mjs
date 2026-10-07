import fs from "node:fs";
import path from "node:path";

const ROOT=process.cwd();
const PERSON="https://www.norbertbanhalmi.com/about/";
const TERMS="https://www.norbertbanhalmi.com/terms-conditions/";
const ACQUIRE="https://www.norbertbanhalmi.com/requestaquote/";
const MIRRORS=[["data/image-catalog.json","assets/data/image-catalog.json"],["data/fine-art-archive.json","assets/data/fine-art-archive.json"]];
const errors=[];
const read=p=>JSON.parse(fs.readFileSync(path.join(ROOT,p),"utf8"));
const fail=m=>errors.push(m);

for(const [a,b] of MIRRORS){
 const A=read(a),B=read(b);
 if(JSON.stringify(A)!==JSON.stringify(B)) fail(`${a} and ${b} drifted`);
}
const catalog=read("data/image-catalog.json");
const items=(catalog.dataFeedElement||[]).map(x=>x.item).filter(Boolean);
const seen=new Map();
for(const x of items){
 if(x["@type"]!=="ImageObject") continue;
 const key=x.contentUrl||x.url||x["@id"];
 if(!key){fail("ImageObject missing contentUrl/url/@id");continue;}
 if(seen.has(key)) fail(`duplicate logical image record: ${key}`); seen.set(key,true);
 for(const f of ["creator","copyrightHolder","copyrightNotice","creditText","license","acquireLicensePage"]) if(!x[f]) fail(`${key} missing ${f}`);
 if(x.creator?.["@id"]!==PERSON) fail(`${key} creator drift`);
 if(x.copyrightHolder?.["@id"]!==PERSON) fail(`${key} copyrightHolder drift`);
 if(typeof x.license!=="string"||!x.license.trim()) fail(`${key} empty license`);
 if(typeof x.acquireLicensePage!=="string"||!x.acquireLicensePage.trim()) fail(`${key} empty acquireLicensePage`);
 if(x.license===x.acquireLicensePage) fail(`${key} license and acquireLicensePage must differ`);
 const commons=/creativecommons\.org\/licenses\//.test(x.license)||/commons\.wikimedia\.org/.test(x.acquireLicensePage);
 if(commons){
   if(!/creativecommons\.org\/licenses\//.test(x.license)) fail(`${key} external/Commons record missing explicit CC license`);
 } else {
   if(x.license!==TERMS) fail(`${key} commercial license-policy URL drift`);
   if(x.acquireLicensePage!==ACQUIRE) fail(`${key} commercial acquire-license URL drift`);
 }
}
const archive=read("data/fine-art-archive.json");
const media=archive.associatedMedia||[];
if(archive.numberOfItems!==media.length) fail(`fine-art archive count mismatch: numberOfItems=${archive.numberOfItems}, associatedMedia=${media.length}`);
for(const x of media){
 const key=x.file||x.id||"unknown archive item";
 for(const f of ["creator","copyrightHolder","copyrightNotice","creditText","license","acquireLicensePage"]) if(!x[f]) fail(`${key} missing ${f}`);
 if(x.creator?.["@id"]!==PERSON) fail(`${key} creator drift`);
 if(x.copyrightHolder?.["@id"]!==PERSON) fail(`${key} copyrightHolder drift`);
 if(x.license!==TERMS) fail(`${key} license-policy URL drift`);
 if(x.acquireLicensePage!==ACQUIRE) fail(`${key} acquire-license URL drift`);
}
const html=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(["node_modules",".git"].includes(e.name))continue;const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith(".html"))html.push(p);}};
walk(ROOT);
for(const f of html){
 const s=fs.readFileSync(f,"utf8");
 const blocks=[...s.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
 for(const raw of blocks){let d;try{d=JSON.parse(raw)}catch{continue}
   const visit=v=>{if(!v||typeof v!=="object")return;if(Array.isArray(v)){v.forEach(visit);return;}
     if(v["@type"]==="ImageGallery"&&Array.isArray(v.associatedMedia)){
       if(v.numberOfItems!==undefined&&v.numberOfItems!==v.associatedMedia.length) fail(`${path.relative(ROOT,f)} ImageGallery count mismatch: ${v.numberOfItems} != ${v.associatedMedia.length}`);
     }
     Object.values(v).forEach(visit);
   };visit(d);
 }
}
if(errors.length){console.error("Image licensing audit failed:\n- "+errors.join("\n- "));process.exit(1);}
console.log(`Image licensing audit passed: ${items.length} catalog images, ${media.length} fine-art archive records, ${html.length} HTML files checked.`);
