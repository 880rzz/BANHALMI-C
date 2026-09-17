import fs from 'node:fs';
import path from 'node:path';

const roots=['hu','ai.txt','llms.txt','llms-full.txt','customer-needs.json'];
const changed=[];
function fixFile(file){
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory()) return;
  if(!/\.(?:html|json|txt)$/i.test(file)) return;
  const before=fs.readFileSync(file,'utf8');
  const after=before.replace(/\baz vezetői\b/giu,m=>m[0]==='A'?'A vezetői':'a vezetői');
  if(after!==before){fs.writeFileSync(file,after);changed.push(file);}
}
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else fixFile(p)}}
for(const root of roots){if(fs.existsSync(root)&&fs.statSync(root).isDirectory())walk(root);else fixFile(root)}
const remains=[];
for(const root of roots){
  const scan=file=>{if(!fs.existsSync(file)||fs.statSync(file).isDirectory()||!/\.(?:html|json|txt)$/i.test(file))return;const t=fs.readFileSync(file,'utf8');if(/\baz vezetői\b/iu.test(t))remains.push(file)};
  if(fs.existsSync(root)&&fs.statSync(root).isDirectory()){const rec=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?rec(p):scan(p)}};rec(root)}else scan(root);
}
if(remains.length) throw new Error('Incorrect Hungarian article remains: '+remains.join(', '));
console.log(`Corrected “az vezetői” → “a vezetői” in ${changed.length} content files.`);
console.log(changed.join('\n'));
