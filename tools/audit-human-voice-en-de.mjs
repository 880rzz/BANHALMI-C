import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root=process.cwd();
const failures=[];
const priority=[
  'index.html','about/index.html','portrait/index.html','lifestyle/index.html','event-photography/index.html','glamour/index.html','contact/index.html','faq/index.html','speier-viko/index.html',
  'de-at/index.html','de-at/werk/index.html','de-at/portrait/index.html','de-at/brand/index.html','de-at/eventfotografie/index.html','de-at/fine-art/index.html','de-at/kontakt/index.html','de-at/faq/index.html','de-at/speier-viko/index.html'
];
const banned=[
  'This is not only for companies.',
  'The result is not simply a folder of photographs',
  'not only by which frame looks strongest',
  'Strategic Visual Partnership',
  'Viko Speier — strategy that can be seen',
  'im Modell der strategischen visuellen Partnerschaft von BANHALMI',
  'Strategie für visuelles Vertrauen',
  'Vier fotografische Leistungen',
  'Vier Bereiche, verbunden durch eine Bildsprache'
];
const genericUi={en:new Set(['learn more','read more','discover','explore','view more','see more','click here','next step','next steps','project framework']),de:new Set(['mehr erfahren','weiterlesen','entdecken','mehr anzeigen','mehr sehen','hier klicken','nächster schritt','nächste schritte','projektrahmen'])};
function visible(h){return h.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&mdash;/gi,'—').replace(/&ndash;/gi,'–').replace(/\s+/g,' ').trim()}
function uiText(h){const out=[];for(const m of h.matchAll(/<(h1|h2|summary|button)\b[^>]*>([\s\S]*?)<\/\1>/gi))out.push([m[1].toLowerCase(),visible(m[2])]);for(const m of h.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi))if(/\b(?:class|role)=["'][^"']*(?:btn|button|cta)[^"']*["']/i.test(m[1]))out.push(['cta',visible(m[2])]);return out}
for(const rel of priority){
  const file=path.join(root,rel);
  if(!fs.existsSync(file)){failures.push(`${rel}: missing`);continue;}
  const html=fs.readFileSync(file,'utf8');
  const text=visible(html);
  for(const phrase of banned) if(text.includes(phrase)) failures.push(`${rel}: old templated phrase remains: ${phrase}`);
  const lang=rel.startsWith('de-at/')?'de':'en';
  for(const[type,label]of uiText(html)){const normalized=label.toLocaleLowerCase(lang).replace(/[.!?:;–—→+]+$/u,'').trim();if(genericUi[lang].has(normalized))failures.push(`${rel}: generic ${type} UI copy "${label}" — /human also covers H1/H2 and controls`)}
}
const required=[
  ['index.html','Photography for clear communication'],
  ['index.html','Four ways to solve the visual'],
  ['lifestyle/index.html','The same approach also works for individuals.'],
  ['speier-viko/index.html','Viko Speier — where strategy meets photography'],
  ['de-at/index.html','Fotografie für klare Kommunikation'],
  ['de-at/index.html','Vier Wege zu einer klaren visuellen'],
  ['de-at/speier-viko/index.html','Viko Speier — wo Strategie und Fotografie zusammenkommen']
];
for(const [rel,phrase] of required){const h=fs.readFileSync(path.join(root,rel),'utf8');if(!visible(h).includes(phrase))failures.push(`${rel}: approved human copy missing: ${phrase}`)}
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`English/German human-voice audit passed across ${priority.length} priority pages, including H1/H2/CTA/summary labels.`);
