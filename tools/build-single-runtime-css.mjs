/**
 * Deterministic production CSS compiler.
 *
 * Git temporarily keeps both reviewed source files while old source audits
 * are migrated. The published website receives only ONE style asset: site.css.
 * Keep original cascade order, safely deduplicate identical leaf rules, stamp
 * every HTML CSS URL from final bytes, and reject legacy runtime injectors.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root=path.resolve(process.argv[2]||'_site');
const cssDir=path.join(root,'assets/css');
const primary=path.join(cssDir,'site.css');
const secondary=path.join(cssDir,'fluid-4k-rhythm.css');
const boot=path.join(root,'assets/js/fluid-rhythm-boot.js');
const siteConfig=path.join(root,'assets/js/site-config.js');
for(const file of [primary,secondary,boot,siteConfig]){
  if(!fs.existsSync(file))throw Error('Missing CSS migration input: '+file);
}
const base=fs.readFileSync(primary,'utf8');
const fluid=fs.readFileSync(secondary,'utf8');
if(base.includes('BANHALMI-SINGLE-CSS-BUNDLE-V1'))throw Error('CSS already bundled');
if(!base.trim()||!fluid.trim())throw Error('Empty CSS source');
if(/^\s*@(?:import|charset)\b/m.test(fluid))throw Error('Late CSS import/charset requires manual resolution');

// Preserve the original site.css -> fluid CSS cascade order.
fs.writeFileSync(primary,base+'\n\n/* BANHALMI-SINGLE-CSS-BUNDLE-V1: original fluid rules */\n'+fluid+'\n','utf8');
// Existing project deduper removes only exact redundant rules within one
// at-rule context and retains the last copy. It does not rewrite values.
execFileSync(process.execPath,['scripts/dedupe-exact-css-rules.mjs',primary],{stdio:'inherit'});
const finalCss=fs.readFileSync(primary,'utf8');
const token='design-'+createHash('sha256').update(finalCss).digest('hex').slice(0,16);
const canonicalSiteCss='/assets/css/site.css?v='+token;

// Runtime loaders are retired IN SOURCE, not rewritten during publication.
// Fail the build if another script tries to introduce a second stylesheet.
for(const script of [boot,siteConfig]){
  const source=fs.readFileSync(script,'utf8');
  if(/fluid-4k-rhythm\.css|data-fluid-4k-rhythm|loadFluidRhythm/.test(source))
    throw Error('Legacy dynamic CSS loader still present in '+script);
}

const edits=[];
let removedFluidLinks=0,stampedPages=0;
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const filename=path.join(dir,entry.name);
    if(entry.isDirectory()){walk(filename);continue;}
    if(!entry.isFile()||!entry.name.endsWith('.html'))continue;
    const original=fs.readFileSync(filename,'utf8');
    const fluidLink=/<link\b(?=[^>]*\bhref=(["'])\/assets\/css\/fluid-4k-rhythm\.css(?:\?[^"']*)?\1)[^>]*\/?>/gi;
    const found=[...original.matchAll(fluidLink)];
    if(found.length>1)throw Error('Duplicate fluid CSS link: '+filename);
    removedFluidLinks+=found.length;
    let updated=original.replace(fluidLink,'');
    const siteVersion=/\/assets\/css\/site\.css\?v=[^"'<> \t\r\n]+/g;
    const foundPrimary=[...updated.matchAll(siteVersion)];
    if(found.length&&!foundPrimary.length)throw Error('Orphaned CSS page: '+filename);
    if(foundPrimary.length){
      stampedPages++;
      updated=updated.replace(siteVersion,()=>canonicalSiteCss);
    }
    if(updated!==original)edits.push([filename,updated]);
  }
}
walk(root);
if(removedFluidLinks<50||stampedPages<50)throw Error('Insufficient HTML coverage: '+removedFluidLinks+'/'+stampedPages);
for(const [file,html]of edits){
  if(html.includes('/assets/css/fluid-4k-rhythm.css'))throw Error('Legacy CSS HTML reference: '+file);
  if(html.includes('/assets/css/site.css?v=')&&!html.includes(canonicalSiteCss))throw Error('Stale CSS cache token: '+file);
}
for(const [file,html]of edits)fs.writeFileSync(file,html,'utf8');

// Do not ship a dead second CSS file. The original remains in Git history
// for rollback and source-contract tests, which execute before this step.
fs.unlinkSync(secondary);
const published=fs.readdirSync(cssDir).filter(name=>name.endsWith('.css')).sort();
if(published.length!==1||published[0]!=='site.css')throw Error('Expected one published CSS file, got '+published.join(', '));
console.log('Single CSS production artifact: '+removedFluidLinks+' legacy links removed, '+
  stampedPages+' pages cache-stamped, CSS='+finalCss.length+' chars, URL='+canonicalSiteCss);
