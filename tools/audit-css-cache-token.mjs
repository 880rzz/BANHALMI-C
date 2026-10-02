import fs from 'node:fs';
import path from 'node:path';

const files=[];const skip=new Set(['.git','node_modules','.github','artifacts','_site']);
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(entry.name))continue;const full=path.join(dir,entry.name);if(entry.isDirectory())walk(full);else if(entry.isFile()&&entry.name.endsWith('.html'))files.push(full);}}
walk('.');
const errors=[];let references=0;const tokens=new Set();
for(const file of files){const html=fs.readFileSync(file,'utf8');for(const match of html.matchAll(/\/assets\/css\/site\.css\?v=([^"']+)/g)){references++;tokens.add(match[1]);if(!/^design-[a-z0-9-]+$/.test(match[1]))errors.push(`${file}: invalid site.css cache token ${match[1]}`);}}
if(references<50)errors.push(`expected at least 50 versioned site.css references, found ${references}`);
if(tokens.size!==1)errors.push(`source HTML must use exactly one site.css token, found: ${[...tokens].join(', ')}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`CSS cache-token audit passed: ${references} site.css references share one canonical token ${[...tokens][0]}.`);
