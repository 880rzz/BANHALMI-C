import fs from 'node:fs';

const descriptions={
 'lifestyle/index.html':'Brand photography and visual positioning in Vienna and Budapest for executives, entrepreneurs, artists and personal brands.',
 'glamour/index.html':'Fine-art photography in Vienna and Budapest exploring identity, dignity, the body and memory, with private commissions informed by an exhibited oeuvre.',
 'accessibility/index.html':'Accessibility statement for norbertbanhalmi.com covering keyboard access, image alternatives, responsive design, known limitations and support.',
 'trust/index.html':'BANHALMI Trust Center covering privacy, GDPR, responsible AI, image licensing, security, accessibility and transparent project governance.',
 'portrait/index.html':'Executive portrait and headshot photography in Vienna and Budapest for leaders, entrepreneurs and personal brands, built for credible professional use.',
 'contact/index.html':'Contact BANHALMI in Vienna or Budapest to discuss executive portraits, brand photography, C-level events or fine-art commissions.',
 'hu/brand/index.html':'Brandfotózás és vizuális pozicionálás Bécsben és Budapesten vezetőknek, vállalkozóknak, művészeknek és személyes márkáknak.',
 'hu/portre/index.html':'Executive portré és headshot fotózás Bécsben és Budapesten vezetőknek, vállalkozóknak és személyes márkáknak, hiteles szakmai felhasználásra.',
 'hu/muveszi-fotografia/index.html':'Művészi fotográfia Bécsben és Budapesten az identitás, méltóság, test és emlékezet témáiban, kiállított életműre épülő magánmegbízásokkal.',
 'hu/rendezvenyfotozas/index.html':'C-level eseményfotózás fotós csapattal Bécsben és Budapesten, gyorsan használható sajtó-, vállalati és hosszú távú kommunikációs képanyaggal.',
 'de-at/kontakt/index.html':'Kontakt zu BANHALMI in Wien oder Budapest für Executive-Porträts, Brandfotografie, C-Level-Events und Fine-Art-Projekte.',
 'de-at/brand/index.html':'Brandfotografie und visuelle Positionierung in Wien und Budapest für Führungskräfte, Unternehmer, Kunstschaffende und persönliche Marken.',
 'de-at/fine-art/index.html':'Fine-Art-Fotografie in Wien und Budapest zu Identität, Würde, Körper und Erinnerung, mit privaten Aufträgen auf Basis eines ausgestellten Œuvres.',
 'de-at/portrait/index.html':'Executive-Porträt- und Headshot-Fotografie in Wien und Budapest für Führungskräfte, Unternehmer und persönliche Marken mit professionellem Einsatzfokus.',
 'de-at/eventfotografie/index.html':'C-Level-Eventfotografie mit Fototeam in Wien und Budapest für schnell nutzbare Presse-, Unternehmens- und langfristige Kommunikationsbilder.'
};
const trustPages=['trust/index.html','hu/bizalom/index.html','de-at/vertrauen/index.html'];
const socialImage='https://www.norbertbanhalmi.com/assets/img/og/banhalmi-og.webp';
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const attr=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');
function setMeta(html,key,value){
 const re=new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${escRe(key)}["'])[^>]*>`,'i');
 const m=re.exec(html);if(!m)throw new Error(`missing meta ${key}`);
 let tag=m[0];
 if(/\bcontent=["'][^"']*["']/i.test(tag))tag=tag.replace(/\bcontent=(["'])[^"']*\1/i,`content="${attr(value)}"`);
 else tag=tag.replace(/\s*\/?>(?=$)/,` content="${attr(value)}"/>`);
 return html.slice(0,m.index)+tag+html.slice(m.index+m[0].length);
}
function ensureMeta(html,key,value,property=false){
 const re=new RegExp(`<meta\\b(?=[^>]*(?:name|property)=["']${escRe(key)}["'])[^>]*>`,'i');
 if(re.test(html))return setMeta(html,key,value);
 if(!/<\/head>/i.test(html))throw new Error(`cannot add ${key}: closing head missing`);
 const field=property?'property':'name';
 return html.replace(/<\/head>/i,`<meta ${field}="${key}" content="${attr(value)}">\n</head>`);
}
for(const [file,description] of Object.entries(descriptions)){
 let html=fs.readFileSync(file,'utf8');
 for(const key of ['description','og:description','twitter:description'])html=setMeta(html,key,description);
 fs.writeFileSync(file,html);
 console.log(`${file}: synchronized complete meta/OG/Twitter description.`);
}
for(const file of trustPages){
 let html=fs.readFileSync(file,'utf8');
 html=ensureMeta(html,'og:image',socialImage,true);
 html=ensureMeta(html,'twitter:card','summary_large_image');
 html=ensureMeta(html,'twitter:image',socialImage);
 fs.writeFileSync(file,html);
 console.log(`${file}: completed Trust Center social image/card metadata.`);
}
console.log(`Updated ${Object.keys(descriptions).length} subpages and completed EN/HU/DE Trust Center social metadata; homepage and biography metadata remain owned by their dedicated contracts.`);
