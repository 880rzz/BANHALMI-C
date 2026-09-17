import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const failures=[];
const skip=new Set(['.git','node_modules','_site','dist','coverage']);
const files=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const a=path.join(dir,e.name);if(e.isDirectory())walk(a);else if(e.isFile()&&e.name.endsWith('.html'))files.push(a)}}
walk(root);
const idCache=new Map();
function ids(file){if(idCache.has(file))return idCache.get(file);if(!fs.existsSync(file))return null;const h=fs.readFileSync(file,'utf8');const set=new Set([...h.matchAll(/\bid=["']([^"']+)["']/gi)].map(m=>m[1]));idCache.set(file,set);return set}
function targetFile(source,hrefPath){let clean=decodeURIComponent(hrefPath||'');if(!clean)return source;if(clean.startsWith('/'))clean=clean.slice(1);else clean=path.posix.normalize(path.posix.join(path.posix.dirname(path.relative(root,source).replaceAll('\\','/')),clean));if(clean.endsWith('/'))clean+='index.html';else if(!path.posix.extname(clean))clean=fs.existsSync(path.join(root,clean+'.html'))?clean+'.html':path.posix.join(clean,'index.html');return path.join(root,clean)}
let checked=0;
for(const file of files){const html=fs.readFileSync(file,'utf8');if(/<meta[^>]+http-equiv=["']refresh["']/i.test(html))continue;for(const m of html.matchAll(/href=["']([^"']*#[^"']*)["']/gi)){const href=m[1];if(/^(?:https?:|mailto:|tel:|javascript:)/i.test(href))continue;const [p,fragRaw]=href.split('#',2);const frag=decodeURIComponent(fragRaw||'');if(!frag)continue;const target=targetFile(file,p);const set=ids(target);checked++;if(!set)failures.push(`${path.relative(root,file)}: fragment target file missing for ${href}`);else if(!set.has(frag))failures.push(`${path.relative(root,file)}: fragment #${frag} missing in ${path.relative(root,target)}`)}}
if(failures.length){console.error('Internal fragment target audit FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log(`Internal fragment target audit passed (${checked} fragment links checked).`);
