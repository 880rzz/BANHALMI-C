import fs from 'node:fs';

const pages=[
  {
    file:'about/index.html',
    title:'Norbert Banhalmi — Biography, Practice & Artistic Background',
    description:'Norbert Banhalmi’s professional and artistic background since 1999, from documentary beginnings to executive portraiture and visual strategy.',
    artBase:'https://www.banhalmi.art/', press:'https://www.banhalmi.art/press.html', curators:'https://www.banhalmi.art/curators.html', writing:'https://www.banhalmi.art/writing.html',
    bridge:`<section class="section-band art-archive-bridge" id="artistic-archive"><div class="wrap"><div class="section-head"><p class="eyebrow">Fine-art record</p><h2>The artistic work has its own archive</h2></div><div class="prose"><p>Exhibitions, books, long-term artistic projects, curatorial programmes, press records and preserved sources are maintained in the canonical BANHALMI ART archive. This professional site keeps only the artistic context needed to understand the commissioned practice.</p></div><div class="service-actions"><a class="btn btn-primary" href="https://www.banhalmi.art/" rel="me">Explore the artistic archive</a><a class="btn-link" href="https://www.banhalmi.art/press.html" rel="me">Browse press and source records</a></div></div></section>`
  },
  {
    file:'hu/eletmu/index.html',
    title:'Bánhalmi Norbert — Életrajz, szakmai gyakorlat és művészeti háttér',
    description:'Bánhalmi Norbert szakmai és művészeti háttere 1999 óta: dokumentarista kezdetektől a vezetői portréfotózásig és a vizuális stratégiáig.',
    artBase:'https://www.banhalmi.art/hu/', press:'https://www.banhalmi.art/hu/press.html', curators:'https://www.banhalmi.art/hu/curators.html', writing:'https://www.banhalmi.art/hu/writing.html',
    bridge:`<section class="section-band art-archive-bridge" id="artistic-archive"><div class="wrap"><div class="section-head"><p class="eyebrow">Művészeti életmű</p><h2>A művészeti munkának saját archívuma van</h2></div><div class="prose"><p>A kiállítások, könyvek, hosszú távú művészeti projektek, kurátori programok, sajtómegjelenések és megőrzött források kanonikus helye a BANHALMI ART archívum. Ezen a szakmai oldalon csak az alkalmazott munkához szükséges művészeti kontextus marad.</p></div><div class="service-actions"><a class="btn btn-primary" href="https://www.banhalmi.art/hu/" rel="me">A művészeti archívum megnyitása</a><a class="btn-link" href="https://www.banhalmi.art/hu/press.html" rel="me">Sajtó- és forrásarchívum</a></div></div></section>`
  },
  {
    file:'de-at/werk/index.html',
    title:'Biografie, Praxis & künstlerischer Hintergrund | Norbert Banhalmi',
    description:'Norbert Banhalmis professioneller und künstlerischer Hintergrund seit 1999: von dokumentarischen Anfängen bis Executive-Porträts und visueller Strategie.',
    artBase:'https://www.banhalmi.art/de-at/', press:'https://www.banhalmi.art/de-at/press.html', curators:'https://www.banhalmi.art/de-at/curators.html', writing:'https://www.banhalmi.art/de-at/writing.html',
    bridge:`<section class="section-band art-archive-bridge" id="artistic-archive"><div class="wrap"><div class="section-head"><p class="eyebrow">Künstlerisches Werk</p><h2>Die künstlerische Arbeit hat ein eigenes Archiv</h2></div><div class="prose"><p>Ausstellungen, Bücher, langfristige Kunstprojekte, kuratorische Programme, Medienberichte und bewahrte Quellen werden im kanonischen BANHALMI-ART-Archiv dokumentiert. Auf dieser professionellen Website bleibt nur der künstlerische Kontext, der zum Verständnis der Auftragsarbeit gehört.</p></div><div class="service-actions"><a class="btn btn-primary" href="https://www.banhalmi.art/de-at/" rel="me">Kunstarchiv öffnen</a><a class="btn-link" href="https://www.banhalmi.art/de-at/press.html" rel="me">Presse- und Quellenarchiv</a></div></div></section>`
  }
];

const ids=['exhibitions','permanent-exhibition','curatorial-programme','books','media','professional-articles','video-media'];
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function sectionRange(html,id){
  const re=new RegExp(`<section\\b[^>]*\\bid=["']${escape(id)}["'][^>]*>`,`i`);
  const m=re.exec(html);
  if(!m) throw new Error(`Missing section #${id}`);
  let pos=m.index+m[0].length,depth=1;
  const tag=/<\/?section\b[^>]*>/gi; tag.lastIndex=pos;
  let t;
  while((t=tag.exec(html))){depth+=/^<section\b/i.test(t[0])?1:-1;if(depth===0)return{start:m.index,end:tag.lastIndex};}
  throw new Error(`Unclosed section #${id}`);
}
function replaceMeta(html,name,value,property=false){
  const attr=property?'property':'name';
  const re=new RegExp(`<meta\\b([^>]*\\b${attr}=["']${escape(name)}["'][^>]*)>`,`i`);
  const m=re.exec(html); if(!m)return html;
  const tag=m[0].replace(/content=["'][^"']*["']/i,`content="${value.replaceAll('&','&amp;').replaceAll('"','&quot;')}"`);
  return html.slice(0,m.index)+tag+html.slice(m.index+m[0].length);
}
function retargetArchiveFragments(html,p){
  const targets={
    exhibitions:`${p.artBase}#exhibitions`,
    'permanent-exhibition':`${p.artBase}#exhibitions`,
    books:`${p.artBase}#books`,
    media:p.press,
    'video-media':p.press,
    'curatorial-programme':p.curators,
    'professional-articles':p.writing
  };
  for(const [id,url] of Object.entries(targets)){
    const re=new RegExp(`href=(["'])#${escape(id)}\\1`,'gi');
    html=html.replace(re,`href="${url}"`);
  }
  return html;
}

for(const p of pages){
  let html=fs.readFileSync(p.file,'utf8');
  if(html.includes('id="artistic-archive"'))throw new Error(`${p.file}: already simplified; refusing duplicate migration`);
  const ranges=ids.map(id=>({id,...sectionRange(html,id)}));
  for(let i=1;i<ranges.length;i++)if(ranges[i].start<ranges[i-1].end)throw new Error(`${p.file}: unexpected overlapping archive sections`);
  const between=html.slice(ranges[0].start,ranges.at(-1).end);
  for(const id of ids)if((between.match(new RegExp(`id=["']${escape(id)}["']`,'gi'))||[]).length!==1)throw new Error(`${p.file}: archive ownership range is not deterministic for #${id}`);
  html=html.slice(0,ranges[0].start)+p.bridge+html.slice(ranges.at(-1).end);
  html=retargetArchiveFragments(html,p);
  html=html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${p.title.replaceAll('&','&amp;')}</title>`);
  html=replaceMeta(html,'description',p.description);
  html=replaceMeta(html,'og:title',p.title,true);
  html=replaceMeta(html,'og:description',p.description,true);
  html=replaceMeta(html,'twitter:title',p.title);
  html=replaceMeta(html,'twitter:description',p.description);
  for(const id of ids){
    if(new RegExp(`id=["']${escape(id)}["']`,'i').test(html))throw new Error(`${p.file}: removed ART-owned section #${id} still present`);
    if(new RegExp(`href=["']#${escape(id)}["']`,'i').test(html))throw new Error(`${p.file}: stale local archive fragment #${id} remains after ownership migration`);
  }
  if(!html.includes('id="artistic-archive"'))throw new Error(`${p.file}: archive bridge missing after migration`);
  const h1=(html.match(/<h1\b/gi)||[]).length;if(h1!==1)throw new Error(`${p.file}: expected one H1 after migration, found ${h1}`);
  fs.writeFileSync(p.file,html);
  console.log(`${p.file}: consolidated seven ART-owned sections and retargeted stale archive fragments to canonical ART routes.`);
}
