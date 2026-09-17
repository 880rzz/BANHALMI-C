import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const target = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const pages = walk(path.join(root, 'hu')).filter((file) => file.endsWith('index.html'));
const requiredHungarianPages = [
  'hu/index.html',
  'hu/archivum/index.html',
  'hu/eletmu/index.html',
  'hu/gyik/index.html',
  'hu/brand/index.html',
  'hu/kapcsolat/index.html'
];
for (const file of requiredHungarianPages) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Required Hungarian page missing: ${file}`);
}
if (pages.length < requiredHungarianPages.length) failures.push(`Hungarian page inventory is unexpectedly small: ${pages.length}`);

function visibleBody(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}
function visibleFragment(html){return html.replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/&mdash;/g,'—').replace(/&ndash;/g,'–').replace(/\s+/g,' ').trim()}
function uiText(html){const out=[];for(const m of html.matchAll(/<(h1|h2|summary|button)\b[^>]*>([\s\S]*?)<\/\1>/gi))out.push([m[1].toLowerCase(),visibleFragment(m[2])]);for(const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi))if(/\b(?:class|role)=["'][^"']*(?:btn|button|cta)[^"']*["']/i.test(m[1]))out.push(['cta',visibleFragment(m[2])]);return out}

const banned = [
  /\bmeeting\b/i,
  /\bboard meeting/i,
  /\bheadshot\b/i,
  /\bBest of\b/i,
  /\bA üzleti portré\b/i,
  /\baz munkáltatói márkaépítés\b/i,
  /\bexecutive\b/i,
  /\bC[-‑ ]?level\b/i,
  /\bemployer branding\b/i,
  /\bpersonal branding\b/i,
  /\bthought leadership\b/i,
  /Art direction/i,
  /International Business Network Benefit/i,
  /BANHALMI team/i,
  /since 1999/i,
  /shared-secret/i,
  /inputvalidáció/i,
  /retenciós kontroll/i,
  /\bbackend\b/i,
  /\bwidgetek\b/i,
  /\bhoneypot\b/i
];
const genericUi=new Set(['tudj meg többet','tovább','fedezd fel','részletek','további részletek','kattints ide','következő lépés','következő lépések','projektkeretek','szakmai cikkek']);
for (const file of pages) {
  const html=fs.readFileSync(file, 'utf8');
  const text = visibleBody(html);
  for (const pattern of banned) if (pattern.test(text)) failures.push(`${path.relative(root, file)}: non-Hungarian or obsolete visible phrase remains: ${pattern}`);
  for(const[type,label]of uiText(html)){const normalized=label.toLocaleLowerCase('hu').replace(/[.!?:;–—→+]+$/u,'').trim();if(genericUi.has(normalized))failures.push(`${path.relative(root,file)}: generic ${type} UI copy "${label}" — a /human a H1/H2 és gombszövegekre is vonatkozik`)}
}

for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  const hasServiceFooter = html.includes('<summary>Szolgáltatások</summary>');
  if (hasServiceFooter && !html.includes('>Üzleti és vezetői portré<')) failures.push(`${path.relative(root, file)}: approved Hungarian portrait footer label missing`);
  if (hasServiceFooter && !html.includes('>Brandfotózás és vizuális pozicionálás<')) failures.push(`${path.relative(root, file)}: approved Hungarian brand footer label missing`);
  if (html.includes('>üzleti portré &amp; vezetői portré<')) failures.push(`${path.relative(root, file)}: obsolete portrait footer label remains`);
  if (html.includes('>Brand &amp; vizuális pozicionálás<')) failures.push(`${path.relative(root, file)}: obsolete brand footer label remains`);
}
const archiveHtml = read('hu/archivum/index.html');
if (archiveHtml.includes('Best of')) failures.push('archive metadata: obsolete English Best of phrase remains');
if (!archiveHtml.includes('Könyvek, kiállítások, média és válogatás')) failures.push('archive metadata: approved Hungarian title phrase missing');

const homepage = read('hu/index.html');
for (const phrase of [
  'Olyan képeket készítek, amelyek már az első találkozás előtt érzékeltetik egy vezető vagy egy szervezet karakterét.',
  'Az eredmény lehet pontos üzleti portré, egy vezető teljes képi világa, egy vezetői ülés visszafogott dokumentációja vagy később könyvbe kerülő sorozat.',
  'Az üzleti portré, a munkáltatói márkaépítés, a sajtóportré és a vizuális márkastratégia egymást kiegészítő eszközök.',
  '<h3>Felsővezetői eseményfotózás</h3>',
  '<h3>Válogatás</h3>'
]) if (!homepage.includes(phrase)) failures.push(`homepage: approved Hungarian copy missing: ${phrase}`);
if (!read('hu/archivum/index.html').includes('Válogatott galéria')) failures.push('archive: approved Hungarian gallery title missing');
if (!read('hu/gyik/index.html').includes('Az üzleti portré gyorsan és pontosan megmutatja, ki Ön.')) failures.push('FAQ: corrected Hungarian article is missing');
const menu = read('assets/js/mega-menu.js');
const approvedMenu = [
  'Szakmai pálya, alkotói fordulópontok és közösségi munka 1999 óta.',
  'Válogatás megbízásos sorozatokból és a művészeti archívumból.',
  'Könyvek, kiállítások, projektek és ellenőrizhető háttéranyagok.',
  'Milyen képi feladatra keres megoldást?',
  'Üzleti portré, vezetői portré és személyes vizuális pozicionálás.',
  'Egységes képi rendszer vezetőknek, csapatoknak és szervezeteknek.',
  'Visszafogott, helyzetérzékeny fotózás vezetői és vállalati eseményeken.',
  'Válaszok az előkészítésről, a fotózásról, az átadásról és a felhasználási jogokról.',
  "cta:'Árak és csomagajánlatok'"
];
for (const phrase of approvedMenu) if (!menu.includes(phrase)) failures.push(`mega-menu: approved Hungarian copy missing: ${phrase}`);
for (const obsolete of ['Headshot, executive portré', 'C-Level események', "cta:'Csomag összeállítása'", "cta:'Projekt összeállítása'", 'kontextusérzékeny dokumentáció']) {
  if (menu.includes(obsolete)) failures.push(`mega-menu: obsolete Hungarian copy remains: ${obsolete}`);
}

for (const obsolete of ['meeting előtt', 'board meeting', 'headshot lesz belőle']) {
  if (visibleBody(homepage).includes(obsolete)) failures.push(`homepage: obsolete Hungarian visible source remains: ${obsolete}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'));
  process.exit(1);
}
console.log(`Hungarian copy audit passed: ${pages.length} published pages, including H1/H2/CTA/summary labels, and the shared menu checked.`);
