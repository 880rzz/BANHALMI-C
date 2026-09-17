import fs from 'node:fs';
import path from 'node:path';

const siteRoot=path.resolve(process.argv[2]||'_site');
const sourceCss=fs.readFileSync('assets/css/site.css','utf8');
const design=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const privateEventScript=path.resolve('assets/js/private-event-quote.js');
const privateEventPricing=path.resolve('private-event-pricing.json');
const targetCss=path.join(siteRoot,'assets/css/site.css');
const targetDesignDir=path.join(siteRoot,'assets/design');
if(!fs.existsSync(targetCss)) throw new Error('BANHALMI production site.css missing.');
if(!fs.existsSync(privateEventScript)||!fs.existsSync(privateEventPricing)) throw new Error('BANHALMI private-event quote sources missing.');

function replaceOne(css,re,replacement,label){
  let count=0;
  const out=css.replace(re,(...args)=>{count++;return typeof replacement==='function'?replacement(...args):replacement;});
  if(count!==1) throw new Error(`BANHALMI design compilation expected exactly one ${label}, found ${count}.`);
  return out;
}

function compileDesign(css){
  const d=design.typography.desktop,t=design.typography.tablet,l=design.layout,flow=l.documentFlow||{};
  const touch=Number(design.responsive?.touchTargetPx||44);
  const nav=design.navigation||{},mega=nav.megaMenu||{},footer=l.footer||{};
  const start='/* CANONICAL-DESIGN-SYSTEM-20260827:START',end='/* CANONICAL-DESIGN-SYSTEM-20260827:END */';
  const a=css.indexOf(start),b=css.indexOf(end);
  if(a<0||b<=a) throw new Error('BANHALMI final canonical CSS block missing.');
  const before=css.slice(0,a),block=css.slice(a,b),after=css.slice(b);
  let c=block;
  c=replaceOne(c,/--apple-page-max:\s*1200px;/,`--apple-page-max:${design.pageMaxPx}px;\n  --apple-structured-max:${design.structuredMaxPx}px;`,'page max token');
  c=replaceOne(c,/--apple-reading-max:\s*760px;/,`--apple-reading-max:${design.readingMaxPx}px;`,'reading max token');
  c=replaceOne(c,/--apple-wide-reading-max:\s*900px;/,`--apple-wide-reading-max:${design.wideReadingMaxPx}px;`,'wide reading max token');
  c=replaceOne(c,/html body main h1\{font-size:[^;]+;/,`html body main h1{font-size:${d.h1}!important;`,'desktop H1 scale');
  c=replaceOne(c,/html body main h2\{font-size:[^;]+;/,`html body main h2{font-size:${d.h2}!important;`,'desktop H2 scale');
  c=replaceOne(c,/html body main h3\{font-size:[^;]+;/,`html body main h3{font-size:${d.h3}!important;`,'desktop H3 scale');
  c=replaceOne(c,/@media\(max-width:768px\)\{\s*html body main h1\{font-size:[^;]+;/,`@media(max-width:768px){\n  html body main h1{font-size:${t.h1}!important;`,'tablet H1 scale');
  c=replaceOne(c,/html body main h2\{font-size:clamp\(1\.55rem,3\.2vw,2rem\)!important;/,`html body main h2{font-size:${t.h2}!important;`,'tablet H2 scale');
  c=replaceOne(c,/html body main \.service-process-grid\{margin-bottom:var\(--apple-section-space\)!important;\}/,`html body main .service-process-grid{margin-bottom:${l.serviceProcessBottomMarginPx}px!important;}`,'service-process bottom rhythm');

  const anchor='@media(max-width:1460px){';
  const componentRules=`\n/* Root-cause geometry: one optical axis, distinct reading/standard/structured canvases, one card rhythm. */\nhtml body main h3 + :is(p,.lead,.description,.desc){margin-top:${design.typography.h3DescriptionGapPx}px!important;}\nhtml body main :is(.section-head,.section-intro,.service-intro,.content-intro){margin-left:0!important;margin-right:auto!important;text-align:left!important;}\nhtml body main :is(.section-head,.section-intro,.service-intro,.content-intro)>:is(.eyebrow,.label,.kicker,h1,h2,h3,p,.lead,a,.btn-link){margin-left:0!important;margin-right:auto!important;text-align:left!important;}\n@media(min-width:1440px){html body main .wrap:has(> :is(.service-process-grid,.partner-grid,.partner-grid-memberships,.archive-cards,.two-reading-grid,.smart-quote-layout)){width:min(calc(100% - 2 * var(--apple-gutter)),var(--apple-structured-max))!important;max-width:var(--apple-structured-max)!important;}html body main :is(.service-process-grid,.partner-grid,.partner-grid-memberships,.archive-cards,.two-reading-grid,.smart-quote-layout){width:100%!important;max-width:var(--apple-structured-max)!important;margin-left:auto!important;margin-right:auto!important;}}\n@media(max-width:1439px){html body main :is(.service-process-grid,.partner-grid,.partner-grid-memberships,.archive-cards,.two-reading-grid,.smart-quote-layout){width:100%!important;max-width:var(--apple-page-max)!important;margin-left:auto!important;margin-right:auto!important;}}\nhtml body main :is(.service-process-grid,.partner-grid,.partner-grid-memberships,.archive-cards,.two-reading-grid){gap:${l.cardGapPx}px!important;}\nhtml body .smart-quote-layout .category-card{display:grid!important;grid-template-columns:${l.quoteControlColumnPx}px minmax(0,1fr)!important;column-gap:${l.quoteControlGapPx}px!important;align-items:center!important;}\nhtml body .smart-quote-layout .category-card>input[type="radio"]{grid-column:1!important;inline-size:${l.quoteControlColumnPx}px!important;block-size:${l.quoteControlColumnPx}px!important;min-width:${l.quoteControlColumnPx}px!important;min-height:${l.quoteControlColumnPx}px!important;margin:0!important;}\nhtml body .smart-quote-layout .category-card>span{grid-column:2!important;display:grid!important;grid-template-columns:minmax(0,1fr) ${l.quoteInfoColumnPx}px!important;column-gap:12px!important;align-items:center!important;min-width:0!important;}\nhtml body .smart-quote-layout .category-card .info-tip{position:static!important;grid-column:2!important;justify-self:end!important;margin:0!important;}\n@media(max-width:620px){html body main .partner-grid-memberships>:last-child:nth-child(odd){grid-column:1/-1!important;width:calc((100% - .7rem)/2)!important;justify-self:center!important;}}\nhtml body .site-header a{min-height:${touch}px!important;display:inline-flex!important;align-items:center!important;}\nhtml body .site-header :is(.lang-switch a,.nav-links a){min-height:${touch}px!important;}\n${nav.activeState==='text-only'?`html body .site-header :is(a.active,a[aria-current="page"],.active>a){background:transparent!important;border:0!important;box-shadow:none!important;border-radius:${Number(nav.activeRadiusPx||0)}px!important;}`:''}\n`;
  if(!c.includes(anchor)) throw new Error('BANHALMI canonical responsive anchor missing.');
  c=c.replace(anchor,componentRules+anchor);

  const footerRules=`\nhtml body .site-footer{padding:${Number(footer.paddingTopPx||42)}px 0 ${Number(footer.paddingBottomPx||26)}px!important;}\nhtml body .site-footer .footer-grid{gap:${Number(footer.desktopGapPx||22)}px!important;}\nhtml body .site-footer .footer-accordion>summary{min-height:${Number(footer.summaryMinHeightPx||44)}px!important;padding-block:10px!important;}\nhtml body .site-footer .footer-accordion li{margin-bottom:${Number(footer.linkRowGapPx||10)}px!important;}\n/* Legal identifiers must shrink inside the canonical footer track instead of widening the document. */\nhtml body .site-footer .footer-legal-list{min-width:0!important;max-width:100%!important;}\nhtml body .site-footer .footer-legal-list li{grid-template-columns:minmax(0,58px) minmax(0,1fr)!important;min-width:0!important;}\nhtml body .site-footer .footer-legal-list li>*{min-width:0!important;}\nhtml body .site-footer .footer-legal-list li>strong{white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important;}\n@media(min-width:${Number(footer.desktopMinPx||1180)}px){html body .site-footer .footer-grid{grid-template-columns:minmax(220px,2fr) repeat(${Math.max(1,Number(footer.desktopColumns||6)-1)},minmax(0,1fr))!important;gap:${Number(footer.desktopGapPx||22)}px!important;}}\n@media(min-width:${Number(footer.compactDesktopMinPx||1024)}px) and (max-width:${Number(footer.desktopMinPx||1180)-1}px){html body .site-footer .footer-grid{grid-template-columns:repeat(${Number(footer.compactDesktopColumns||4)},minmax(0,1fr))!important;gap:${Number(footer.desktopGapPx||22)}px!important;}html body .site-footer .footer-brand-col{grid-column:span 2!important;}}\n@media(min-width:${Number(footer.tabletMinPx||621)}px) and (max-width:${Number(footer.compactDesktopMinPx||1024)-1}px){html body .site-footer .footer-grid{grid-template-columns:repeat(${Number(footer.tabletColumns||3)},minmax(0,1fr))!important;gap:${Number(footer.tabletGapPx||18)}px!important;}html body .site-footer .footer-brand-col{grid-column:1/-1!important;max-width:none!important;}}\n@media(max-width:${Number(footer.tabletMinPx||621)-1}px){html body .site-footer .footer-grid{grid-template-columns:repeat(${Number(footer.mobileColumns||1)},minmax(0,1fr))!important;gap:0!important;}html body .site-footer .footer-brand-col{grid-column:1/-1!important;}}\n`;

  const megaRules=`\n/* Canonical fullscreen menu: screenshot-approved dark editorial layout. */\nhtml body .bn-mega-menu{background:${mega.background||'#202530'}!important;}\nhtml body .bn-mega-panel{width:min(${Number(mega.panelMaxPx||1440)}px,100%)!important;max-width:${Number(mega.panelMaxPx||1440)}px!important;}\nhtml body .bn-mega-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:${Number(mega.desktopColumnGapPx||72)}px!important;}\nhtml body .bn-mega-section-head{border-bottom:1px solid ${mega.sectionRuleColor||'rgba(183,156,68,.34)'}!important;}\nhtml body .bn-mega-link,html body .bn-mega-link:hover,html body .bn-mega-link:focus-visible,html body .bn-mega-link.active,html body .bn-mega-link[aria-current="page"]{border:0!important;border-radius:0!important;box-shadow:none!important;outline:0!important;background:transparent!important;transform:none!important;}\nhtml body .bn-mega-link:focus-visible,html body .bn-mega-link.active,html body .bn-mega-link[aria-current="page"]{text-decoration-line:underline!important;text-decoration-thickness:1px!important;text-underline-offset:.22em!important;text-decoration-color:currentColor!important;}\nhtml body .bn-mega-pricing .bn-mega-link{color:var(--bn-menu-gold)!important;}\n@media(min-width:861px){html body .bn-mega-panel{padding:${Number(mega.desktopTopPaddingPx||86)}px ${Number(mega.desktopSidePaddingPx||88)}px ${Number(mega.desktopBottomPaddingPx||34)}px!important;}}\n@media(max-width:860px){html body .bn-mega-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:2.15rem!important;}}\n@media(max-width:620px){html body .bn-mega-grid{grid-template-columns:1fr!important;gap:2rem!important;}}\n`;
  c=`${c.trim()}\n${footerRules}\n${megaRules}`;

  let compiled=before+c+after;
  compiled=replaceOne(compiled,/html\{min-height:100%;background:#202530!important\}/,`html{min-height:100%;background:${flow.documentBackground||'#ffffff'}!important}`,'document background floor');
  compiled=replaceOne(compiled,/body\{min-height:100vh;min-height:100dvh;display:flex;flex-direction:column\}/,`body{min-height:100vh;min-height:100dvh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:var(--bg,#fff)}`,'document layout mode');
  compiled=replaceOne(compiled,/body>main,#main\{flex:1 0 auto;width:100%;min-width:0\}/,'body>main,#main{width:100%;min-width:0;min-height:0}','main normal-flow contract');
  compiled=replaceOne(compiled,/body>\.site-footer,\.site-footer\{flex:0 0 auto;width:100%\}/,'body>.site-footer,.site-footer{width:100%;min-height:0}','footer normal-flow contract');
  return compiled;
}

const compiledCss=compileDesign(sourceCss);
fs.writeFileSync(targetCss,compiledCss,'utf8');
if(fs.existsSync(targetDesignDir)) fs.rmSync(targetDesignDir,{recursive:true,force:true});

const quotePages=new Set(['requestaquote/index.html','hu/ajanlatkeres/index.html','de-at/anfrage/index.html']);
const privateScriptTag='<script defer src="/assets/js/private-event-quote.js"></script>';
let checked=0,normalized=0,privateInjected=0;
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const full=path.join(dir,e.name);if(e.isDirectory())walk(full);else if(e.isFile()&&e.name.endsWith('.html')){checked++;let html=fs.readFileSync(full,'utf8');const before=html;html=html.replace(/<link rel="preload" as="style" href="(\/assets\/css\/site\.css[^\"]*)"\s*\/><link rel="stylesheet" href="\1" media="print" onload="this\.media='all';this\.onload=null"\s*\/><noscript><link rel="stylesheet" href="\1"\s*\/><\/noscript>/g,'<link rel="stylesheet" href="$1"/>');const rel=path.relative(siteRoot,full).split(path.sep).join('/');if(quotePages.has(rel)&&!html.includes('/assets/js/private-event-quote.js')){html=html.replace(/<\/body>/i,`${privateScriptTag}</body>`);privateInjected++;}if(html!==before){fs.writeFileSync(full,html,'utf8');normalized++;}}}}
walk(siteRoot);

const quotePdfPath=path.join(siteRoot,'assets/js/quote-pdf.js');
let pdfPatched=0;
if(fs.existsSync(quotePdfPath)){
  let pdf=fs.readFileSync(quotePdfPath,'utf8');
  const needle="add(projectRows,l.service,categoryLabel(cat,lang));";
  const replacement="add(projectRows,l.service,form.getAttribute('data-private-event-active')==='true'?({en:'Private celebrations & family milestones',de:'Private Feiern & Familienjubiläen',hu:'Családi események és mérföldkő-ünnepek'})[lang]:categoryLabel(cat,lang));";
  if(pdf.includes(needle)){pdf=pdf.replace(needle,replacement);fs.writeFileSync(quotePdfPath,pdf,'utf8');pdfPatched=1;}
  else if(!pdf.includes('Private celebrations & family milestones')) throw new Error('BANHALMI private-event PDF label patch target missing.');
}
if(!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:START')||!sourceCss.includes('APPLE-RESPONSIVE-CONTRACT-V1:END')) throw new Error('Approved BANHALMI Apple CSS authority markers missing.');
const finalCss=fs.readFileSync(targetCss,'utf8');
const desktop=design.typography.desktop,tablet=design.typography.tablet;
for(const required of [
  `--apple-page-max:${design.pageMaxPx}px`,
  `--apple-structured-max:${design.structuredMaxPx}px`,desktop.h1,desktop.h2,tablet.h1,tablet.h2,
  `margin-top:${design.typography.h3DescriptionGapPx}px`,
  `margin-bottom:${design.layout.serviceProcessBottomMarginPx}px!important`,
  `gap:${design.layout.cardGapPx}px!important`,
  'max-width:var(--apple-structured-max)!important',
  `html body .site-header a{min-height:${Number(design.responsive?.touchTargetPx||44)}px!important`,
  'background:transparent!important;border:0!important;box-shadow:none!important;border-radius:0px!important;',
  `html body .site-footer{padding:${Number(design.layout.footer?.paddingTopPx||42)}px 0 ${Number(design.layout.footer?.paddingBottomPx||26)}px!important;}`,
  'html body .site-footer .footer-legal-list{min-width:0!important;max-width:100%!important;}',
  `html body .bn-mega-panel{width:min(${Number(design.navigation?.megaMenu?.panelMaxPx||1440)}px,100%)!important`,
  'html body .bn-mega-link:focus-visible,html body .bn-mega-link.active,html body .bn-mega-link[aria-current="page"]{text-decoration-line:underline!important',
  `html{min-height:100%;background:${design.layout.documentFlow.documentBackground}!important}`,
  'body{min-height:100vh;min-height:100dvh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;background:var(--bg,#fff)}',
  'body>main,#main{width:100%;min-width:0;min-height:0}',
  'body>.site-footer,.site-footer{width:100%;min-height:0}'
]) if(!finalCss.includes(required)) throw new Error(`BANHALMI compiled design token missing: ${required}`);
for(const rel of quotePages){const full=path.join(siteRoot,rel);if(!fs.existsSync(full)||!fs.readFileSync(full,'utf8').includes('/assets/js/private-event-quote.js')) throw new Error(`BANHALMI private-event quote adapter missing from ${rel}.`);}
console.log(`BANHALMI production design compiled from ${design.version}; ${checked} HTML files checked, ${normalized} artifact HTML file(s) normalized, ${privateInjected} private-event quote adapter injection(s), ${pdfPatched} PDF label patch(es). Standard/structured canvases, ${Number(design.responsive?.touchTargetPx||44)}px header controls, screenshot-approved fullscreen mega-menu, compact responsive footer and normal document flow are active.`);
