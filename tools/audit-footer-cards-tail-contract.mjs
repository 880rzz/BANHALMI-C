import fs from 'node:fs';

const failures=[];
const authority=JSON.parse(fs.readFileSync('data/design-authority.json','utf8'));
const fluid=fs.readFileSync('assets/css/fluid-4k-rhythm.css','utf8');
const boot=fs.readFileSync('assets/js/fluid-rhythm-boot.js','utf8');
const footer=authority.layout?.footer||{};
const flow=authority.layout?.documentFlow||{};
const must=(ok,msg)=>{if(!ok)failures.push(msg)};

must(Number(footer.desktopColumns)===4,'desktop footer must use four readable tracks');
must(Number(footer.desktopBands)===3,'desktop footer must remain a three-band composition');
must(Number(footer.compactDesktopColumns)===6&&Number(footer.tabletColumns)===6,'intermediate footer must remain six-column compact geometry');
must(Number(footer.paddingTopPx)===28&&Number(footer.paddingBottomPx)===18,'desktop footer padding contract changed');
must(Number(footer.desktopGapPx)===18,'desktop footer gap contract changed');
must(flow.documentBackground==='#202530','document floor must match dark footer');
must(Number(flow.footerAfterDocumentGapMaxPx)===2,'footer-after-document overhang tolerance changed');
must(Number(flow.footerMaxViewportFractionOnTabletDesktop)<=0.54,'desktop footer viewport fraction became too permissive');
must(Number(flow.footerAbsoluteMaxPx)<=480,'desktop footer absolute maximum became too permissive');
must(/grid-template-columns:minmax\(0,2fr\) repeat\(3,minmax\(0,1fr\)\)!important/.test(fluid),'canonical desktop footer must use four readable tracks');
must(/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/.test(fluid),'canonical intermediate footer six-column geometry missing');
must(fluid.includes('grid-template-rows:auto!important')&&fluid.includes('grid-auto-flow:row!important'),'desktop footer primary band must stay one rendered row');
must(/\.archive-cards>\.archive-card\{[^}]*height:100%!important;[^}]*display:flex!important;[^}]*flex-direction:column!important/.test(fluid),'archive cards must remain equal-height flex columns');
must((fluid.match(/min-height:24px!important/g)||[]).length>=2,'compact footer contact actions must retain at least 24px height');
must(!fluid.includes('min-height:22px!important'),'compact footer must not regress below 24px');
must(boot.includes('/assets/css/fluid-4k-rhythm.css?v=20260917-visual-repair-v29'),'visual repair cache-bust token missing');
must(!boot.includes('style.textContent'),'runtime geometry injection must not return');

if(failures.length){
  console.error(`BANHALMI footer/card/tail contract failed (${failures.length}):`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('BANHALMI footer/card/tail contract passed: three-band desktop footer, compact intermediate geometry, equal cards and canonical CSS authority are protected.');
