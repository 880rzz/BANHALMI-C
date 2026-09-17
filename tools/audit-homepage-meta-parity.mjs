import fs from 'node:fs';

const expected = {
  'index.html': ['BANHALMI | Executive Portrait & Brand Photography | Vienna–Budapest','Executive portraits, headshots, brand photography and C-level event coverage in Vienna and Budapest. Strategic visual positioning for leaders, experts, artists, actors, teams and organisations.'],
  'hu/index.html': ['BANHALMI | Executive portré és brandfotózás | Bécs–Budapest','Executive portré, headshot, brandfotózás és C-level eseményfotózás Bécsben és Budapesten. Vizuális pozicionálás vezetőknek, szakembereknek, művészeknek, színészeknek és szervezeteknek.'],
  'de-at/index.html': ['BANHALMI | Executive-Porträt & Brandfotografie | Wien–Budapest','Executive-Porträts, Headshots, Brandfotografie und C-Level-Eventfotografie in Wien und Budapest. Visuelle Positionierung für Führungskräfte, Experten, Künstler, Schauspieler und Organisationen.']
};
const failures=[];
function decode(v=''){return v.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')}
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)=(["'])(.*?)\2/g))o[m[1].toLowerCase()]=decode(m[3]);return o}
function meta(html,key){for(const m of html.matchAll(/<meta\b[^>]*>/gi)){const a=attrs(m[0]);if((a.name||'').toLowerCase()===key||(a.property||'').toLowerCase()===key)return a.content||''}return''}
for (const [file,[title,desc]] of Object.entries(expected)) {
  const html=fs.readFileSync(file,'utf8');
  const actualTitle=decode((html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]||'').trim());
  if(actualTitle!==title)failures.push(`${file}: title mismatch: ${actualTitle}`);
  for(const [key,want] of [['description',desc],['og:title',title],['og:description',desc],['twitter:title',title],['twitter:description',desc]]){
    const got=meta(html,key);if(got!==want)failures.push(`${file}: ${key} mismatch: ${got}`);
  }
  if (/name="description"[^>]*content="[^"]*…|content="[^"]*…"[^>]*name="description"/i.test(html)) failures.push(`${file}: ellipsis-truncated meta description survived`);
  if (!html.includes('"dateModified":"2026-08-14T16:35:00+02:00"')) failures.push(`${file}: schema freshness not updated`);
  const page = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>{try{return JSON.parse(m[1])}catch{return null}}).find(x=>x?.['@type']==='WebPage');
  if (!page) failures.push(`${file}: WebPage schema missing`);
  else {
    if (decode(page.name)!==title || decode(page.headline)!==title) failures.push(`${file}: WebPage title parity drift`);
    if (decode(page.description)!==desc) failures.push(`${file}: WebPage description parity drift`);
    if (page.dateModified!=='2026-08-14T16:35:00+02:00') failures.push(`${file}: WebPage dateModified drift`);
  }
}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('BANHALMI homepage metadata parity passed semantically for EN/HU/DE: decoded title/social/schema values are aligned without depending on HTML entity spelling or attribute order.');
