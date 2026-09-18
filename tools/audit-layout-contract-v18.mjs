import fs from 'node:fs';

const failures=[];
const boot=fs.readFileSync('assets/js/fluid-rhythm-boot.js','utf8');
const fluid=fs.readFileSync('assets/css/fluid-4k-rhythm.css','utf8');
const menuHarmony=(fluid.split('MEGA-MENU-HARMONY-V31-20260917')[1]||'').split('TYPOGRAPHY-INTEGRITY-V33-20260917')[0]||'';
const optimizer=fs.readFileSync('tools/optimize-production-artifact.mjs','utf8');
const hardener=fs.readFileSync('tools/harden-production-artifact.mjs','utf8');
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(boot.includes('/assets/css/fluid-4k-rhythm.css?v=20260917-visual-repair-v27'),'visual repair cache token missing');
must(optimizer.includes('/assets/css/fluid-4k-rhythm.css?v=20260917-visual-repair-v27'),'production artifact must parser-discover the same canonical geometry CSS token');
must(optimizer.includes("if (!html.includes('data-fluid-4k-rhythm')) html = html.replace(/<\\/head>/i"),'production artifact must statically inject canonical geometry CSS in head');
must(boot.includes("window.matchMedia('(min-width:1180px)')"),'desktop footer disclosure breakpoint missing');
must(boot.includes('details.open = query.matches;'),'footer disclosure state must track viewport');
must(!boot.includes('style.textContent'),'runtime must not inject layout CSS');
must(!boot.includes('--desktop-hero-min'),'runtime must not own hero geometry');
must(!boot.includes('object-position:center 30%'),'runtime must not own image crop geometry');
must(authority.visualGeometry?.runtimeGeometryOverridesAllowed===false,'canonical authority must prohibit runtime geometry overrides');
must(fluid.includes('LIVE-PIXEL-GEOMETRY-V22'),'canonical live-pixel stylesheet marker missing');
must(fluid.includes('RESPONSIVE-VISUAL-SYSTEM-V26'),'responsive visual system marker missing');
must(fluid.includes('--desktop-hero-min:clamp(740px,42vw,880px)'),'canonical homepage hero base geometry missing');
must(fluid.includes('--desktop-copy:clamp(560px,38vw,680px)'),'canonical homepage copy-panel geometry missing');
must(fluid.includes('HOMEPAGE-HERO-HEIGHT-V28-20260917'),'homepage 15% media-height contract marker missing');
const heroV28=fluid.split('HOMEPAGE-HERO-HEIGHT-V28-20260917')[1]||'';
must(heroV28.includes('--homepage-hero-media-height:39.5604vw'),'tablet homepage hero must be exactly 15% shorter than the 2400x1117 source ratio');
must(heroV28.includes('--homepage-hero-media-height:clamp(629px,35.7vw,748px)'),'desktop homepage hero must be exactly 15% shorter than the established 740/42vw/880 geometry');
must(heroV28.includes('--homepage-hero-media-height:561px'),'short-height desktop homepage hero must be exactly 15% shorter than 660px');
must(!heroV28.includes('>.hero-copy-only'),'V28 must shorten only homepage image/video media, not the following copy panel');
const heroAuthority=authority.visualGeometry?.homepageHeroMedia||{};
must(heroAuthority.reductionFraction===0.15,'design authority must record the 15% homepage hero media reduction');
must(heroAuthority.tabletMinPx===621&&heroAuthority.tabletMaxPx===1179,'design authority tablet hero range mismatch');
must(heroAuthority.desktopMinPx===1180,'design authority desktop hero breakpoint mismatch');
must(heroAuthority.tabletHeightVw===39.5604,'design authority tablet hero height mismatch');
must(heroAuthority.desktopHeight==='clamp(629px,35.7vw,748px)','design authority desktop hero height mismatch');
must(heroAuthority.shortDesktopHeightPx===561,'design authority short-height desktop hero mismatch');
must(heroAuthority.copyPanelGeometryUnchanged===true,'design authority must preserve homepage copy-panel geometry');
for(const rel of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(rel,'utf8');
  must(html.includes('data-homepage-redesign="stage76"'),`${rel}: homepage geometry scope missing`);
  must(html.includes('class="hero-video"'),`${rel}: homepage video layer missing`);
  must(html.includes('hero-signature-2400.avif'),`${rel}: shared homepage hero still missing`);
}
must(!hardener.includes('--homepage-hero-media-height'),'production hardener must not overwrite canonical homepage media geometry');
must(hardener.includes("let fluidCss = fs.readFileSync(fluidCssPath, 'utf8')"),'production hardener must preserve the committed canonical stylesheet before scoped hardening');
must(fluid.includes('font-size:clamp(2.5rem,2.65vw,3.3rem)!important'),'homepage desktop H1 minimum must remain 40px');
must(/\.collage-gallery\{column-count:4!important/.test(fluid),'1440 portrait gallery four-column density contract missing');
must(/@media\s*\(min-width:1600px\)\{html body main \.collage-gallery\{column-count:5!important\}\}/.test(fluid),'wide desktop portrait gallery five-column density contract missing');
must(/@media\s*\(min-width:2200px\)\{html body main \.collage-gallery\{column-count:6!important\}\}/.test(fluid),'2560/4K portrait gallery six-column density contract missing');

const menuAuthority=authority.navigation?.megaMenu||{};
must(menuAuthority.contractVersion==='v31','mega menu authority must be v31');
must(menuAuthority.desktopOverlayBelowHeader===true&&menuAuthority.mobileStartsBelowHeader===true,'mega menu must begin below the real header at every viewport');
must(menuAuthority.duplicateBrandIntroHidden===true&&menuAuthority.duplicateTailHidden===true,'duplicated BANHALMI intro/tail must remain hidden');
must(menuAuthority.desktopDescriptionsHidden===true&&menuAuthority.mobileDescriptionsHidden===true,'mega-menu item descriptions must remain compact/hidden');
must(menuAuthority.visualTile===false&&menuAuthority.sloganTile===false,'mega menu must remain free of hero image and slogan tiles');
must(menuAuthority.decorativeSectionArrows===false,'non-functional section arrows must remain disabled');
must(menuAuthority.mobileTextOnly===true,'mobile mega menu must remain text-first');
must(!boot.includes('mega-menu-harmony-v31.css'),'separate menu harmony stylesheet loader returned');
must(menuHarmony.includes('MEGA-MENU-HARMONY-V31-20260917'),'menu harmony stylesheet authority marker missing');
must(menuHarmony.includes('.bn-mega-grid::after{content:none!important;display:none!important;}'),'menu visual/slogan pseudo-tile suppression missing');
must(menuHarmony.includes('.bn-mega-section-head::after{content:none!important;display:none!important;}'),'non-functional mobile arrows are not explicitly suppressed');
must(menuHarmony.includes('inset:var(--header-h,72px) 0 auto 0!important'),'desktop menu must start below header');
must(menuHarmony.includes('grid-template-columns:minmax(0,1.12fr) minmax(0,.9fr) minmax(0,1.08fr)!important'),'desktop text-first three-column menu geometry missing');
must(menuHarmony.includes('inset:var(--header-h,64px) 0 0 0!important'),'mobile menu must start below header');
must(!menuHarmony.includes('hero-signature-'),'v31 menu must not embed hero media');
must(!menuHarmony.includes('PHOTOGRAPHY FOR CLEAR COMMUNICATION'),'v31 menu must not embed the homepage slogan');
must(!menuHarmony.includes("content:'›'")&&!menuHarmony.includes('content:"›"'),'v31 menu must not render decorative disclosure arrows');
must(!menuHarmony.includes('height:100dvh'),'v31 menu must not reintroduce a full-viewport desktop panel');

must(!fs.existsSync('assets/css/layout-contract-v18.css'),'layout recovery must not introduce a third stylesheet authority');
must(!fs.existsSync('assets/js/layout-contract-v18.js'),'layout recovery must not introduce a second geometry runtime');

if(failures.length){
  console.error(`BANHALMI layout contract v22 failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('BANHALMI layout contract v22 passed: text-first EN/HU/DE mega menu uses no hero/slogan tile or decorative arrows, remains below the real header on desktop/mobile, and preserves homepage/footer geometry authority.');
