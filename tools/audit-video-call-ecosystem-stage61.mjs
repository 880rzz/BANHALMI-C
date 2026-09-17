import { readFile } from 'node:fs/promises';
const errors=[]; const read=p=>readFile(p,'utf8');
const pages={
  'portrait/index.html':/15-minute Google Meet conversation directly with Norbert\./,
  'lifestyle/index.html':/15-minute Google Meet conversation directly with Norbert\./,
  'event-photography/index.html':/15-minute Google Meet conversation directly with Norbert\./,
  'contact/index.html':/15-minute Google Meet conversation directly with Norbert\./,
  'hu/portre/index.html':/15 perces Google Meet beszélgetés közvetlenül Bánhalmi Norberttel\./,
  'hu/brand/index.html':/15 perces Google Meet beszélgetés közvetlenül Bánhalmi Norberttel\./,
  'hu/rendezvenyfotozas/index.html':/15 perces Google Meet beszélgetés közvetlenül Bánhalmi Norberttel\./,
  'hu/kapcsolat/index.html':/15 perces Google Meet beszélgetés közvetlenül Bánhalmi Norberttel\./,
  'de-at/portrait/index.html':/15-minütiges Google-Meet-Gespräch direkt mit Norbert Bánhalmi\./,
  'de-at/brand/index.html':/15-minütiges Google-Meet-Gespräch direkt mit Norbert Bánhalmi\./,
  'de-at/eventfotografie/index.html':/15-minütiges Google-Meet-Gespräch direkt mit Norbert Bánhalmi\./,
  'de-at/kontakt/index.html':/15-minütiges Google-Meet-Gespräch direkt mit Norbert Bánhalmi\./
};
for(const [file,pattern] of Object.entries(pages)){
  const html=await read(file);
  if(!html.includes('https://meet.bookipi.com/zk5ly35r')) errors.push(file+': booking URL missing');
  if(!pattern.test(html)) errors.push(file+': canonical 15-minute consultation copy missing');
}
for(const file of ['ai.txt','llms-full.txt','ecosystem.json']){
  const text=await read(file);
  if(/book a 30-minute video call/i.test(text)) errors.push(file+': stale 30-minute video-call statement');
}
const eco=JSON.parse(await read('ecosystem.json'));
if(eco?.canonicalConsultation?.durationMinutes!==15) errors.push('ecosystem.json: canonical consultation must be 15 minutes');
if(eco?.canonicalConsultation?.bookingUrl!=='https://meet.bookipi.com/zk5ly35r') errors.push('ecosystem.json: booking URL mismatch');
const roles=new Map((eco.canonicalWebsites||[]).map(x=>[x.role,x.url]));
for(const [role,url] of [['professional-services','https://www.norbertbanhalmi.com/'],['artistic-archive','https://www.banhalmi.art/'],['editorial-knowledge-layer','https://blog.banhalmi.art/']]) if(roles.get(role)!==url) errors.push('ecosystem.json: missing '+role+' -> '+url);
if(errors.length){console.error('Stage61 video-call/ecosystem audit failed:');errors.forEach(e=>console.error(' - '+e));process.exit(1);}
console.log('Stage61 passed: 12 EN/HU/DE decision surfaces use the canonical 15-minute Google Meet consultation and the professional/archive/blog ecosystem contract is explicit.');
