import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '_site');
const bannedProfessional = [
  'https://www.saatchiart.com/norbertbanhalmi',
  'https://www.tiktok.com/@banhalmi.norbert',
  'https://x.com/norbertbanhalmi',
  'https://www.linkedin.com/in/norbertbanhalmi/',
  'https://www.instagram.com/norbert.banhalmi/',
  'https://www.facebook.com/banhalmi.norbert'
];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const failures = [];
for (const file of walk(root).filter((file) => file.endsWith('.html'))) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('class="site-footer"')) continue;

  const social = (html.match(/<details class="footer-accordion" data-social-footer="">[\s\S]*?<\/details>/) || [''])[0];
  if (!social.includes('https://www.linkedin.com/company/banhalmi/')) failures.push(rel + ': company LinkedIn missing from professional footer');
  if (!social.includes('https://cherrydeck.com/norbert.banhalmi')) failures.push(rel + ': Cherrydeck missing from professional footer');
  for (const token of bannedProfessional) if (social.includes(token)) failures.push(rel + ': retired/person-owned social remains in professional footer: ' + token);

  const hu = rel.startsWith('hu/');
  const expectedRaw = hu ? '+4367761655592' : '+4367764733262';
  const expectedDisplay = hu ? '+43 677 616 55592' : '+43 677 647 332 62';
  const footer = html.slice(html.indexOf('<footer class="site-footer">'));
  if (!footer.includes('tel:' + expectedRaw) || !footer.includes(expectedDisplay)) failures.push(rel + ': locale telephone contract mismatch');
  if (!footer.includes('https://wa.me/4367761655592') || !footer.includes('WhatsApp +43 677 616 55592')) failures.push(rel + ': WhatsApp contract mismatch');
}

const entity = JSON.parse(fs.readFileSync(path.join(root, 'entity.jsonld'), 'utf8'));
const graph = entity['@graph'] || [];
const person = graph.find((n) => n['@type'] === 'Person' && n['@id'] === 'https://www.norbertbanhalmi.com/about/');
const org = graph.find((n) => n['@type'] === 'Organization' && n['@id'] === 'https://www.norbertbanhalmi.com/#organization');
const personSameAs = Array.isArray(person?.sameAs) ? person.sameAs : [];
const orgSameAs = Array.isArray(org?.sameAs) ? org.sameAs : [];
for (const token of bannedProfessional) if (personSameAs.includes(token)) failures.push('entity.jsonld: professional Person sameAs still owns ' + token);
for (const token of ['https://www.linkedin.com/company/banhalmi/','https://cherrydeck.com/norbert.banhalmi']) if (!orgSameAs.includes(token)) failures.push('entity.jsonld: Organization sameAs missing ' + token);

if (failures.length) {
  console.error('Authority artifact contract failed:\n' + failures.join('\n'));
  process.exit(1);
}
console.log('Authority artifact contract OK.');
