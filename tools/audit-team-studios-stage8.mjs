import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const errors=[];
const pages=[
 {relative:'about/index.html',heading:'Who leads what',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Vienna and Budapest',norbertLink:'/about/',vikoLink:'/speier-viko/',contactLink:'/contact/',compact:false},
 {relative:'contact/index.html',heading:'Who leads what',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Vienna and Budapest',norbertLink:'/about/',vikoLink:'/speier-viko/',contactLink:'/contact/',compact:true},
 {relative:'speier-viko/index.html',heading:'Who leads what',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Vienna and Budapest',norbertLink:'/about/',vikoLink:'/speier-viko/',contactLink:'/contact/',compact:false},
 {relative:'requestaquote/index.html',heading:'Who leads what',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Vienna and Budapest',norbertLink:'/about/',vikoLink:'/speier-viko/',contactLink:'/contact/',compact:false},
 {relative:'hu/eletmu/index.html',heading:'Ki mit vezet?',norbert:'Bánhalmi Norbert',viko:'Viko Speier',studios:'Bécs és Budapest',norbertLink:'/hu/eletmu/',vikoLink:'/hu/speier-viko/',contactLink:'/hu/kapcsolat/',compact:false},
 {relative:'hu/kapcsolat/index.html',heading:'Ki mit vezet?',norbert:'Bánhalmi Norbert',viko:'Viko Speier',studios:'Bécs és Budapest',norbertLink:'/hu/eletmu/',vikoLink:'/hu/speier-viko/',contactLink:'/hu/kapcsolat/',compact:true},
 {relative:'hu/speier-viko/index.html',heading:'Ki mit vezet?',norbert:'Bánhalmi Norbert',viko:'Viko Speier',studios:'Bécs és Budapest',norbertLink:'/hu/eletmu/',vikoLink:'/hu/speier-viko/',contactLink:'/hu/kapcsolat/',compact:false},
 {relative:'hu/ajanlatkeres/index.html',heading:'Ki mit vezet?',norbert:'Bánhalmi Norbert',viko:'Viko Speier',studios:'Bécs és Budapest',norbertLink:'/hu/eletmu/',vikoLink:'/hu/speier-viko/',contactLink:'/hu/kapcsolat/',compact:false},
 {relative:'de-at/werk/index.html',heading:'Wer verantwortet welchen Bereich?',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Wien und Budapest',norbertLink:'/de-at/werk/',vikoLink:'/de-at/speier-viko/',contactLink:'/de-at/kontakt/',compact:false},
 {relative:'de-at/kontakt/index.html',heading:'Wer verantwortet welchen Bereich?',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Wien und Budapest',norbertLink:'/de-at/werk/',vikoLink:'/de-at/speier-viko/',contactLink:'/de-at/kontakt/',compact:true},
 {relative:'de-at/speier-viko/index.html',heading:'Wer verantwortet welchen Bereich?',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Wien und Budapest',norbertLink:'/de-at/werk/',vikoLink:'/de-at/speier-viko/',contactLink:'/de-at/kontakt/',compact:false},
 {relative:'de-at/anfrage/index.html',heading:'Wer verantwortet welchen Bereich?',norbert:'Norbert Banhalmi',viko:'Viko Speier',studios:'Wien und Budapest',norbertLink:'/de-at/werk/',vikoLink:'/de-at/speier-viko/',contactLink:'/de-at/kontakt/',compact:false}
];

for(const item of pages){
 const {relative,heading,norbert,viko,studios,norbertLink,vikoLink,contactLink,compact}=item;
 const file=path.join(root,relative);
 if(!fs.existsSync(file)){errors.push(`${relative}: file missing`);continue;}
 const html=fs.readFileSync(file,'utf8');
 if((html.match(/data-team-roles="stage8"/g)||[]).length!==1) errors.push(`${relative}: team role block must appear exactly once`);
 const section=(html.match(/<section class="section-band team-role-clarity"[\s\S]*?<\/section>/)||[''])[0];
 if(!section.includes(heading)) errors.push(`${relative}: localized heading missing`);
 const expectedCards=compact?2:3;
 if((section.match(/<article class="card reveal">/g)||[]).length!==expectedCards) errors.push(`${relative}: expected exactly ${expectedCards} responsibility cards`);
 const required=[norbert,viko,norbertLink,vikoLink,'AmCham Austria'];
 if(!compact) required.push(studios,contactLink);
 for(const token of required) if(!section.includes(token)) errors.push(`${relative}: missing ${token}`);
 const lower=section.toLowerCase();
 if(!/(creative lead|kreatív vezető|kreative.*leitung)/.test(lower)) errors.push(`${relative}: Norbert creative lead role unclear`);
 if(!/(budapest studio|budapesti stúdió|budapester studio)/.test(lower)) errors.push(`${relative}: Viko Budapest studio role unclear`);
 if(!compact && !/(same professional system|ugyanannak a szakmai rendszernek|desselben professionellen systems)/.test(lower)) errors.push(`${relative}: two-base one-company model unclear`);
 if(compact && section.includes(studios)) errors.push(`${relative}: redundant two-base project-system card remains on compact contact page`);
}

if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Stage-eight team and studio role audit passed across 12 pages and three languages.');
