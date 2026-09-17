import fs from 'node:fs';
const js=fs.readFileSync('assets/js/mega-menu.js','utf8');
const errors=[];
const tokens=['Services','Work','About · Pricing · Contact','Executive Portraits','Gallery','Art Archive','Partners','Szolgáltatások','Munkák','Rólam · Árak · Kapcsolat','Executive portré','Galéria','Művészeti archívum','Partnerek','Leistungen','Arbeiten','Über BANHALMI · Preise · Kontakt','Executive-Porträts','Galerie','Kunstarchiv','Partner',"grid.append(svc,main,foot)","foot.append(node([q,t.cta,t.ctaDesc],'bn-mega-pricing'))"];
for(const token of tokens)if(!js.includes(token))errors.push('mega-menu.js missing navigation token: '+token);
for(const oldToken of ['Selected Work','Válogatott munkák','Ausgewählte Arbeiten','Books & Exhibitions','Könyvek és kiállítások','Bücher & Ausstellungen',"['/about/','Oeuvre'","['/hu/eletmu/','Életmű'","['/de-at/werk/','Werk'"])if(js.includes(oldToken))errors.push('legacy navigation token remains: '+oldToken);
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Navigation ecosystem audit passed: canonical multilingual service-first hierarchy and Gallery → Art Archive → Partners Work menu are present.');
