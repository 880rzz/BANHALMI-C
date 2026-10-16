/**
 * Publish the one maintained BANHALMI CSS source as one stylesheet request.
 * Preserve the source cascade, deduplicate only identical rules, and bind the
 * runtime cache URL to the exact emitted CSS bytes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=path.resolve(process.argv[2]||'_site');
const cssDir=path.join(root,'assets/css');
const cssFile=path.join(cssDir,'site.css');
const marker='/* BANHALMI-CANONICAL-FLUID-COMPONENTS-20261016 */';
const stylesheetFiles=fs.readdirSync(cssDir).filter(name=>name.endsWith('.css'));
if(stylesheetFiles.length!==1||stylesheetFiles[0]!=='site.css')
  throw Error('Only the maintained assets/css/site.css source may be published');
if(!fs.existsSync(cssFile))throw Error('Missing site.css');
const originalCss=fs.readFileSync(cssFile,'utf8');
if(originalCss.split(marker).length!==2)throw Error('CSS component authority boundary missing or duplicated');
if(!originalCss.trim())throw Error('Empty CSS source');

for(const rel of ['assets/js/fluid-rhythm-boot.js','assets/js/site-config.js']){
  const script=path.join(root,rel);
  if(!fs.existsSync(script))throw Error('Missing shared runtime '+rel);
  if(/fluid-4k-rhythm\.css|data-fluid-4k-rhythm|loadFluidRhythm/.test(fs.readFileSync(script,'utf8')))
    throw Error('Retired stylesheet injector detected in '+rel);
}

// Exact duplicate leaf rules in the same at-rule context are not needed in
// the delivered cascade. Preserve the last occurrence of identical rules.
execFileSync(process.execPath,['scripts/dedupe-exact-css-rules.mjs',cssFile],{stdio:'inherit'});
const finalCss=fs.readFileSync(cssFile,'utf8');
if(!finalCss.includes(marker))throw Error('CSS component authority boundary lost during compilation');
const token='design-'+createHash('sha256').update(finalCss).digest('hex').slice(0,16);
const canonicalHref='/assets/css/site.css?v='+token;
let checked=0,stamped=0;

function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){walk(file);continue;}
    if(!entry.isFile()||!entry.name.endsWith('.html'))continue;
    checked++;
    const original=fs.readFileSync(file,'utf8');
    if(original.includes('/assets/css/fluid-4k-rhythm.css')||original.includes('data-fluid-4k-rhythm'))
      throw Error('Legacy stylesheet reintroduced in '+file);
    const directStyles=[...original.matchAll(/<link\b(?=[^>]*\bhref=(["'])\/assets\/css\/site\.css\?v=[^"']+\1)[^>]*\/?>/gi)];
    if(directStyles.length!==1)throw Error('Expected exactly one source stylesheet link in '+file+': '+directStyles.length);
    const updated=original.replace(/\/assets\/css\/site\.css\?v=[^"'<> \t\r\n]+/g,canonicalHref);
    if(updated===original&&original.includes(canonicalHref)){stamped++;continue;}
    if(updated===original)throw Error('Unable to stamp canonical CSS version in '+file);
    if(updated.includes('/assets/css/fluid-4k-rhythm.css'))throw Error('Legacy CSS URL in '+file);
    stamped++;
    fs.writeFileSync(file,updated,'utf8');
  }
}
walk(root);
if(checked<50||stamped!==checked)throw Error('Insufficient source HTML CSS coverage '+stamped+'/'+checked);
console.log('Single canonical CSS: '+checked+' HTML pages, '+finalCss.length+' emitted CSS characters, cache URL '+canonicalHref);
