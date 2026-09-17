import fs from 'node:fs';

const failures=[];
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const fluid=fs.readFileSync('assets/css/fluid-4k-rhythm.css','utf8');
const boot=fs.readFileSync('assets/js/fluid-rhythm-boot.js','utf8');
const hardener=fs.readFileSync('tools/harden-production-artifact.mjs','utf8');
const footer=authority.layout?.footer||{};
const flow=authority.layout?.documentFlow||{};
const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(Number(footer.desktopColumns)===12,'desktop footer must use the approved 12-track grid');
must(Number(footer.desktopContentRows)===2,'desktop footer content must remain exactly two rows');
must(Number(footer.desktopContactColumns)===2,'desktop contact area must keep Vienna and Budapest as two separate studio columns');
must(Array.isArray(footer.desktopTopRowGroups)&&footer.desktopTopRowGroups.join('|')==='brand|services|archive|profile','desktop footer first-row group order changed');
must(Array.isArray(footer.desktopBottomRowGroups)&&footer.desktopBottomRowGroups.join('|')==='contact|social|memberships|legal','desktop footer second-row group order changed');
must(footer.desktopNoMidWordBreaks===true,'desktop footer must prohibit mid-word breaking');
must(Number(footer.desktopMinPx)===1180,'desktop footer breakpoint changed');
must(Number(footer.desktopMaxContentPx)===1440,'desktop footer content width changed');
must(flow.documentBackground==='#202530','document floor must match dark footer');
must(Number(flow.footerAfterDocumentGapMaxPx)===2,'footer-after-document overhang tolerance changed');
must(Number(flow.footerMaxViewportFractionOnTabletDesktop)<=0.82,'desktop footer viewport fraction became too permissive');
must(Number(flow.footerAbsoluteMaxPx)<=760,'desktop footer absolute maximum became too permissive');

must(fluid.includes('FOOTER-TWO-ROW-V29-20260917'),'two-row footer v29 canonical marker missing');
const v29=fluid.split('FOOTER-TWO-ROW-V29-20260917')[1]||'';
must(/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)!important/.test(v29),'v29 desktop footer 12-track grid missing');
must(/grid-template-rows:auto auto!important/.test(v29),'v29 desktop footer must have exactly two content rows');
must(v29.includes('nth-of-type(1){grid-column:4 / span 2!important;grid-row:1!important;}'),'services placement changed');
must(v29.includes('nth-of-type(2){grid-column:6 / span 2!important;grid-row:1!important;}'),'archive placement changed');
must(v29.includes('nth-of-type(3){grid-column:8 / span 3!important;grid-row:1!important;}'),'profile placement changed');
must(v29.includes('nth-of-type(4){grid-column:6 / span 2!important;grid-row:2!important;}'),'social placement changed');
must(v29.includes('nth-of-type(5){grid-column:8 / span 3!important;grid-row:2!important;}'),'memberships placement changed');
must(v29.includes('grid-column:1 / span 5!important')&&v29.includes('grid-column:11 / span 2!important'),'contact/legal second-row placement changed');
must(v29.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),'desktop contact studio split missing');
must(v29.includes('word-break:normal!important')&&v29.includes('overflow-wrap:normal!important')&&v29.includes('hyphens:none!important'),'footer no-mid-word-break contract missing');
must(!v29.includes('overflow-wrap:anywhere!important'),'v29 must not reintroduce arbitrary word breaking');
must(!hardener.includes('FOOTER-TWO-ROW-V29'),'production hardener must not own or duplicate footer v29 geometry');
must((fluid.match(/min-height:24px!important/g)||[]).length>=2,'compact footer contact actions must retain at least 24px height');
must(!fluid.includes('min-height:22px!important'),'compact footer must not regress below 24px');
must(boot.includes('/assets/css/fluid-4k-rhythm.css?v=20260917-visual-repair-v27'),'canonical stylesheet runtime fallback token missing');
must(!boot.includes('style.textContent'),'runtime geometry injection must not return');

if(failures.length){
  console.error(`BANHALMI footer/card/tail contract failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('BANHALMI footer/card/tail contract passed: desktop footer is a stable two-row 12-track composition, studio blocks remain separate, mid-word breaking is prohibited, compact fallbacks are preserved and canonical CSS remains the geometry authority.');
