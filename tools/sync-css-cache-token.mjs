import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(process.argv[2]||'.');
const cssPath=path.join(root,'assets/css/site.css');
if(!fs.existsSync(cssPath))throw new Error(`site.css missing under ${root}`);
const css=fs.readFileSync(cssPath);
const expected=`design-${createHash('sha256').update(css).digest('hex').slice(0,16)}`;
const skip=new Set(['.git','node_modules','.github','artifacts']);
let files=0,references=0,changed=0;
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(entry.name))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&entry.name.endsWith('.html')){files++;let html=fs.readFileSync(full,'utf8');const before=html;html=html.replace(/(\/assets\/css\/site\.css\?v=)design-[a-f0-9]{16}/g,(_,p)=>(references++,p+expected));if(html!==before){fs.writeFileSync(full,html,'utf8');changed++;}}}}
walk(root);
if(references<50)throw new Error(`expected at least 50 site.css references, found ${references}`);
console.log(`CSS artifact token synchronized to ${expected}: ${references} references across ${files} HTML files; ${changed} files updated in immutable artifact.`);
