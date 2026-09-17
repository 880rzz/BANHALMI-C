import fs from 'node:fs';

const pages = [
  { file: 'index.html', must: [/BANHALMI/i, /visual strategic partner|visual trust/i, /Executive Portrait/i, /Brand Photography/i, /Event Photography/i, /Fine Art/i, /Vienna/i, /Budapest/i, /request|consultation|quote|conversation|project/i, /banhalmi\.art/i] },
  { file: 'hu/index.html', must: [/BANHALMI/i, /vizuális stratégiai partner|vizuális bizalom/i, /Executive portré/i, /Brandfotó/i, /Eseményfotó/i, /Fine Art|Művészeti/i, /Bécs/i, /Budapest/i, /ajánlat|konzultáció|beszélgetés|projekt összeállítása/i, /banhalmi\.art/i] },
  { file: 'de-at/index.html', must: [/BANHALMI/i, /visueller strategischer Partner|visuelles Vertrauen/i, /Executive-Porträt/i, /Brandfotografie/i, /Eventfotografie/i, /Fine Art/i, /Wien/i, /Budapest/i, /Angebot|Beratung|Gespräch|Paket zusammenstellen/i, /banhalmi\.art/i] }
];

const errors = [];
for (const { file, must } of pages) {
  const html = fs.readFileSync(file, 'utf8');
  for (const pattern of must) {
    if (!pattern.test(html)) errors.push(`${file}: missing clarity signal ${pattern}`);
  }
}
const german = fs.readFileSync('de-at/index.html', 'utf8');
if (/Sechs fotografische Leistungen/i.test(german)) errors.push('de-at/index.html: stale six-service framing');
if (!/Vier (?:fotografische Leistungen|Hauptleistungen|Formen der Zusammenarbeit)/i.test(german)) errors.push('de-at/index.html: four-service framing missing');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('First-principles five-second clarity audit passed for EN/HU/DE.');
