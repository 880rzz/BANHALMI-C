import fs from 'node:fs';

const failures=[];
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const site=fs.readFileSync('assets/css/site.css','utf8');
const fluid=fs.readFileSync('assets/css/fluid-4k-rhythm.css','utf8');
const main=fs.readFileSync('assets/js/main.js','utf8');
const boot=fs.readFileSync('assets/js/fluid-rhythm-boot.js','utf8');
const legacyMain=fs.readFileSync('js/main.js','utf8');
const hardener=fs.readFileSync('tools/harden-production-artifact.mjs','utf8');
const restore=fs.readFileSync('tools/restore-production-design-authority.mjs','utf8');
const optimizer=fs.readFileSync('tools/optimize-production-artifact.mjs','utf8');
const footer=authority.layout?.footer||{};
const flow=authority.layout?.documentFlow||{};
const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(footer.canonicalGeometryAuthority==='assets/css/fluid-4k-rhythm.css','footer geometry authority must be fluid-4k-rhythm.css');
must(footer.canonicalFinalMarker==='FOOTER-SINGLE-CANONICAL-V40-20260923','footer canonical marker drifted');
must(footer.singleGeometryAuthorityRequired===true,'single footer geometry authority lock missing');
must(footer.legacyFooterMutatorsDisabled===true,'legacy footer mutator lock missing');
must(footer.runtimeDisclosureAuthority==='assets/js/main.js'&&Number(footer.runtimeDisclosureAuthorityCount)===1,'footer disclosure runtime must have exactly one owner');
must(Number(footer.physicalBusinessLocationCount)===3,'footer must expose exactly three physical business locations');
must(JSON.stringify(footer.locationRoles)===JSON.stringify(['vienna-studio','vienna-office','budapest-studio']),'footer location roles drifted');
must(Number(footer.desktopColumns)===12&&Number(footer.smallDesktopColumns)===8&&Number(footer.tabletColumns)===6,'responsive footer grid authority drifted');
must(Number(footer.desktopContentRows)===2&&Number(footer.smallDesktopContentRows)===2,'desktop footer must remain two rows');
must(flow.layoutMode==='flex'&&flow.documentBackground==='#ffffff','document/footer flow contract drifted');
must(Number(flow.footerAbsoluteMaxPx)<=760,'footer absolute height guard became too permissive');

must((fluid.match(/FOOTER-SINGLE-CANONICAL-V40-20260923/g)||[]).length===1,'canonical footer authority must occur exactly once');
for(const stale of ['FOOTER-RESTORE-V24','VISUAL-REPAIR-V27','FOOTER-TWO-ROW-V29','FOOTER-GEOMETRY-V32','FOOTER-SINGLE-AUTHORITY-20260918','FOOTER-ROOT-CAUSE-FINAL-CLOSURE','FINAL-FOOTER-MEGA-AUTHORITY','FOOTER-RENDER-STABILITY','FOOTER-MENU-HARMONY-CLOSURE','FOOTER-THREE-LOCATION-V36','HU-TABLET-FOOTER-DENSITY-V38']){
  must(!fluid.includes(stale),`stale footer authority returned: ${stale}`);
}
for(const rel of ['index.html','hu/index.html','de-at/index.html','portrait/index.html']){
  const html=fs.readFileSync(rel,'utf8');
  const sitePos=html.indexOf('/assets/css/site.css');
  const fluidPos=html.indexOf('/assets/css/fluid-4k-rhythm.css');
  must(sitePos>=0&&fluidPos>sitePos,rel+': canonical fluid footer authority must load after base site.css');
}
must(fluid.includes('@media (min-width:1440px)')&&fluid.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important'),'wide desktop 12-track footer missing');
must(fluid.includes('@media (min-width:1180px) and (max-width:1439px)')&&fluid.includes('grid-template-columns:repeat(8,minmax(0,1fr))!important'),'small desktop 8-track footer missing');
must(fluid.includes('@media (max-width:1179px)')&&fluid.includes('grid-template-columns:repeat(6,minmax(0,1fr))!important'),'compact six-track footer missing');
must((fluid.match(/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/g)||[]).length>=2,'three-location desktop contact columns missing');
must(fluid.includes('details.footer-accordion>ul')&&fluid.includes('visibility:hidden!important'),'compact initial disclosure collapse guard missing');
must(fluid.includes('overflow-x:clip!important')&&fluid.includes('overflow-wrap:anywhere!important'),'footer containment fallback missing');

must(/footerAccordions/.test(main)&&/style\.setProperty\("display"/.test(main),'assets/js/main.js must own disclosure state and explicit list visibility');
must(main.includes('data-artineris-participation')&&main.includes('budapest.artineris.com/en/artists/?codice=FMRAXT'),'shared footer must expose verified Budapest Artineris artist participation');
must(!/footerAccordions|syncFooterGroups|syncFooterAccordions/.test(boot),'fluid rhythm boot must not own footer disclosure state');
must(!/footerAccordions|syncFooterGroups|syncFooterAccordions/.test(legacyMain),'legacy js/main.js must not own footer disclosure state');
must(!/compactFooterReplacement|smallDesktopFooter|LIVE-PIXEL-GEOMETRY-V21-SMALL-DESKTOP/.test(hardener),'production hardener must not rewrite footer geometry');
must(!/const footerRules=|site-footer.*grid-template-columns/.test(restore),'design restore compiler must not generate footer geometry');
must(!/data-footer-compact-authority|compactCss|details\.footer-accordion>ul/.test(optimizer),'optimizer must not inject footer CSS/runtime authority');

if(failures.length){
  console.error(`BANHALMI single-footer-authority contract failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('BANHALMI footer contract passed: one committed CSS geometry authority, one disclosure runtime, three physical locations, and zero legacy footer mutators.');
