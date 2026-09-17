import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const walk = async (dir) => {
  const out = [];
  for (const name of await readdir(dir)) {
    if (['.git','node_modules','_site','playwright-report','test-results'].includes(name)) continue;
    const p = path.join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) out.push(...await walk(p));
    else out.push(p);
  }
  return out;
};
const rel = p => path.relative(root,p).replaceAll('\\','/');
const text = async p => readFile(p,'utf8');
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
const files = await walk(root);
const htmlFiles = files.filter(p => p.endsWith('.html'));
const indexable = [];
const redirects = [];
const titles = new Map();
const descriptions = new Map();

for (const p of htmlFiles) {
  const r = rel(p); const h = await text(p);
  const isRedirect = /http-equiv=["']refresh["']|location\.(?:href|replace)|window\.location/i.test(h);
  const noindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(h) || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots/i.test(h);
  if (isRedirect) { redirects.push(r); continue; }
  if (noindex || /404\.html$/.test(r)) continue;
  indexable.push(r);
  const lang = h.match(/<html[^>]+lang=["']([^"']+)/i)?.[1];
  const title = h.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  const descTag = [...h.matchAll(/<meta\b[^>]*>/gi)].map(m => m[0]).find(t => attr(t,'name')?.toLowerCase() === 'description');
  const desc = descTag ? attr(descTag,'content')?.trim() : undefined;
  const canonicalTag = [...h.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(t => attr(t,'rel')?.toLowerCase().split(/\s+/).includes('canonical'));
  const canonical = canonicalTag ? attr(canonicalTag,'href') : undefined;
  if (!lang) errors.push(`${r}: missing html lang`);
  if (!title) errors.push(`${r}: missing title`);
  if (!desc) errors.push(`${r}: missing meta description`);
  if (!canonical) errors.push(`${r}: missing canonical`);
  if (!/<h1\b/i.test(h)) errors.push(`${r}: missing H1`);
  if (title) { const key=`${(lang||'unknown').toLowerCase()}\u0000${title}`; const a=titles.get(key)||[]; a.push(r); titles.set(key,a); }
  if (desc) { const key=`${(lang||'unknown').toLowerCase()}\u0000${desc}`; const a=descriptions.get(key)||[]; a.push(r); descriptions.set(key,a); }
  for (const m of h.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(m[1]); } catch { errors.push(`${r}: invalid JSON-LD`); }
  }
}

for (const [key, rs] of titles) if (rs.length > 1 && rs.every(x => !/case-studies|esettanulmanyok|fallstudien/.test(x))) errors.push(`duplicate indexable title in one language: ${key.split('\u0000')[1]} :: ${rs.join(', ')}`);
for (const [key, rs] of descriptions) if (rs.length > 2) errors.push(`description reused ${rs.length}x in one language: ${key.split('\u0000')[1].slice(0,80)}… :: ${rs.join(', ')}`);

const strategic = {
  'portrait/index.html': ['executive','headshot','cv','dating profile','artist portfolio','Budapest','Vienna'],
  'hu/portre/index.html': ['önéletrajz','társkereső','művész','Budapest','Bécs'],
  'de-at/portrait/index.html': ['Executive','Headshot','Bewerbungs','Dating','Künstler','Budapest','Wien']
};
for (const [r, needles] of Object.entries(strategic)) {
  const h = await text(path.join(root,r));
  for (const n of needles) if (!h.toLocaleLowerCase().includes(n.toLocaleLowerCase())) errors.push(`${r}: missing strategic intent “${n}”`);
  if (!h.includes('Q56391118') || !h.includes('https://www.norbertbanhalmi.com/about/')) errors.push(`${r}: Wikidata-first Person contract incomplete`);
  if (!/peter-magyar-portrait-2026|magyar-peter-portre-2026|peter-magyar-portraet-2026/.test(h)) errors.push(`${r}: flagship Magyar/Peter portrait evidence not linked`);
}

for (const r of ['case-studies/peter-magyar-portrait-2026/index.html','hu/esettanulmanyok/magyar-peter-portre-2026/index.html','de-at/fallstudien/peter-magyar-portraet-2026/index.html']) {
  const h = await text(path.join(root,r));
  if (!h.includes('Q56391118')) errors.push(`${r}: flagship case study missing Wikidata Person evidence`);
}

for (const p of files.filter(p => p.endsWith('.json'))) {
  try { JSON.parse(await text(p)); } catch { errors.push(`${rel(p)}: invalid JSON`); }
}
const ai = await text(path.join(root,'ai.txt'));
for (const n of ['Executive portrait','Headshot','CV / resume','dating profile','artist portfolio','Budapest','Vienna','Q56391118']) if (!ai.toLowerCase().includes(n.toLowerCase())) errors.push(`ai.txt: missing intent/entity “${n}”`);
const llms = await text(path.join(root,'llms.txt'));
if (!/ai\.txt|knowledge|services/i.test(llms)) errors.push('llms.txt: missing machine-readable discovery bridge');
if (!llms.includes('blog-collections.json')) errors.push('llms.txt: missing multilingual service-related editorial collection bridge');

const menu = await text(path.join(root,'assets/js/mega-menu.js'));
const blogCategories = ['portre-es-portfoliofotozas','portre-es-headshotfotozas','aktfotozas-muveszi-szemmel','vipach-fotografiai-kozosseg'];
for (const slug of blogCategories) {
  const url = `https://blog.banhalmi.art/blog/categories/${slug}`;
  if (!menu.includes(`'${url}'`)) errors.push(`mega-menu.js: missing canonical blog category ${slug}`);
}
if (menu.includes('/blog/tags/') || menu.includes('?lang=')) errors.push('mega-menu.js: retired blog tag or query-language URL remains');
for (const label of ['Journal & expert guides','Szakmai tudástár','Wissen & Journal']) if (!menu.includes(label)) errors.push(`mega-menu.js: missing localized editorial navigation label “${label}”`);
for (const heading of ['Further reading from the BANHALMI journal','Kapcsolódó írások a BANHALMI szakmai blogból','Weiterführende Beiträge aus dem BANHALMI Journal']) if (!menu.includes(heading)) errors.push(`mega-menu.js: missing localized contextual editorial heading “${heading}”`);
for (const route of ['/portrait','/hu/portre','/de-at/portrait','/lifestyle','/hu/brand','/de-at/brand','/glamour','/hu/muveszi-fotografia','/de-at/fine-art']) if (!menu.includes(`'${route}'`)) errors.push(`mega-menu.js: missing contextual editorial service route ${route}`);
if (!menu.includes("section.id='service-editorial'")) errors.push('mega-menu.js: contextual service editorial section is not created');
if (!menu.includes("portrait:[2,4]") || !menu.includes("brand:[0,1,4]") || !menu.includes("fine:[3,4]")) errors.push('mega-menu.js: service-to-editorial topic mapping is incomplete');

let collections;
try { collections = JSON.parse(await text(path.join(root,'blog-collections.json'))); }
catch { collections = null; errors.push('blog-collections.json: invalid or unreadable JSON'); }
if (collections) {
  const items = Array.isArray(collections.itemListElement) ? collections.itemListElement : [];
  if (items.length !== 15) errors.push(`blog-collections.json: expected 15 localized collection records, found ${items.length}`);
  const urls = items.map(x => x?.item?.url).filter(Boolean);
  for (const slug of blogCategories) {
    const url = `https://blog.banhalmi.art/blog/categories/${slug}`;
    if (!urls.includes(url)) errors.push(`blog-collections.json: missing ${url}`);
  }
  if (JSON.stringify(collections).includes('/blog/tags/') || JSON.stringify(collections).includes('?lang=')) errors.push('blog-collections.json: retired tag or query-language URL remains');
  const ids = items.map(x => x?.item?.['@id']).filter(Boolean);
  if (new Set(ids).size !== ids.length) errors.push('blog-collections.json: duplicate category-context @id');
  const person = collections.author || {};
  if (person['@id'] !== 'https://www.norbertbanhalmi.com/about/' || person.sameAs !== 'https://www.wikidata.org/wiki/Q56391118') errors.push('blog-collections.json: Wikidata-first author contract incomplete');
  if (collections.isPartOf?.['@id'] !== 'https://www.norbertbanhalmi.com/#website') errors.push('blog-collections.json: collection map must belong to the professional WebSite that hosts it');
  if (JSON.stringify(collections).includes('https://www.norbertbanhalmi.com/#ecosystem')) errors.push('blog-collections.json: undefined #ecosystem node must not be referenced');
}

let blogEntity;
try { blogEntity = JSON.parse(await text(path.join(root,'blog-entity.jsonld'))); }
catch { blogEntity = null; errors.push('blog-entity.jsonld: invalid or unreadable JSON-LD'); }
if (blogEntity) {
  const graph = Array.isArray(blogEntity['@graph']) ? blogEntity['@graph'] : [];
  const blog = graph.find(x => x?.['@id'] === 'https://blog.banhalmi.art/#blog');
  const website = graph.find(x => x?.['@id'] === 'https://blog.banhalmi.art/#website');
  if (!blog || blog['@type'] !== 'Blog') errors.push('blog-entity.jsonld: #blog must be the single Blog identity');
  if (!website || website['@type'] !== 'WebSite') errors.push('blog-entity.jsonld: #website must be WebSite only');
  if (blog?.isPartOf?.['@id'] !== 'https://blog.banhalmi.art/#website') errors.push('blog-entity.jsonld: Blog must be part of the blog WebSite');
  if (website?.mainEntity?.['@id'] !== 'https://blog.banhalmi.art/#blog') errors.push('blog-entity.jsonld: blog WebSite must point to #blog as mainEntity');
  const languages = JSON.stringify(['hu-HU','en-GB','de-AT']);
  if (JSON.stringify(blog?.inLanguage) !== languages || JSON.stringify(website?.inLanguage) !== languages) errors.push('blog-entity.jsonld: Blog and WebSite language contract must be hu-HU/en-GB/de-AT');
  const related = new Set((blog?.isRelatedTo || []).map(x => x?.['@id']));
  for (const id of ['https://www.norbertbanhalmi.com/#website','https://www.banhalmi.art/#website']) if (!related.has(id)) errors.push(`blog-entity.jsonld: Blog missing reciprocal ecosystem relation ${id}`);
  if (JSON.stringify(blogEntity).includes('https://www.norbertbanhalmi.com/#ecosystem')) errors.push('blog-entity.jsonld: undefined #ecosystem node must not be referenced');
  for (const slug of blogCategories) if (!JSON.stringify(blogEntity).includes(`https://blog.banhalmi.art/blog/categories/${slug}#collection`)) errors.push(`blog-entity.jsonld: missing category entity ${slug}`);
  if (JSON.stringify(blogEntity).includes('/blog/tags/') || JSON.stringify(blogEntity).includes('?lang=')) errors.push('blog-entity.jsonld: retired tag or query-language URL remains');
  if (!JSON.stringify(blogEntity).includes('blog-collections.json')) errors.push('blog-entity.jsonld: missing machine-readable collection dataset link');
}

if (errors.length) {
  console.error(`Stage60 critical ecosystem audit failed with ${errors.length} issue(s):`);
  for (const e of errors) console.error(` - ${e}`);
  process.exit(1);
}
console.log(`Stage60 critical ecosystem audit passed: ${htmlFiles.length} HTML, ${indexable.length} indexable candidates, ${redirects.length} redirect surfaces inventoried; canonical redirect behavior remains enforced by the dedicated redirect/routing audits; all JSON parseable, strategic EN/HU/DE intent, Wikidata-first evidence, clean Blog/WebSite identity and multilingual service-to-blog editorial mapping locked.`);
