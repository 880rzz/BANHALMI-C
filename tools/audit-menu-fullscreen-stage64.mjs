import fs from 'node:fs';
const errors=[];
const js=fs.readFileSync('assets/js/mega-menu.js','utf8');
const css=fs.readFileSync('assets/css/mega-menu.css','utf8');
const config=fs.readFileSync('assets/js/site-config.js','utf8');
const build=(js.split('function build')[1]||'');
if(build.includes('bn-mega-journal-head'))errors.push('journal heading still rendered');
if(build.includes('t.journal.forEach'))errors.push('journal links still rendered');
for(const t of ['STAGE64-ART-LIKE-FULLSCREEN-MENU:START','grid-template-columns:repeat(3,minmax(0,1fr))','align-content:center'])if(!css.includes(t))errors.push('missing '+t);
for(const t of ['mega-menu.css?v=20260810-menu-polish-v65','mega-menu.js?v=20260810-menu-polish-v65'])if(!config.includes(t))errors.push('missing '+t);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage 64 passed: blog-free ART-like full-screen navigation.');
