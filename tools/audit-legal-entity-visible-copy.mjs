import fs from 'node:fs';

const files = {
  en: fs.readFileSync('impressum/index.html', 'utf8'),
  de: fs.readFileSync('de-at/impressum/index.html', 'utf8'),
  hu: fs.readFileSync('hu/impresszum/index.html', 'utf8')
};

const canonicalLegalName = 'Banhalmi Norbert e.U.';
const forbidden = [
  'Norbert Banhalmi – Executive Porträt und visuelle Positionierung e.U.',
  'Bánhalmi Norbert e.U.',
  'Norbert Banhalmi e.U.'
];

const errors = [];
for (const [lang, html] of Object.entries(files)) {
  if (!html.includes(canonicalLegalName)) {
    errors.push(`${lang}: canonical legal name missing: ${canonicalLegalName}`);
  }
  for (const value of forbidden) {
    if (html.includes(value)) errors.push(`${lang}: forbidden legal-name drift present: ${value}`);
  }
}

const visibleContracts = {
  en: [
    [/<h2>Provider[\s\S]{0,300}<p><strong>Banhalmi Norbert e\.U\.<\/strong><\/p>/i, 'visible provider block'],
    [/Company name:<\/strong>\s*Banhalmi Norbert e\.U\./i, 'detailed company-data block']
  ],
  de: [
    [/<h2>Angaben gemäß ECG[\s\S]{0,300}<p><strong>Banhalmi Norbert e\.U\.<\/strong><\/p>/i, 'visible provider block'],
    [/Firmenname:<\/strong>\s*Banhalmi Norbert e\.U\./i, 'detailed company-data block']
  ],
  hu: [
    [/<h2>Szolgáltatói[\s\S]{0,300}<p><strong>Banhalmi Norbert e\.U\.<\/strong><\/p>/i, 'visible provider block'],
    [/Cégnév:<\/strong>\s*Banhalmi Norbert e\.U\./i, 'detailed company-data block']
  ]
};

for (const [lang, contracts] of Object.entries(visibleContracts)) {
  for (const [pattern, label] of contracts) {
    if (!pattern.test(files[lang])) errors.push(`${lang}: ${label} must use Banhalmi Norbert e.U.`);
  }
}

if (errors.length) {
  console.error('LEGAL ENTITY VISIBLE COPY AUDIT FAILED');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

console.log('Legal entity visible-copy audit passed for EN/DE/HU.');
