import fs from 'node:fs';
const errors=[];
const css=fs.readFileSync('assets/css/site.css','utf8');
const js=fs.readFileSync('assets/js/mega-menu.js','utf8');
const restore=fs.readFileSync('tools/restore-production-design-authority.mjs','utf8');

for(const t of ['/* === SOURCE: mega-menu.css === */','.bn-mega-pricing-section','@media(max-width:620px)','linear-gradient(145deg,#2D3444 0%,#29303F 46%,#202530 100%)']) if(!css.includes(t)) errors.push('canonical menu/footer CSS missing '+t);
for(const t of ["pricingTitle:'Pricing · Quote'","pricingTitle:'Árak · Ajánlat'","pricingTitle:'Preise · Angebot'","['/fine-art/','Fine Art'","pricing.className='bn-mega-pricing-section'"]) if(!js.includes(t)) errors.push('mega-menu.js missing '+t);
for(const retired of ["['/glamour/','Fine Art'",'STAGE64-ART-LIKE-FULLSCREEN-MENU','STAGE65-MENU-POLISH']) if(css.includes(retired)||js.includes(retired)) errors.push('retired menu authority restored: '+retired);
if(restore.includes('const megaRules=')) errors.push('design compiler must not inject a second mega-menu CSS authority');
if(!restore.includes('Mega-menu geometry is canonical in assets/css/site.css')) errors.push('design compiler canonical menu ownership guard missing');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Menu authority passed: one canonical CSS system, descriptive EN/HU/DE navigation, separate pricing section, /fine-art/ canonical route, no restore-script override.');
