import fs from 'node:fs';
const files=['hu/brand/index.html','hu/portre/index.html','hu/rendezvenyfotozas/index.html'];
const old='/hu/altalanos-szerzodesi-feltetelek/';
const canonical='/hu/aszf/';
for(const file of files){let h=fs.readFileSync(file,'utf8');const n=h.split(old).length-1;if(n<1)throw new Error(`${file}: expected legacy Terms reference`);h=h.split(old).join(canonical);if(h.includes(old))throw new Error(`${file}: legacy Terms reference remains`);fs.writeFileSync(file,h);console.log(`${file}: ${n} legacy Terms reference(s) -> ${canonical}`)}
console.log('Historical redirect route itself is intentionally untouched; only canonical references in the three service pages changed.');
