import fs from 'node:fs';
import path from 'node:path';
const origin='https://www.norbertbanhalmi.com';
const failures=[];
const skip=new Set(['.git','node_modules','_site','dist','coverage','assets','api','.well-known']);
const generic=/^(?:click here|learn more|more|read more|here|kattints ide|tovább|több|bővebben|hier klicken|mehr|weiter)$/i;
const legacy=new Set(['/oneletrajz-cv-fotozas','/portfolio-fotozas','/muveszi-aktfotozas','/reklam-fotozas','/about/norbert-banhalmi','/hu/rolam/banhalmi-norbert','/de/ueber-mich/norbert-banhalmi','/press','/old-print','/hu/sajto/megjelenesek','/hu/sajto/nyomtatott','/de/presse/presseauftritte','/de/presse/print','/hu/altalanos-szerzodesi-feltetelek/']);
function attrs(tag){const o={};for(const m of tag.matchAll(/([:\w-]+)=(["'])(.*?)\2/g))o[m[1].toLowerCase()]=m[3];return o}
function routeFor(rel){if(rel==='index.html')return'/';if(rel.endsWith('/index.html'))return'/'+rel.slice(0,-10);return'/'+rel}
function existsRoute(p){p=decodeURIComponent(p).replace(/\/+/g,'/');const rel=p.replace(/^\//,'');const candidates=[];if(!rel)candidates.push('index.html');else if(p.endsWith('/'))candidates.push(rel+'index.html');else {candidates.push(rel);candidates.push(rel+'.html');candidates.push(rel+'/index.html')}return candidates.some(f=>fs.existsSync(f)&&fs.statSync(f).isFile())}
function text(s){return s.replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|amp);/g,m=>m==='&amp;'?'&':' ').replace(/\s+/g,' ').trim()}
function isRedirect(h){return /<meta[^>]+http-equiv=["']refresh["']/i.test(h)||(/location\.(?:replace|href)\s*=/i.test(h)&&!/<main\b/i.test(h))}
function inspect(rel,abs){const h=fs.readFileSync(abs,'utf8');if(isRedirect(h)||!/<main\b/i.test(h))return;const base=origin+routeFor(rel);for(const m of h.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)){const a=attrs(m[0]);const href=(a.href||'').trim();if(!href)continue;const cls=a.class||'';const isCta=/(?:^|\s)(?:btn|btn-link|cta|button)(?:\s|$)/i.test(cls);if(isCta&&generic.test(text(m[0])))failures.push(`${rel}: generic CTA label “${text(m[0])}”`);if(/^javascript:/i.test(href)||href==='#')failures.push(`${rel}: unsafe/empty navigation target ${href}`);if(/^(?:mailto:|tel:|https?:\/\/|#)/i.test(href)&&!href.startsWith(origin))continue;let u;try{u=new URL(href,base)}catch{failures.push(`${rel}: invalid href ${href}`);continue}if(u.origin!==origin)continue;const pathname=u.pathname;if(legacy.has(pathname)||legacy.has(pathname.replace(/\/$/,'')))failures.push(`${rel}: internal navigation points at legacy redirect source ${pathname}`);if(!existsRoute(pathname))failures.push(`${rel}: unresolved internal navigation ${href} → ${pathname}`)}}
function walk(d,b=''){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()&&skip.has(e.name))continue;const rel=path.posix.join(b,e.name),abs=path.join(d,e.name);if(e.isDirectory())walk(abs,rel);else if(e.isFile()&&e.name.endsWith('.html'))inspect(rel,abs)}}
walk('.');
const menuLoader=fs.readFileSync('assets/js/mega-menu.js','utf8');
const menuCorePath=fs.existsSync('assets/js/mega-menu-v65-base.js')?'assets/js/mega-menu-v65-base.js':'assets/js/mega-menu.js';
const menu=fs.readFileSync(menuCorePath,'utf8');
if(menuCorePath!=='assets/js/mega-menu.js'){
  if(!menuLoader.includes('mega-menu-v65-base.js?v=20260917-menu-harmony-v31'))failures.push('v31 mega-menu loader lost canonical core handoff');
  if(!menuLoader.includes('mega-menu-harmony-v31.css?v=20260917-menu-harmony-v31'))failures.push('v31 mega-menu loader lost harmony stylesheet handoff');
}
for(const token of ['Services','Work','About · Pricing · Contact','Executive Portraits','Gallery','Art Archive','Partners','Szolgáltatások','Munkák','Rólam · Árak · Kapcsolat','Executive portré','Galéria','Művészeti archívum','Partnerek','Leistungen','Arbeiten','Über BANHALMI · Preise · Kontakt','Executive-Porträts','Galerie','Kunstarchiv','Partner',"grid.append(svc,main,foot)"])if(!menu.includes(token))failures.push('service-first multilingual navigation token missing: '+token);
for(const retired of ['Selected Work','Válogatott munkák','Ausgewählte Arbeiten','Books & Exhibitions','Könyvek és kiállítások','Bücher & Ausstellungen',"['/about/','Oeuvre'","['/hu/eletmu/','Életmű'","['/de-at/werk/','Werk'"])if(menu.includes(retired))failures.push('retired primary navigation structure returned: '+retired);
if(failures.length){console.error('Navigation/CTA contract FAILED:\n'+failures.map(x=>' - '+x).join('\n'));process.exit(1)}
console.log('Navigation/CTA contract passed: canonical routes, descriptive CTAs, v30 menu loader integrity and service-first EN/HU/DE navigation hierarchy are release-blocking.');
