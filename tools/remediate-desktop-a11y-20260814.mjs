import fs from 'node:fs';
const file='assets/css/site.css';
let css=fs.readFileSync(file,'utf8');
const end='/* APPLE-RESPONSIVE-CONTRACT-V1:END */';
if(!css.includes(end)) throw new Error('Apple responsive contract END marker missing');
const patch=`
/* DESKTOP-A11Y-REMEDIATION-20260814:START */
/* Lighthouse/browser-confirmed contrast, touch-target, wrapping and link distinctions. */
html body [data-surface="dark"] .section-head :is(h1,h2,h3){color:#F5F5F7!important;}
html body [data-surface="dark"] .section-head :is(.eyebrow,.label,.kicker){color:#DCC56B!important;}
html body .site-footer .brand .brand-word{color:#DCC56B!important;}
html body main :is(.section,.section-band) p a:not(.btn):not(.btn-link){
  text-decoration:underline!important;
  text-underline-offset:.18em!important;
  text-decoration-thickness:max(1px,.07em)!important;
}
/* Keep the visible hamburger glyph unchanged while ensuring the interactive
   control itself meets the mobile touch-target contract. */
html body .site-header .menu-btn{
  min-width:44px!important;
  min-height:44px!important;
  align-items:center!important;
  justify-content:center!important;
}
/* The homepage principle band is a dark surface. Generic heading/prose rules
   previously reintroduced dark ink on the navy background. */
html body .presence-thesis[data-surface="dark"]{
  background:#202530!important;
  color:#F5F5F7!important;
}
html body .presence-thesis[data-surface="dark"] :is(h1,h2,h3,p){color:#F5F5F7!important;}
html body .presence-thesis[data-surface="dark"] :is(.eyebrow,.title-accent){color:#DCC56B!important;}
html body .presence-thesis[data-surface="dark"] .btn-link{color:#F5F5F7!important;}
html body .presence-thesis[data-surface="dark"] .btn-link:hover,
html body .presence-thesis[data-surface="dark"] .btn-link:focus-visible{color:#DCC56B!important;}
/* Long legal URLs, Austrian identifiers and German compounds may wrap on narrow
   screens; ordinary prose remains unaffected because overflow-wrap only acts
   when a token cannot otherwise fit. */
@media (max-width:480px){
  html body main :is(p,li,a,strong,span,code){overflow-wrap:anywhere;}
  html body main :is(.legal,.prose,.card,.split,.grid-2,.grid-3){min-width:0;}
}
/* DESKTOP-A11Y-REMEDIATION-20260814:END */
`;
if(css.includes('DESKTOP-A11Y-REMEDIATION-20260814:START')) css=css.replace(/\/\* DESKTOP-A11Y-REMEDIATION-20260814:START \*\/[\s\S]*?\/\* DESKTOP-A11Y-REMEDIATION-20260814:END \*\/\n?/,'');
css=css.replace(end,patch+end);
fs.writeFileSync(file,css);

/* mega-menu.css was consolidated into the single site.css authority long ago.
   Remove the stale runtime request for the now-nonexistent standalone file;
   mega-menu.js remains the only dynamically loaded navigation asset. */
const configFile='assets/js/site-config.js';
let config=fs.readFileSync(configFile,'utf8');
const stale=/\n\s*if\(!document\.querySelector\('link\[data-banhalmi-mega-menu\]'\)\)\{[\s\S]*?document\.head\.appendChild\(style\);\n\s*\}\n/;
if(stale.test(config)){
  config=config.replace(stale,'\n');
  fs.writeFileSync(configFile,config);
  console.log('Removed stale standalone mega-menu.css runtime request; site.css remains the single CSS authority.');
}else if(config.includes('mega-menu.css')){
  throw new Error('Unexpected mega-menu.css loader shape; refusing unsafe rewrite.');
}
console.log('Applied BANHALMI browser/Lighthouse accessibility remediation.');
