import fs from 'node:fs';
const js=fs.readFileSync('assets/js/mega-menu.js','utf8');
const css=fs.readFileSync('assets/css/mega-menu.css','utf8');
const config=fs.readFileSync('assets/js/site-config.js','utf8');
const errors=[];
for(const t of ['STAGE65-MENU-POLISH:START','--bn-menu-gold:#D3B85A','border:0!important;outline:0!important;box-shadow:none!important;background:transparent!important','padding:1rem 1.15rem!important'])if(!css.includes(t))errors.push('missing '+t);
if(js.includes("main.append(node([art,t.art,t.artDesc],'bn-mega-art'))"))errors.push('BANHALMI ART still renders as a dedicated mega-menu card');
if(js.includes("foot.append(node([art,t.art,t.artDesc],'bn-mega-art'))"))errors.push('BANHALMI ART still renders in the support column');
if(!js.includes("foot.append(node([q,t.cta,t.ctaDesc],'bn-mega-pricing'))"))errors.push('pricing/packages entry is not rendered as a plain menu item');
if(js.includes("foot.append(node([q,t.cta,t.ctaDesc],'bn-mega-cta'))"))errors.push('pricing/packages entry still uses the framed CTA class');
for(const t of ['mega-menu.css?v=20260810-menu-polish-v65','mega-menu.js?v=20260810-menu-polish-v65'])if(!config.includes(t))errors.push('stale menu cache token '+t);
function ch(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}function lum(h){h=h.replace('#','');const a=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return .2126*ch(a[0])+.7152*ch(a[1])+.0722*ch(a[2])}function cr(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const bg of ['#202530','#29303F','#2D3444']){const r=cr('#D3B85A',bg);if(r<4.5)errors.push('menu gold contrast '+r.toFixed(2)+' on '+bg);}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}console.log('Stage 65 passed: menu active state is frameless, BANHALMI ART has no dedicated menu card, pricing/packages is a plain navigation item, desktop type is readable, and dark-surface gold remains WCAG AA.');