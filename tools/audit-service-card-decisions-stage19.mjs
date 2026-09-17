import fs from 'node:fs';

const errors=[];
const expected={
  'index.html':[
    {href:'/portrait/',title:'Portrait Photography',cta:'See portrait work ›',description:'For leaders, founders and experts who need one credible visual identity across LinkedIn, company websites, press, speaking and internal communication—from a precise headshot to a complete public portrait system.',signals:['leaders','LinkedIn','press','portrait system']},
    {href:'/lifestyle/',title:'Brand Photography',cta:'See brand photography ›',description:'For organisations that need founders, teams, workplaces and campaigns to read as one recognisable brand across recruitment, sales, media and corporate communication—not as unrelated image sets.',signals:['organisations','recruitment','sales','recognisable brand']},
    {href:'/event-photography/',title:'C-Level Event Photography',cta:'See event coverage ›',description:'For board meetings, leadership summits, conferences and diplomatic settings where discreet coverage must preserve the room’s relationships, decisions and atmosphere for press, internal communication and the institutional archive.',signals:['board meetings','discreet','decisions','institutional archive']},
    {href:'/glamour/',title:'Fine Art Photography',cta:'Explore fine-art work ›',description:'For people seeking an author-led personal work rather than a conventional portrait: fine-art portraiture and nude art exploring identity, biography and the body through respectful direction, consent and discretion.',signals:['author-led','identity','consent','discretion']}
  ],
  'hu/index.html':[
    {href:'/hu/portre/',title:'Portréfotózás',cta:'Portrémunkák megtekintése ›',description:'Vezetőknek, alapítóknak és szakértőknek, akiknek a LinkedInen, a vállalati weboldalon, a sajtóban, előadásokon és a belső kommunikációban is hiteles, egységes képi jelenlétre van szükségük — a pontos profilképtől a teljes nyilvános portrérendszerig.',signals:['Vezetőknek','LinkedInen','sajtóban','portrérendszerig']},
    {href:'/hu/brand/',title:'Brandfotózás',cta:'Brandfotózás megtekintése ›',description:'Szervezeteknek, amelyek azt szeretnék, hogy a vezetők, csapatok, munkakörnyezetek és kampányok a toborzásban, az értékesítésben, a médiában és a vállalati kommunikációban is egyetlen felismerhető márkaként jelenjenek meg — ne különálló képsorozatokként.',signals:['Szervezeteknek','toborzásban','értékesítésben','felismerhető márkaként']},
    {href:'/hu/rendezvenyfotozas/',title:'Felsővezetői eseményfotózás',cta:'Eseményfotózás megtekintése ›',description:'Vezetői ülésekhez, konferenciákhoz, csúcstalálkozókhoz és diplomáciai helyzetekhez, ahol a diszkrét dokumentáció a sajtó, a belső kommunikáció és az intézményi archívum számára is megőrzi a kapcsolatokat, a döntéseket és a terem hangulatát.',signals:['Vezetői ülésekhez','diszkrét','döntéseket','intézményi archívum']},
    {href:'/hu/muveszi-fotografia/',title:'Művészi fotográfia',cta:'Művészi munkák megtekintése ›',description:'Azoknak, akik hagyományos portré helyett szerzői személyes művet keresnek: művészi portré és aktfotográfia az identitásról, az élettörténetről és a testről, tiszteletteljes vezetéssel, beleegyezéssel és diszkrécióval.',signals:['szerzői személyes művet','identitásról','beleegyezéssel','diszkrécióval']}
  ],
  'de-at/index.html':[
    {href:'/de-at/portrait/',title:'Porträtfotografie',cta:'Porträtarbeiten ansehen ›',description:'Für Führungskräfte, Gründer:innen und Expert:innen, die auf LinkedIn, der Unternehmenswebsite, in Presse, Vorträgen und interner Kommunikation eine glaubwürdige, konsistente visuelle Identität benötigen — vom präzisen Headshot bis zum vollständigen öffentlichen Porträtsystem.',signals:['Führungskräfte','LinkedIn','Presse','Porträtsystem']},
    {href:'/de-at/brand/',title:'Brandfotografie',cta:'Brandfotografie ansehen ›',description:'Für Organisationen, deren Führungskräfte, Teams, Arbeitswelten und Kampagnen in Recruiting, Vertrieb, Medien und Unternehmenskommunikation als eine wiedererkennbare Marke erscheinen sollen — nicht als voneinander unabhängige Bildserien.',signals:['Organisationen','Recruiting','Vertrieb','wiedererkennbare Marke']},
    {href:'/de-at/eventfotografie/',title:'C-Level-Eventfotografie',cta:'Eventreportagen ansehen ›',description:'Für Board Meetings, Leadership Summits, Konferenzen und diplomatische Situationen, in denen diskrete Dokumentation Beziehungen, Entscheidungen und Atmosphäre für Presse, interne Kommunikation und institutionelles Archiv bewahren muss.',signals:['Board Meetings','diskrete','Entscheidungen','institutionelles Archiv']},
    {href:'/de-at/fine-art/',title:'Fine-Art-Fotografie',cta:'Fine-Art-Arbeiten ansehen ›',description:'Für Menschen, die statt eines konventionellen Porträts ein autorengeführtes persönliches Werk suchen: Fine-Art-Porträts und künstlerischer Akt über Identität, Biografie und Körper, mit respektvoller Führung, Einwilligung und Diskretion.',signals:['autorengeführtes','Identität','Einwilligung','Diskretion']}
  ]
};
for(const [file,cards] of Object.entries(expected)){
  const html=fs.readFileSync(file,'utf8');
  const section=(html.match(/<section id="services">[\s\S]*?<\/section>/)||[''])[0];
  if(!section)errors.push(file+': service section missing');
  if((section.match(/<a class="card reveal"/g)||[]).length!==4)errors.push(file+': card count changed');
  cards.forEach((card,index)=>{
    const exact='<a class="card reveal" href="'+card.href+'"><h3>'+card.title+'</h3><p>'+card.description+'</p><span class="more">'+card.cta+'</span></a>';
    if(!section.includes(exact))errors.push(file+': exact card contract missing at position '+(index+1)+' '+card.title);
    for(const signal of card.signals)if(!card.description.includes(signal))errors.push(file+': decision signal missing from '+card.title+' '+signal);
  });
}
const services=JSON.parse(fs.readFileSync('services.json','utf8'));
if(services.numberOfItems!==4||services.itemListElement?.length!==4)errors.push('services.json: four-service structure changed');
for(const service of services.itemListElement){
  if(!service.audience?.audienceType)errors.push('services.json: audience missing for '+service.name);
  if(!service.serviceOutput)errors.push('services.json: serviceOutput missing for '+service.name);
}
const ecosystem=JSON.parse(fs.readFileSync('ecosystem.json','utf8'));
if(ecosystem.serviceDecisionModel?.services?.length!==4||ecosystem.serviceDecisionModel?.preservesFourPrincipalServices!==true)errors.push('ecosystem.json: service decision model incomplete');

for(const file of ['ai.txt','llms-full.txt']){
  const text=fs.readFileSync(file,'utf8');
  if((text.split('<!-- SERVICE-DECISION-CARDS:START -->').length-1)!==1)errors.push(file+': service decision block missing or duplicated');
}
const llms=fs.readFileSync('llms.txt','utf8');
for(const route of [
  'https://www.norbertbanhalmi.com/portrait/',
  'https://www.norbertbanhalmi.com/lifestyle/',
  'https://www.norbertbanhalmi.com/event-photography/',
  'https://www.norbertbanhalmi.com/glamour/'
]) if(!llms.includes(route)) errors.push('llms.txt: service route missing '+route);
for(const invented of ['/brand-photography/','/c-level-event-photography/','/fine-art-photography/']) if(llms.includes(invented)) errors.push('llms.txt: invented/noncanonical service route remains '+invented);

const manifest=JSON.parse(fs.readFileSync('docs/content-migrations/2026-08-06-service-card-decisions-stage4.json','utf8'));
if(manifest.pages?.length!==3||manifest.pages.some(page=>page.cards?.length!==4||page.nonDescriptionContentPreservedExactly!==true))errors.push('migration manifest: service-card preservation evidence incomplete');
if(errors.length){console.error(errors.join(String.fromCharCode(10)));process.exit(1)}
console.log('Service-card decision audit passed: three languages, four unchanged real routes, detailed AI evidence and concise llms discovery are aligned.');
