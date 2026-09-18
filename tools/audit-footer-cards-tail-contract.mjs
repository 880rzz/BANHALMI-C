import fs from 'node:fs';

const failures=[];
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const fluid=fs.readFileSync('assets/css/fluid-4k-rhythm.css','utf8');
const boot=fs.readFileSync('assets/js/fluid-rhythm-boot.js','utf8');
const hardener=fs.readFileSync('tools/harden-production-artifact.mjs','utf8');
const footer=authority.layout?.footer||{};
const flow=authority.layout?.documentFlow||{};
const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(Number(footer.desktopColumns)===12,'wide desktop footer must use the approved 12-track grid');
must(Number(footer.desktopContentRows)===2,'desktop footer content must remain exactly two rows');
must(Number(footer.desktopContactColumns)===2,'desktop contact area must keep Vienna and Budapest as two separate studio columns');
must(Array.isArray(footer.desktopTopRowGroups)&&footer.desktopTopRowGroups.join('|')==='brand|services|archive|profile','desktop footer first-row group order changed');
must(Array.isArray(footer.desktopBottomRowGroups)&&footer.desktopBottomRowGroups.join('|')==='contact|social|memberships|legal','desktop footer second-row group order changed');
must(footer.desktopNoMidWordBreaks===true,'desktop footer must prohibit ordinary mid-word breaking');
must(Number(footer.desktopMinPx)===1180,'desktop footer breakpoint changed');
must(Number(footer.wideDesktopMinPx)===1440,'wide-desktop footer breakpoint must remain 1440px');
must(Number(footer.desktopMaxContentPx)===1440,'desktop footer content width changed');
must(Number(footer.paddingTopPx)===30&&Number(footer.paddingBottomPx)===18,'wide desktop footer root padding changed');
must(Number(footer.desktopRowGapMinPx)===36&&Number(footer.desktopRowGapMaxPx)===48,'wide desktop footer row gap changed');
must(Number(footer.desktopFooterBottomMarginPx)===24&&Number(footer.desktopFooterBottomPaddingPx)===12,'footer-bottom compact rhythm changed');
must(Number(footer.desktopContactActionsMarginPx)===16&&Number(footer.desktopContactActionsPaddingPx)===10,'desktop contact action rhythm changed');
must(Number(footer.smallDesktopMinPx)===1180&&Number(footer.smallDesktopMaxPx)===1439,'small-desktop footer range changed');
must(Number(footer.smallDesktopColumns)===8,'small-desktop footer must use the approved 8-track grid');
must(Number(footer.smallDesktopContentRows)===2,'small-desktop footer must remain two rows');
must(footer.smallDesktopOverflowGuard===true,'small-desktop overflow guard must stay enabled');
must(Number(footer.smallDesktopPaddingTopPx)===14&&Number(footer.smallDesktopPaddingBottomPx)===10,'small-desktop root padding changed');
must(Number(footer.smallDesktopRowGapPx)===22,'small-desktop footer row gap changed');
must(Number(footer.smallDesktopFooterBottomMarginPx)===12&&Number(footer.smallDesktopFooterBottomPaddingPx)===8,'small-desktop footer-bottom rhythm changed');
must(flow.documentBackground==='#202530','document floor must match dark footer');
must(Number(flow.footerAfterDocumentGapMaxPx)===2,'footer-after-document overhang tolerance changed');
must(Number(flow.footerMaxViewportFractionOnTabletDesktop)<=0.82,'desktop footer viewport fraction became too permissive');
must(Number(flow.footerAbsoluteMaxPx)<=760,'desktop footer absolute maximum became too permissive');

must(fluid.includes('FOOTER-TWO-ROW-V29-20260917'),'two-row footer v29 wide-desktop canonical marker missing');
const v29=fluid.split('FOOTER-TWO-ROW-V29-20260917')[1]||'';
must(/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)!important/.test(v29),'v29 wide-desktop footer 12-track grid missing');
must(/grid-template-rows:auto auto!important/.test(v29),'v29 desktop footer must have exactly two content rows');
must(v29.includes('padding:clamp(30px,2.6vw,42px) 0 18px!important'),'v29 wide-desktop root padding drifted');
must(v29.includes('row-gap:clamp(36px,3vw,48px)!important'),'v29 wide-desktop row gap drifted');
must(v29.includes('nth-of-type(1){grid-column:4 / span 2!important;grid-row:1!important;}'),'services placement changed');
must(v29.includes('nth-of-type(2){grid-column:6 / span 2!important;grid-row:1!important;}'),'archive placement changed');
must(v29.includes('nth-of-type(3){grid-column:8 / span 3!important;grid-row:1!important;}'),'profile placement changed');
must(v29.includes('nth-of-type(4){grid-column:6 / span 2!important;grid-row:2!important;}'),'social placement changed');
must(v29.includes('nth-of-type(5){grid-column:8 / span 3!important;grid-row:2!important;}'),'memberships placement changed');
must(v29.includes('grid-column:1 / span 5!important')&&v29.includes('grid-column:11 / span 2!important'),'contact/legal second-row placement changed');
must(v29.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),'desktop contact studio split missing');

must(fluid.includes('FOOTER-SINGLE-AUTHORITY-20260918'),'single footer authority marker missing from canonical fluid stylesheet');
const footerV32=fluid.split('FOOTER-SINGLE-AUTHORITY-20260918')[1]||'';
must(footerV32.includes('FOOTER-GEOMETRY-V32-20260917'),'footer v32 geometry marker missing from canonical fluid stylesheet');
must(footerV32.includes('@media (min-width:1180px) and (max-width:1439px)'),'small-desktop footer media range missing');
must(footerV32.includes('grid-template-columns:repeat(8,minmax(0,1fr))!important'),'small-desktop 8-track geometry missing');
must(footerV32.includes('grid-template-rows:auto auto!important'),'small-desktop two-row geometry missing');
must(footerV32.includes('padding:14px 0 10px!important'),'small-desktop canonical padding drifted');
must(footerV32.includes('row-gap:22px!important'),'small-desktop canonical row gap drifted');
must(footerV32.includes('grid-column:1 / span 3!important')&&footerV32.includes('grid-column:7 / span 2!important'),'small-desktop contact/legal placement missing');
must(footerV32.includes('inline-size:min(100%,calc(100vw - 64px))!important'),'small-desktop footer safe viewport width missing');
must(footerV32.includes('overflow-x:clip!important'),'small-desktop footer overflow containment missing');
must(footerV32.includes('min-inline-size:0!important'),'small-desktop intrinsic-width reset missing');
must(footerV32.includes('overflow-wrap:anywhere!important'),'unbreakable legal/contact token fallback missing');
must(!boot.includes('footer-geometry-v32.css'),'duplicate footer stylesheet runtime loader must remain removed');
must(!boot.includes('style.textContent'),'runtime geometry injection must not return');
must(!hardener.includes('footer-geometry-v32.css'),'production hardener must not rewrite footer v32 geometry');
must((fluid.match(/min-height:24px!important/g)||[]).length>=2,'compact footer contact actions must retain at least 24px height');
must(!fluid.includes('min-height:22px!important'),'compact footer must not regress below 24px');

if(failures.length){
  console.error(`BANHALMI footer/card/tail contract failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('BANHALMI footer/card/tail contract passed: 1180-1439px uses the overflow-safe two-row 8-track footer v32, 1440px+ retains the approved two-row 12-track composition, studio blocks remain separate and production hardening cannot rewrite canonical footer geometry.');
