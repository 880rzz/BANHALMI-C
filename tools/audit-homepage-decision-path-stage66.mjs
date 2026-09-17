import { readFile } from 'node:fs/promises';

const booking = 'https://meet.bookipi.com/zk5ly35r';
const viennaAddress = 'Schwedenplatz 2, Top 8–9, 1010 Wien';
const cases = [
  {file:'index.html',quote:'/requestaquote/',gallery:'https://www.banhalmi.art/#works',decision:'What do you need right now?',label:'Book a 15-minute video call',note:'Booking interface in English.'},
  {file:'hu/index.html',quote:'/hu/ajanlatkeres/',gallery:'https://www.banhalmi.art/hu/#works',decision:'Mire van most szüksége?',label:'Foglalj 15 perces videóhívást',note:'A foglalási felület angol nyelvű.'},
  {file:'de-at/index.html',quote:'/de-at/anfrage/',gallery:'https://www.banhalmi.art/de-at/#works',decision:'Was brauchen Sie jetzt?',label:'15-minütiges Videogespräch buchen',note:'Die Buchungsoberfläche ist auf Englisch.'}
];

const errors = [];
for (const entry of cases) {
  const html = await readFile(entry.file, 'utf8');
  if (!html.includes('data-first-principles-path="stage68"') || !html.includes(entry.decision)) errors.push(`${entry.file}: localized pain-point decision layer missing`);
  if (!html.includes('data-home-decision-path="consultation"')) errors.push(`${entry.file}: homepage consultation path missing`);
  if (!html.includes(booking)) errors.push(`${entry.file}: canonical Bookipi booking URL missing`);
  if (!html.includes(entry.label)) errors.push(`${entry.file}: localized 15-minute call label missing`);
  if (!html.includes(entry.note)) errors.push(`${entry.file}: localized English-interface note missing`);
  const escapedLabel = entry.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedNote = entry.note.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const bookingOption = new RegExp(`<span class="hero-booking-option"><a[^>]+>${escapedLabel}</a><small class="hero-booking-note">${escapedNote}</small></span>`);
  if (!bookingOption.test(html)) errors.push(`${entry.file}: booking note must remain attached to its consultation action`);
  if (!html.includes(`href="${entry.quote}"`)) errors.push(`${entry.file}: pricing/quote path missing`);
  if (!html.includes(entry.gallery)) errors.push(`${entry.file}: ART gallery bridge missing`);
  const bookingCount = html.split(booking).length - 1;
  if (bookingCount !== 1) errors.push(`${entry.file}: homepage must expose the direct booking URL exactly once, found ${bookingCount}`);
  if (!html.includes(viennaAddress)) errors.push(`${entry.file}: canonical Vienna studio address drifted; expected ${viennaAddress}`);
  if (/·\s*·/.test(html)) errors.push(`${entry.file}: duplicate footer separator detected`);
}

const optimizer = await readFile('tools/optimize-homepage-critical-path.mjs', 'utf8');
for (const token of [
  'data-hero-position="header-first"',
  'data-hero-copy="stage76"',
  'data-first-principles-path="stage68"',
  'data-homepage-redesign="stage76"',
  'header -> hero visual -> hero statement -> decision contract',
  'homepage redesign changed an existing id or internal #anchor contract',
  'style.css?v=20260813-stage75-first-principles'
]) if (!optimizer.includes(token)) errors.push(`production homepage compositor missing hierarchy/anchor guard: ${token}`);

const ecosystem = JSON.parse(await readFile('ecosystem.json', 'utf8'));
if (ecosystem?.canonicalConsultation?.bookingUrl !== booking) errors.push('ecosystem.json: canonical consultation URL drifted');
if (ecosystem?.canonicalConsultation?.durationMinutes !== 15) errors.push('ecosystem.json: canonical consultation duration must remain 15 minutes');

if (errors.length) {
  console.error('Stage66/73/76 homepage parity audit failed:');
  for (const error of errors) console.error(' - ' + error);
  process.exit(1);
}
console.log('Stage66/73/76 passed: EN/HU/DE pain-point paths, consultation, Vienna address, clean footer, hero statement-first production order and homepage anchor preservation remain in parity.');
