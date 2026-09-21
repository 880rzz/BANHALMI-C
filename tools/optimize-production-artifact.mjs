import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '_site');
const htmlFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ['node_modules', '.git', '_site', 'artifacts'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}

walk(root);

const stylesheetRe = /<link rel="stylesheet" href="(\/assets\/css\/site\.css[^\"]*)"\s*\/>/g;
const mainScriptRe = /<script defer="" src="\/assets\/js\/main\.js\?v=20260808-mobile100-v2"><\/script>/g;
const quoteMainScriptRe = /<script[^>]*\bsrc="(\/assets\/js\/main\.js\?v=[^\"]+)"[^>]*><\/script>/g;
const megaMenuScriptRe = /<script data-banhalmi-mega-menu="" defer="" src="\/assets\/js\/mega-menu\.js\?v=[^\"]+"><\/script>/g;
const quotePdfScriptRe = /<script([^>]*?)src="(\/assets\/js\/quote-pdf\.js[^\"]*)"([^>]*)><\/script>/g;

const synchronousStyle = '<link rel="stylesheet" href="$1"/>';
const deferredSiteStyleRe = /<link rel="preload" as="style" href="(\/assets\/css\/site\.css[^"]*)"\/><link rel="stylesheet" href="\1" media="print" onload="this\.media='all';this\.onload=null"\/><noscript><link rel="stylesheet" href="\1"\/><\/noscript>/g;
const fluidRhythmHref = '/assets/css/fluid-4k-rhythm.css?v=20260921-render-stability-v28';
const fluidRhythmStyle = `<link rel="stylesheet" href="${fluidRhythmHref}" data-fluid-4k-rhythm=""/>`;
const fluidRhythmLinkRe = /<link\s+rel="stylesheet"\s+href="\/assets\/css\/fluid-4k-rhythm\.css[^\"]*"\s+data-fluid-4k-rhythm=""\s*\/>/g;

const executivePositioningCopy = {
  'lifestyle/index.html': {
    heading: 'Different roles need different visual authority.',
    body: 'There is no universal executive image. A founder, a senior banking leader, an established adviser and a specialist entering a leadership role communicate different things. We shape brand photography and visual positioning around the person, generational communication context, level of responsibility, professional field, audience and usage channels — never around a generic business-portrait template.'
  },
  'hu/brand/index.html': {
    heading: 'Más szerephez más vizuális tekintély tartozik.',
    body: 'Nincs univerzális vezetői kép. Egy alapító, egy tapasztalt banki vezető, egy senior tanácsadó vagy egy új vezetői szerepbe érkező szakember más üzenetet közvetít. A brandfotózást és a vizuális pozicionálást a személyhez, a generációs kommunikációs kontextushoz, a felelősségi szinthez, a szakterülethez, a célközönséghez és a felhasználási csatornákhoz igazítjuk — nem egy általános üzleti portrésablonhoz.'
  },
  'de-at/brand/index.html': {
    heading: 'Unterschiedliche Rollen brauchen unterschiedliche visuelle Autorität.',
    body: 'Es gibt kein universelles Führungsbild. Eine Gründerin oder ein Gründer, eine erfahrene Führungskraft im Banking, ein etablierter Berater oder eine Fachkraft in einer neuen Führungsrolle müssen unterschiedliche Botschaften vermitteln. Wir stimmen Brandfotografie und visuelle Positionierung auf die Person, den generationellen Kommunikationskontext, die Verantwortungsebene, das Fachgebiet, die Zielgruppen und die Nutzungskanäle ab — nicht auf eine allgemeine Business-Porträt-Schablone.'
  }
};

function renderExecutivePositioningCopy(rel, html) {
  const copy = executivePositioningCopy[rel];
  if (!copy) return html;
  if (html.includes('data-executive-positioning-copy="v1"')) return html;
  const section = `<section class="section-band executive-positioning-section" data-surface="white" data-executive-positioning-copy="v1"><div class="wrap"><div class="section-head reveal"><span class="eyebrow">BANHALMI</span><h2>${copy.heading}</h2><p>${copy.body}</p></div></div></section>`;
  const out = html.replace(/<\/main>/i, `${section}</main>`);
  if (out === html) throw new Error(`Executive positioning copy could not be rendered in ${rel}`);
  return out;
}

const homeMegaMenuLoader = `<script data-banhalmi-mega-menu="" defer src="/assets/js/mega-menu.js?v=20260921-single-stage-v1"></script>`;

const homeRuntimeLoader = `<script>(function(){var compactCss=document.createElement('style');compactCss.setAttribute('data-footer-compact-authority','');compactCss.textContent='@media (max-width:1179px){html body .site-footer details.footer-accordion>ul{display:none!important;block-size:0!important;min-block-size:0!important;max-block-size:0!important;overflow:hidden!important;margin:0!important;padding:0!important;visibility:hidden!important}html body .site-footer details.footer-accordion>summary,html body .site-header .nav-submenu>summary,html body details.review-drawer>summary{min-block-size:44px!important;line-height:1.25!important}}';document.head.appendChild(compactCss);var groups=Array.prototype.slice.call(document.querySelectorAll('details.footer-accordion'));var query=matchMedia('(min-width:1180px)');function sync(){groups.forEach(function(details){var compact=!query.matches;details.open=!compact;var list=details.querySelector('ul');if(list){list.hidden=compact;list.style.setProperty('display',compact?'none':'block','important');}});}sync();if(query.addEventListener)query.addEventListener('change',sync);else if(query.addListener)query.addListener(sync);var loaded=false,timer=null;function load(){if(loaded)return;loaded=true;if(timer)clearTimeout(timer);var s=document.createElement('script');s.src='/assets/js/main.js?v=20260808-mobile100-v2';s.defer=true;document.head.appendChild(s);}['pointerdown','keydown','touchstart'].forEach(function(type){addEventListener(type,load,{once:true,passive:true,capture:true});});timer=setTimeout(load,3000);})();</script>`;

function quoteRuntimeLoader(src) {
  const runtimeControls = '.menu-btn,[data-cookie-settings],.info-tip[data-tooltip]';
  return `<script>(function(){var loading=false,ready=false,pending=null,timer=null;var controls='${runtimeControls}';function replay(){if(!ready||!pending)return;var el=pending;pending=null;setTimeout(function(){el.click();},0);}function load(replayTarget){if(replayTarget)pending=replayTarget;if(ready){replay();return;}if(loading)return;loading=true;if(timer)clearTimeout(timer);var s=document.createElement('script');s.src='${src}';s.defer=true;s.onload=function(){loading=false;ready=true;replay();};s.onerror=function(){loading=false;pending=null;};document.head.appendChild(s);}document.addEventListener('pointerover',function(ev){if(ev.target.closest&&ev.target.closest(controls))load(null);},{passive:true,capture:true});document.addEventListener('focusin',function(ev){if(ev.target.closest&&ev.target.closest(controls))load(null);},true);document.addEventListener('click',function(ev){var el=ev.target.closest&&ev.target.closest(controls);if(!el||ready)return;ev.preventDefault();ev.stopImmediatePropagation();load(el);},true);['pointerdown','keydown','touchstart'].forEach(function(type){addEventListener(type,function(){load(null);},{once:true,passive:true,capture:true});});timer=setTimeout(function(){load(null);},5000);})();</script>`;
}

function quotePdfLoader(src) {
  return `<script>(function(){var loading=false,ready=false,pending=null;function load(){if(ready||loading)return;loading=true;var s=document.createElement('script');s.src='${src}';s.onload=function(){ready=true;loading=false;if(pending){var el=pending;pending=null;setTimeout(function(){el.click();},0);}};s.onerror=function(){loading=false;pending=null;};document.head.appendChild(s);}document.addEventListener('click',function(ev){var el=ev.target.closest&&ev.target.closest('[data-download-quote-pdf]');if(!el||ready)return;ev.preventDefault();ev.stopImmediatePropagation();pending=el;load();},true);document.addEventListener('pointerover',function(ev){if(ev.target.closest&&ev.target.closest('[data-download-quote-pdf]'))load();},{passive:true,capture:true});document.addEventListener('focusin',function(ev){if(ev.target.closest&&ev.target.closest('[data-download-quote-pdf]'))load();},true);})();</script>`;
}

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const isHome = rel === 'index.html' || rel === 'hu/index.html' || rel === 'de-at/index.html';
  const isQuote = rel === 'requestaquote/index.html' || rel === 'hu/ajanlatkeres/index.html' || rel === 'de-at/anfrage/index.html';

  html = renderExecutivePositioningCopy(rel, html);

  /* Layout CSS is intentionally render-blocking. Deferring the canonical
     stylesheet painted service pages without their base geometry and then
     reflowed the entire document when media changed from print to all. */
  html = html.replace(deferredSiteStyleRe, synchronousStyle);
  if (/href="\/assets\/css\/site\.css[^"]*"[^>]*media="print"/.test(html)) {
    throw new Error(`Deferred canonical stylesheet remained in ${rel}`);
  }

  /* The geometry stylesheet must be parser-discovered in <head> on every production page.
     Loading it from runtime JS caused deterministic CLS on service pages such as /portrait/. */
  /* The artifact is the deployment authority. Normalize an existing geometry
     link as well as injecting a missing one, otherwise an old cache token can
     make a browser render an earlier design after a successful deployment. */
  html = html.replace(fluidRhythmLinkRe, fluidRhythmStyle);
  if (!html.includes('data-fluid-4k-rhythm')) html = html.replace(/<\/head>/i, `${fluidRhythmStyle}</head>`);
  if (!html.includes('data-fluid-4k-rhythm')) throw new Error(`Fluid rhythm stylesheet missing in ${rel}`);

  if (isHome) {
    html = html.replace(megaMenuScriptRe, homeMegaMenuLoader);
    html = html.replace(mainScriptRe, homeRuntimeLoader);
    if (/data-banhalmi-mega-menu="" defer=""/.test(html)) throw new Error(`Homepage mega-menu runtime remained eager in ${rel}`);
  }

  if (isQuote) {
    html = html.replace(/class="prose reveal quote-intro(?: in)?"/g, 'class="prose quote-intro"');
    html = html.replace(/data-pricing-status="">/g, 'data-pricing-status="" hidden>');
    if (!/data-pricing-status=""\s+hidden>/.test(html)) throw new Error(`Quote pricing status was not stabilized in ${rel}`);
    html = html.replace(/class="info-tip"(?![^>]*\baria-haspopup=)/g, 'class="info-tip" aria-haspopup="dialog"');
    if (!/class="info-tip" aria-haspopup="dialog"/.test(html)) throw new Error(`Quote info-tip dialog semantics missing in ${rel}`);
    html = html.replace(quoteMainScriptRe, function(_match, src){ return quoteRuntimeLoader(src); });
    html = html.replace(quotePdfScriptRe, function(_match, _before, src){ return quotePdfLoader(src); });
    if (/<script[^>]*\bsrc="\/assets\/js\/main\.js\?v=[^\"]+"[^>]*><\/script>/.test(html)) throw new Error(`Quote general runtime remained eager in ${rel}`);
  }

  if (rel === 'de-at/anfrage/index.html') {
    html = html.replace(/>Start<\/a>/g, '>BANHALMI Startseite</a>');
    html = html.replace(/aria-label="Studio Wien" class="map-card-link"/g, 'aria-label="Maps – Studio Wien" class="map-card-link"');
    html = html.replace(/aria-label="Studio Budapest" class="map-card-link"/g, 'aria-label="Maps – Studio Budapest" class="map-card-link"');
  }

  fs.writeFileSync(file, html);
}

for (const [rel, copy] of Object.entries(executivePositioningCopy)) {
  const target = path.join(root, rel);
  if (!fs.existsSync(target)) throw new Error(`Executive positioning production guard: missing ${rel}`);
  const body = fs.readFileSync(target, 'utf8');
  for (const token of ['data-executive-positioning-copy="v1"', copy.heading, copy.body]) {
    if (!body.includes(token)) throw new Error(`Executive positioning production guard: ${rel} lost localized visible copy.`);
  }
}

const quoteCalculatorPath = path.join(root, 'assets/js/quote-calculator.js');
if (fs.existsSync(quoteCalculatorPath)) {
  let quoteJs = fs.readFileSync(quoteCalculatorPath, 'utf8');
  const loadPricingStart = "function loadPricing(){\n    setPricingUi(false,'');\n    var embedded=window.BANHALMI_PRICING_DATA;";
  const optimizedLoadPricingStart = "function loadPricing(){\n    var embedded=window.BANHALMI_PRICING_DATA;";
  if (quoteJs.includes(loadPricingStart)) quoteJs = quoteJs.replace(loadPricingStart, optimizedLoadPricingStart);
  else if (!quoteJs.includes(optimizedLoadPricingStart)) throw new Error('Quote optimizer could not find pricing initialization contract.');
  const protocolMarker = "    var protocol=String(window.location&&window.location.protocol||'');";
  if (quoteJs.includes(protocolMarker) && !quoteJs.includes("if(pricingReady)return Promise.resolve(true);\n    setPricingUi(false,'');")) {
    quoteJs = quoteJs.replace(protocolMarker, "    if(pricingReady)return Promise.resolve(true);\n    setPricingUi(false,'');\n" + protocolMarker);
  }
  const oldInit = "function init(f){applyRequestedServiceContext(f);setDateMins(f);updatePanels(f);f.addEventListener('change',function(event){if(event&&event.target&&event.target.name==='category')syncServiceContextFromCategory(f,true);updatePanels(f);paint(f);});f.addEventListener('input',function(){paint(f);});paint(f);}";
  const newInit = "function init(f){applyRequestedServiceContext(f);setDateMins(f);f.addEventListener('change',function(event){if(event&&event.target&&event.target.name==='category')syncServiceContextFromCategory(f,true);paint(f);});f.addEventListener('input',function(){paint(f);});}";
  if (quoteJs.includes(oldInit)) quoteJs = quoteJs.replace(oldInit, newInit);
  else if (!quoteJs.includes(newInit)) throw new Error('Quote optimizer could not find quote form initialization contract.');
  fs.writeFileSync(quoteCalculatorPath, quoteJs);
}

const semanticContracts = [
  ['index.html',['Executive Portraiture &amp; Headshots','brand photography','C-level','artists','actors','visual presence']],
  ['hu/index.html',['Executive portré &amp; headshot','brandfotózás','C-level','művészek','színészek','vizuális jelenlét']],
  ['de-at/index.html',['Executive-Porträts &amp; Headshots','Brandfotografie','C-Level','Künstler','Schauspieler','visuelle Präsenz']],
  ['llms.txt',['Executive Portrait','Professional Headshot','Brand Photography','C-Level Event Photography','artists','actors','visual presence']],
  ['ai.txt',['Executive Portrait','Headshot','Brand Photography','C-Level Event Photography','artists','actors','visual presence']],
  ['ai-entry.json',['executives and C-level leaders','artists','actors','headshot','brand photography','C-level event photography']],
  ['services.json',['Professional headshot','artists','actors','Brand Photography','C-Level Event Photography']]
];
for (const [rel,tokens] of semanticContracts){
  const target=path.join(root,rel);
  if(!fs.existsSync(target)) throw new Error(`Audience positioning production guard: missing ${rel}`);
  const body=fs.readFileSync(target,'utf8');
  for(const token of tokens) if(!body.includes(token)) throw new Error(`Audience positioning production guard: ${rel} lost required semantic token: ${token}`);
}

console.log(`Production artifact optimization applied to ${htmlFiles.length} HTML files.`);
