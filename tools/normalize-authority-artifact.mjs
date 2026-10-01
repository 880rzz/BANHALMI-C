import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '_site');
const professionalLinks = '<li><a href="https://www.linkedin.com/company/banhalmi/" rel="me noopener noreferrer" target="_blank">LinkedIn — BANHALMI</a></li><li><a href="https://cherrydeck.com/norbert.banhalmi" rel="me noopener noreferrer" target="_blank">Cherrydeck</a></li>';

function locale(rel) {
  if (rel.startsWith('hu/')) return 'hu';
  if (rel.startsWith('de-at/')) return 'de';
  return 'en';
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let changed = 0;
for (const file of walk(root).filter((file) => file.endsWith('.html'))) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  html = html.replace(/<li><a href="https:\/\/www\.saatchiart\.com\/norbertbanhalmi"[^>]*>Saatchi Art<\/a><\/li>/g, '');
  html = html.replace(/(<details class="footer-accordion" data-social-footer=""><summary>[^<]+<\/summary><ul>)[\s\S]*?(<\/ul><\/details>)/g, '$1' + professionalLinks + '$2');

  const start = html.indexOf('<footer class="site-footer">');
  const end = start >= 0 ? html.indexOf('</footer>', start) : -1;
  if (start >= 0 && end >= 0) {
    let footer = html.slice(start, end + 9);
    const hu = locale(rel) === 'hu';
    const raw = hu ? '+4367761655592' : '+4367764733262';
    const display = hu ? '+43 677 616 55592' : '+43 677 647 332 62';
    footer = footer.replace(/href="tel:\+[0-9]+"/g, 'href="tel:' + raw + '"');
    footer = footer.replace(/\+43 677 (?:616 55592|647 332 62)/g, display);
    footer = footer.replace(/\+36 70 469 (?:8397|83 97)/g, display);
    footer = footer.replace(/href="https:\/\/wa\.me\/[0-9]+"/g, 'href="https://wa.me/4367761655592"');
    footer = footer.replace(/WhatsApp \+43 677 (?:616 55592|647 332 62)/g, 'WhatsApp +43 677 616 55592');
    html = html.slice(0, start) + footer + html.slice(end + 9);
  }

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed += 1;
  }
}

console.log('Authority artifact normalization complete: ' + changed + ' HTML files updated.');
