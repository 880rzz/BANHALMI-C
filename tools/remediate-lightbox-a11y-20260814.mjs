import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','hu','de-at','de']);
let changed=0;

function walk(dir,rel=''){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isDirectory()&&skip.has(entry.name)&&rel==='') continue;
    const abs=path.join(dir,entry.name);
    const next=path.posix.join(rel,entry.name);
    if(entry.isDirectory()) walk(abs,next);
    else if(entry.isFile()&&entry.name.endsWith('.html')) migrate(abs,next);
  }
}
function labelControl(tag,className,label){
  if(!new RegExp(`\\bclass=["'][^"']*${className}[^"']*["']`,'i').test(tag)) return tag;
  if(/\baria-label=["'][^"']*["']/i.test(tag)) return tag.replace(/\baria-label=(["'])[^"']*\1/i,`aria-label="${label}"`);
  return tag.replace(/<button\b/i,`<button aria-label="${label}"`);
}
function migrate(file,rel){
  let html=fs.readFileSync(file,'utf8');
  const before=html;
  html=html.replace(/<button\b[^>]*>/gi,tag=>{
    tag=labelControl(tag,'universal-lightbox-prev','Previous image');
    tag=labelControl(tag,'universal-lightbox-next','Next image');
    return tag;
  });
  if(html!==before){fs.writeFileSync(file,html);changed++;console.log(`Updated ${rel}`)}
}
walk(root);
console.log(`Updated descriptive English lightbox controls on ${changed} BANHALMI pages.`);
