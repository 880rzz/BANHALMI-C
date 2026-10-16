/**
 * Production-only, order-preserving CSS consolidation.
 * Transitional migration: legacy CSS sources stay separate in git until
 * component authority and !important debt pass visual regression.
 * The shipped HTML loads exactly one local CSS asset.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.argv[2]||'_site');
const cssDir=path.join(root,'assets/css');
const primary=path.join(cssDir,'site.css');
const secondary=path.join(cssDir,'fluid-4k-rhythm.css');
const boot=path.join(root,'assets/js/fluid-rhythm-boot.js');
const siteConfig=path.join(root,'assets/js/site-config.js');
for(const file of [primary,secondary,boot,siteConfig])if(!fs.existsSync(file))throw Error('Missing consolidation source '+file);
const base=fs.readFileSync(primary,'utf8');
const fluid=fs.readFileSync(secondary,'utf8');
if(base.includes('BANHALMI-SINGLE-CSS-BUNDLE-V1'))throw Error('CSS already bundled');
if(!base.trim()||!fluid.trim())throw Error('Empty CSS source');
if(/^\s*@(?:import|charset)\b/m.test(fluid))throw Error('Late @import/@charset in second CSS; resolve first');
const bundle=base+'\n\n/* BANHALMI-SINGLE-CSS-BUNDLE-V1: ordered former fluid rules */\n'+fluid+'\n';
const replacements=[];
function walk(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,entry.name);
  if(entry.isDirectory())walk(file);
  else if(entry.isFile()&&entry.name.endsWith('.html')){
   const old=fs.readFileSync(file,'utf8');
   const regex=/<link\b(?=[^>]*\bhref=(["'])\/assets\/css\/fluid-4k-rhythm\.css(?:\?[^"']*)?\1)[^>]*\/?>/gi;
   const matches=[...old.matchAll(regex)];
   if(matches.length>1)throw Error('Duplicate fluid link: '+file);
   if(matches.length===1){
    const next=old.replace(regex,'');
    if(!/\/assets\/css\/site\.css\?v=/.test(next))throw Error('Missing primary CSS: '+file);
    replacements.push([file,next]);
   }
  }
 }
}
walk(root);
if(replacements.length<50)throw Error('Too few stylesheet replacements: '+replacements.length);
const oldBoot=fs.readFileSync(boot,'utf8');
const begin=oldBoot.indexOf("  var href = '/assets/css/fluid-4k-rhythm.css");
const end=oldBoot.indexOf('  /* Typography integrity is global;',begin);
if(begin<0||end<=begin)throw Error('Unexpected runtime stylesheet loader');
const newBoot=oldBoot.slice(0,begin)+'  /* Production CSS is bundled into site.css. No runtime CSS link mutation. */\n\n'+oldBoot.slice(end);
if(newBoot.includes("createElement('link')")||newBoot.includes("var href = '/assets/css/fluid-4k-rhythm.css"))throw Error('Secondary CSS injection remains');
fs.writeFileSync(primary,bundle,'utf8');
fs.writeFileSync(boot,newBoot,'utf8');
// Service routes use site-config.js (not fluid-rhythm-boot.js) to insert the same
// legacy CSS. Remove only the exact loader in the production artifact.
const oldConfig=fs.readFileSync(siteConfig,'utf8');
const configStart=oldConfig.indexOf('(function loadFluidRhythm(){');
const configEnd=oldConfig.indexOf('})();',configStart);
if(configStart<0||configEnd<=configStart)throw Error('Service CSS loader not found in site-config.js');
const newConfig=oldConfig.slice(0,configStart)+'/* Single CSS artifact: site.css already includes the former fluid rules. */'+oldConfig.slice(configEnd+5);
if(newConfig.includes("createElement('link')")||newConfig.includes("link.href = '/assets/css/fluid-4k-rhythm.css"))throw Error('Service dynamic stylesheet loader survived');
fs.writeFileSync(siteConfig,newConfig,'utf8');
for(const [file,html]of replacements)fs.writeFileSync(file,html,'utf8');
const allFiles=replacements.map(([file])=>file);
for(const file of allFiles) {
 const html=fs.readFileSync(file,'utf8');
 if(html.includes('/assets/css/fluid-4k-rhythm.css'))throw Error('Secondary CSS still linked '+file);
 if((html.match(/\/assets\/css\/site\.css\?v=/g)||[]).length!==1)throw Error('Primary stylesheet count '+file);
}
console.log('Production CSS bundle: '+replacements.length+' HTML pages, one site.css, original cascade order preserved; legacy CSS source retained temporarily.');
