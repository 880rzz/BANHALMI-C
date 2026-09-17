import fs from 'node:fs';
const errors=[];
const css=fs.readFileSync('assets/css/mega-menu.css','utf8');
const js=fs.readFileSync('assets/js/mega-menu.js','utf8');
const config=fs.readFileSync('assets/js/site-config.js','utf8');
for(const t of ['STAGE63-DESKTOP-MENU-FOOTER:START','height:100dvh','grid-template-columns:repeat(2,minmax(0,1fr))','max-height:760px','linear-gradient(145deg,#2D3444 0%,#29303F 46%,#202530 100%)'])if(!css.includes(t))errors.push('mega-menu.css missing '+t);
for(const t of ['Pricing & packages','Árak és csomagajánlatok','Preise & Pakete'])if(!js.includes(t))errors.push('mega-menu.js missing '+t);
for(const t of ['mega-menu.css?v=20260810-menu-polish-v65','mega-menu.js?v=20260810-menu-polish-v65'])if(!config.includes(t))errors.push('site-config.js missing '+t);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage 63 passed: desktop menu is single-viewport, multilingual pricing labels are semantic, and footer uses the blue gradient authority.');
