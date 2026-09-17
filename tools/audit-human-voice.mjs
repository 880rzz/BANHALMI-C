import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const files = [];
const ignored = new Set(['.git', 'node_modules', 'redirects', 'docs', 'tools', 'tests']);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'index.html') files.push(full);
  }
}

function decode(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function visibleText(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  return decode(body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<([a-z][\w:-]*)\b(?=[^>]*\bclass=(["'])[^"']*\bsr-only\b[^"']*\2)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--([\s\S]*?)-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
}

const patterns = [
  ['more-than', /\bmore than\b/gi], ['not-just', /\bnot just\b/gi], ['not-only', /\bnot only\b/gi],
  ['journey', /\bjourney\b/gi], ['timeless', /\btimeless\b/gi], ['authentic', /\bauthentic\b/gi],
  ['unique', /\bunique\b/gi], ['discover', /\bdiscover\b/gi], ['seamless', /\bseamless\b/gi], ['elevate', /\belevat(?:e|es|ed|ing)\b/gi],
  ['Mehr-als', /\bmehr als\b/gi], ['nicht-nur', /\bnicht nur\b/gi], ['authentisch', /\bauthentisch\w*\b/gi], ['einzigartig', /\beinzigartig\w*\b/gi],
  ['több-mint', /\btöbb mint\b/gi], ['nem-csak', /\bnem csak\b/gi], ['autentikus', /\bautentikus\w*\b/gi], ['egyedi', /\begyedi\w*\b/gi]
];
const hardRisk = /\b(timeless|seamless|elevat(?:e|es|ed|ing)|unique journey|authentic journey|zeitlose Reise|nahtlos|einzigartige Reise|autentikus élmény|egyedülálló utazás)\b/gi;

function sentenceStats(text) {
  const sentences = text.split(/(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÖŐÚÜŰÄÖÜ])/u).map(s => s.trim()).filter(s => s.length >= 18);
  const lengths = sentences.map(s => s.split(/\s+/).length);
  if (!lengths.length) return { count: 0, average: 0, spread: 0, starts: [] };
  const average = lengths.reduce((a,b)=>a+b,0)/lengths.length;
  const spread = Math.sqrt(lengths.reduce((sum,n)=>sum+((n-average)**2),0)/lengths.length);
  const startCounts = new Map();
  for (const sentence of sentences) {
    const start = sentence.toLocaleLowerCase().split(/\s+/).slice(0,3).join(' ');
    startCounts.set(start,(startCounts.get(start)||0)+1);
  }
  return { count: sentences.length, average: Number(average.toFixed(1)), spread: Number(spread.toFixed(1)), starts: [...startCounts.entries()].filter(([,c])=>c>=3).sort((a,b)=>b[1]-a[1]).slice(0,6) };
}

walk(root);
const reports=[];
const failures=[];
const languageCounts={en:0,hu:0,de:0};
for (const file of files) {
  const rel='/' + path.relative(root,file).replaceAll(path.sep,'/');
  const lang=rel.startsWith('/hu/')?'hu':rel.startsWith('/de-at/')?'de':'en';
  languageCounts[lang]++;
  const text=visibleText(fs.readFileSync(file,'utf8'));
  if (text.length < 180) continue;
  const words=text.split(/\s+/).length;
  const matches={}; let clicheCount=0;
  for (const [name,regex] of patterns) { const count=(text.match(regex)||[]).length; if(count)matches[name]=count; clicheCount+=count; }
  const stats=sentenceStats(text);
  const density=words ? clicheCount/words*1000 : 0;
  const monotony=stats.count>=8&&stats.spread<6?3:stats.count>=8&&stats.spread<9?1:0;
  const repeatedStarts=stats.starts.reduce((sum,[,count])=>sum+count-2,0);
  const score=Number((density+monotony+repeatedStarts).toFixed(2));
  const hard=(text.match(hardRisk)||[]);
  reports.push({file:rel,language:lang,words,score,cliches:matches,sentenceAverage:stats.average,sentenceSpread:stats.spread,repeatedStarts:stats.starts,hardRisk:hard});
  if (hard.length) failures.push(`${rel}: generic AI/marketing phrasing: ${[...new Set(hard)].join(', ')}`);
  if (words >= 180 && density > 12) failures.push(`${rel}: cliché density ${density.toFixed(1)}/1000 words is too high`);
  if (stats.count >= 12 && stats.spread < 4.5) failures.push(`${rel}: sentence rhythm is unusually uniform (spread ${stats.spread})`);
}
reports.sort((a,b)=>b.score-a.score||b.words-a.words);
console.log(`Human-voice audit: ${reports.length} published content pages checked (EN ${languageCounts.en}, HU ${languageCounts.hu}, DE ${languageCounts.de}).`);
console.log(JSON.stringify({generatedAt:new Date().toISOString(),languageCounts,highestRisk:reports.slice(0,40),pages:reports},null,2));
if (failures.length) {
  console.error(`\nHUMAN-VOICE GATE FAILED (${failures.length})`);
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exit(1);
}
console.log('Human-voice gate passed across every published EN/HU/DE index page.');
