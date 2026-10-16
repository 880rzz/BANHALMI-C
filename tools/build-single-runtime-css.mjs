/**
 * Deterministic production CSS compiler.
 *
 * Git temporarily keeps both reviewed source files while old source audits
 * are migrated. The published website receives only ONE style asset: site.css.
 * Keep original cascade order, safely deduplicate identical leaf rules, stamp
 * every HTML CSS URL from final bytes, and remove legacy runtime injectors.
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

// Remove both possible legacy runtime injectors from the shipped scripts.
// Keep the typography / menu / consent JavaScript otherwise byte-identical.
const originalBoot=fs.readFileSync(boot,'utf8');
const bootStart=originalBoot.indexOf("  var href = '/assets/css/fluid-4k-rhythm.css");
const bootEnd=originalBoot.indexOf('  /* Typography integrity is global;',bootStart);
if(bootStart<0||bootEnd<=bootStart)throw Error('Unexpected fluid boot loader');
const cleanBoot=originalBoot.slice(0,bootStart)+
  '  /* Fluid CSS is compiled into site.css. */\n\n'+originalBoot.slice(bootEnd);
if(cleanBoot.includes("var href = '/assets/css/fluid-4k-rhythm.css"))throw Error('Boot still references legacy stylesheet');

const originalConfig=fs.readFileSync(siteConfig,'utf8');
const configStart=originalConfig.indexOf('(function loadFluidRhythm(){');
const configEnd=originalConfig.indexOf('})();',configStart);
if(configStart<0||configEnd<=configStart)throw Error('Unexpected service loader');
const cleanConfig=originalConfig.slice(0,configStart)+
  '/* Fluid CSS is compiled into site.css. */'+originalConfig.slice(configEnd+5);
if(cleanConfig.includes("link.href = '/assets/css/fluid-4k-rhythm.css"))throw Error('Service loader still references legacy stylesheet');

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
fs.writeFileSync(boot,cleanBoot,'utf8');
fs.writeFileSync(siteConfig,cleanConfig,'utf8');
for(const [file,html]of edits)fs.writeFileSync(file,html,'utf8');

// Do not ship a dead second CSS file. The original remains in Git history
// for rollback and source-contract tests, which execute before this step.
fs.unlinkSync(secondary);
const published=fs.readdirSync(cssDir).filter(name=>name.endsWith('.css')).sort();
if(published.length!==1||published[0]!=='site.css')throw Error('Expected one published CSS file, got '+published.join(', '));
console.log('Single CSS production artifact: '+removedFluidLinks+' legacy links removed, '+
  stampedPages+' pages cache-stamped, CSS='+finalCss.length+' chars, URL='+canonicalSiteCss);
