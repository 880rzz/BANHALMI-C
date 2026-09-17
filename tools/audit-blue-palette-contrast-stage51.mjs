import fs from 'node:fs';

function channel(v){v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}
function lum(hex){const h=hex.replace('#','');const [r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));return .2126*channel(r)+.7152*channel(g)+.0722*channel(b)}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
function requireRatio(name,fg,bg,min){const ratio=contrast(fg,bg);if(ratio<min)throw new Error(`${name}: ${ratio.toFixed(2)}:1 < ${min}:1`);console.log(`${name}: ${ratio.toFixed(2)}:1`)}
const css=fs.readFileSync('assets/css/style.css','utf8');
for(const token of ['--navy:#202530','--graphite:#202530','--ink:#202530','--title-accent:#2F6F78','.site-footer{background:#202530','STAGE52-TYPE-ACCENT:START']) if(!css.includes(token)) throw new Error(`Missing blue palette/type accent contract: ${token}`);
requireRatio('deep blue text on white','#202530','#FFFFFF',4.5);
requireRatio('white on deep blue','#FFFFFF','#202530',4.5);
requireRatio('brand gold on deep blue','#B79C44','#202530',4.5);
requireRatio('footer gold on deep blue','#CBB45F','#202530',4.5);
requireRatio('footer secondary text on deep blue','#AEB4C2','#202530',4.5);
requireRatio('petrol title accent on white','#2F6F78','#FFFFFF',4.5);
requireRatio('petrol title accent on soft white','#2F6F78','#F5F5F7',4.5);
for(const file of ['index.html','hu/index.html','de-at/index.html']){
  const html=fs.readFileSync(file,'utf8');
  const accents=(html.match(/class="title-accent title-accent--block"/g)||[]).length;
  if(accents!==2) throw new Error(`${file}: expected exactly 2 sparse type accents, found ${accents}`);
  if(!html.includes('style.css?v=20260810-menu-polish-v65')) throw new Error(`${file}: Stage 63 cache token missing`);
}
console.log('BANHALMI blue palette and sparse type accent WCAG contrast audit passed.');
