import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
 ['portrait/index.html','Booking, rescheduling and contingency','Confirmed reservation','Cancellation and external costs','Illness, failure and force majeure'],
 ['lifestyle/index.html','Booking, rescheduling and contingency','Confirmed reservation','Cancellation and external costs','Illness, failure and force majeure'],
 ['event-photography/index.html','Booking, rescheduling and contingency','Confirmed reservation','Cancellation and external costs','Illness, failure and force majeure'],
 ['faq/index.html','Booking, rescheduling and contingency','Confirmed reservation','Cancellation and external costs','Illness, failure and force majeure'],
 ['terms-conditions/index.html','Booking, rescheduling and contingency','Confirmed reservation','Cancellation and external costs','Illness, failure and force majeure'],
 ['hu/portre/index.html','Foglalás, átütemezés és rendkívüli helyzetek','Végleges időpontfoglalás','Lemondás és külső költségek','Betegség, meghibásodás és vis maior'],
 ['hu/brand/index.html','Foglalás, átütemezés és rendkívüli helyzetek','Végleges időpontfoglalás','Lemondás és külső költségek','Betegség, meghibásodás és vis maior'],
 ['hu/rendezvenyfotozas/index.html','Foglalás, átütemezés és rendkívüli helyzetek','Végleges időpontfoglalás','Lemondás és külső költségek','Betegség, meghibásodás és vis maior'],
 ['hu/gyik/index.html','Foglalás, átütemezés és rendkívüli helyzetek','Végleges időpontfoglalás','Lemondás és külső költségek','Betegség, meghibásodás és vis maior'],
 ['hu/aszf/index.html','Foglalás, átütemezés és rendkívüli helyzetek','Végleges időpontfoglalás','Lemondás és külső költségek','Betegség, meghibásodás és vis maior'],
 ['de-at/portrait/index.html','Buchung, Verschiebung und Ausfallsicherheit','Verbindliche Reservierung','Storno und Fremdkosten','Krankheit, Ausfall und höhere Gewalt'],
 ['de-at/brand/index.html','Buchung, Verschiebung und Ausfallsicherheit','Verbindliche Reservierung','Storno und Fremdkosten','Krankheit, Ausfall und höhere Gewalt'],
 ['de-at/eventfotografie/index.html','Buchung, Verschiebung und Ausfallsicherheit','Verbindliche Reservierung','Storno und Fremdkosten','Krankheit, Ausfall und höhere Gewalt'],
 ['de-at/faq/index.html','Buchung, Verschiebung und Ausfallsicherheit','Verbindliche Reservierung','Storno und Fremdkosten','Krankheit, Ausfall und höhere Gewalt'],
 ['de-at/agb/index.html','Buchung, Verschiebung und Ausfallsicherheit','Verbindliche Reservierung','Storno und Fremdkosten','Krankheit, Ausfall und höhere Gewalt']
];
for(const [relative,heading,reservation,cancellation,contingency] of pages){
 const file=path.join(root,relative);if(!fs.existsSync(file)){errors.push(`${relative}: missing file`);continue;}
 const html=fs.readFileSync(file,'utf8');
 if((html.match(/data-booking-contingency="stage11"/g)||[]).length!==1) errors.push(`${relative}: booking block must appear exactly once`);
 const section=(html.match(/<section class="section-band booking-contingency"[\s\S]*?<\/section>/)||[''])[0];
 for(const token of [heading,reservation,cancellation,contingency]) if(!section.includes(token)) errors.push(`${relative}: missing ${token}`);
 if((section.match(/<article class="card reveal">/g)||[]).length!==4) errors.push(`${relative}: expected four booking cards`);
 if(!/written acceptance|írásos elfogadás|schriftlicher Annahme/.test(section)) errors.push(`${relative}: written booking rule missing`);
 if(!/external costs|külső költség|Fremdkosten/.test(section)) errors.push(`${relative}: external-cost rule missing`);
 if(!/replacement date|új időpont|Ersatztermin/.test(section)) errors.push(`${relative}: replacement-date rule missing`);
 const marker=html.indexOf('data-booking-contingency="stage11"');
 const mainClose=html.lastIndexOf('</main>');
 if(marker<0 || marker>mainClose) errors.push(`${relative}: block must stay inside main`);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-eleven booking and contingency audit passed across fifteen pages and three languages.');