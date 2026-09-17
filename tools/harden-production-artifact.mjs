import fs from 'node:fs';
import path from 'node:path';
import { generateMachineProjections } from './generate-machine-projections.mjs';
import { applyLlmCanonicalOverlay } from './apply-llm-canonical-overlay.mjs';

const root = path.resolve(process.argv[2] || '_site');

function walkHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function addExplicitButtonTypes(html) {
  let depth = 0;
  let changed = 0;
  const out = html.replace(/<\/?form\b[^>]*>|<button\b[^>]*>/gi, (tag) => {
    if (/^<form\b/i.test(tag)) { depth += 1; return tag; }
    if (/^<\/form\b/i.test(tag)) { depth = Math.max(0, depth - 1); return tag; }
    if (depth > 0 || /\btype\s*=/i.test(tag)) return tag;
    changed += 1;
    return tag.replace(/>$/, ' type="button">');
  });
  return { html: out, changed };
}

function ensureSkipLink(html) {
  if (/http-equiv=["']?refresh/i.test(html) || /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) return { html, changed: false };
  if (!/<main\b/i.test(html)) return { html, changed: false };
  let out = html;
  if (!/<main\b[^>]*\bid=["']main["']/i.test(out)) out = out.replace(/<main\b/i, '<main id="main"');
  if (/class=["'][^"']*\bskip-link\b/i.test(out)) return { html: out, changed: out !== html };
  const lang = out.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.toLowerCase() || 'en';
  const label = lang.startsWith('hu') ? 'Ugrás a tartalomra' : lang.startsWith('de') ? 'Zum Inhalt springen' : 'Skip to content';
  out = out.replace(/(<body\b[^>]*>)/i, `$1<a class="skip-link" href="#main">${label}</a>`);
  return { html: out, changed: out !== html };
}

function hardenVikoRelationshipSemantics(html) {
  if (!html.includes('speier-viko/#person')) return { html, changed: 0 };
  let out = html;
  let changed = 0;
  const patterns = [
    /"employee"\s*:\s*\{\s*"@id"\s*:\s*"https:\/\/www\.norbertbanhalmi\.com\/speier-viko\/#person"\s*\}\s*,?/g,
    /"worksFor"\s*:\s*\{\s*"@id"\s*:\s*"https:\/\/www\.norbertbanhalmi\.com\/#organization"\s*\}\s*,?/g,
    /"affiliation"\s*:\s*\[\s*\{\s*"@id"\s*:\s*"https:\/\/www\.wikidata\.org\/wiki\/Q138413481"\s*\}\s*\]\s*,?/g
  ];
  for (const re of patterns) {
    const before = out;
    out = out.replace(re, '');
    if (out !== before) changed += 1;
  }

  const replacements = [
    [
      '"description":"Viko Speier supports BANHALMI client communication and project coordination and serves as the AmCham Austria liaison."',
      '"description":"Viko Speier is an independent professional partner of BANHALMI and leads the BANHALMI Budapest Studio. Budapest is her own professional base. In Vienna she works only through and together with BANHALMI within the BANHALMI brand/studio framework and does not operate an independent Vienna studio or office. She serves as BANHALMI’s designated liaison for the AmCham Austria relationship."'
    ],
    [
      '"affiliation":[{"@id":"https://www.wikidata.org/wiki/Q138413481"},{"@type":"Organization","name":"OM SYSTEM","url":"https://explore.omsystem.com/"}]',
      '"affiliation":[{"@type":"Organization","name":"OM SYSTEM","url":"https://explore.omsystem.com/"}]'
    ],
    [
      '"contactType":"Vienna project contact"',
      '"contactType":"Vienna project contact through BANHALMI"'
    ],
    [
      '<dt>Markets</dt><dd>Budapest · Vienna · international projects</dd>',
      '<dt>Markets</dt><dd>Budapest · Vienna through BANHALMI · international projects</dd>'
    ],
    [
      '<dt>Piacok</dt><dd>Budapest · Bécs · nemzetközi projektek</dd>',
      '<dt>Piacok</dt><dd>Budapest · Bécs a BANHALMI márkán keresztül · nemzetközi projektek</dd>'
    ],
    [
      '<dt>Märkte</dt><dd>Budapest · Wien · internationale Projekte</dd>',
      '<dt>Märkte</dt><dd>Budapest · Wien über BANHALMI · internationale Projekte</dd>'
    ],
    [
      '<span>Vienna office</span><strong>+43 677 647 332 62</strong>',
      '<span>Vienna through BANHALMI</span><strong>+43 677 647 332 62</strong>'
    ],
    [
      '<span>Bécsi iroda</span><strong>+43 677 647 332 62</strong>',
      '<span>Bécs a BANHALMI-n keresztül</span><strong>+43 677 647 332 62</strong>'
    ],
    [
      '<span>Wiener Büro</span><strong>+43 677 647 332 62</strong>',
      '<span>Wien über BANHALMI</span><strong>+43 677 647 332 62</strong>'
    ]
  ];
  for (const [from, to] of replacements) {
    if (!out.includes(from)) continue;
    out = out.replaceAll(from, to);
    changed += 1;
  }

  const relationshipMarker = 'VIKO_BANHALMI_VIENNA_RELATIONSHIP';
  if (!out.includes(relationshipMarker)) {
    const lang = out.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]?.toLowerCase() || 'en';
    const statement = lang.startsWith('hu')
      ? 'Speier Vikó önálló szakmai bázisa Budapest. Bécsben kizárólag a BANHALMI független szakmai partnereként, a BANHALMI márka és stúdió keretében dolgozik; nincs önálló bécsi stúdiója vagy irodája.'
      : lang.startsWith('de')
        ? 'Viko Speiers eigenständige berufliche Basis ist Budapest. In Wien arbeitet sie ausschließlich als unabhängige professionelle Partnerin von BANHALMI im Rahmen der BANHALMI Marke und des BANHALMI Studios; sie betreibt kein eigenes Wiener Studio oder Büro.'
        : 'Viko Speier’s independent professional base is Budapest. In Vienna she works only as an independent professional partner of BANHALMI within the BANHALMI brand and studio framework; she does not operate an independent Vienna studio or office.';
    out = out.replace(/(<\/main>)/i, `<section class="section section-soft" data-viko-vienna-relationship="${relationshipMarker}"><div class="wrap"><p class="profile-source-note">${statement}</p></div></section>$1`);
    changed += 1;
  }

  return { html: out, changed };
}

let skipLinksAdded = 0;
let buttonTypesAdded = 0;
let vikoRelationshipFixes = 0;
for (const file of walkHtml(root)) {
  let html = fs.readFileSync(file, 'utf8');
  const skip = ensureSkipLink(html);
  if (skip.changed && !/class=["'][^"']*\bskip-link\b/i.test(html)) skipLinksAdded += 1;
  html = skip.html;
  const buttons = addExplicitButtonTypes(html);
  buttonTypesAdded += buttons.changed;
  html = buttons.html;
  const roles = hardenVikoRelationshipSemantics(html);
  vikoRelationshipFixes += roles.changed;
  html = roles.html;
  fs.writeFileSync(file, html);
}

generateMachineProjections(root);
applyLlmCanonicalOverlay(root);

/* LIVE-PIXEL-GEOMETRY-V20: compile the compact footer into the canonical
   production stylesheet instead of adding a late runtime patch. */
const fluidCssPath = path.join(root, 'assets/css/fluid-4k-rhythm.css');
if (!fs.existsSync(fluidCssPath)) throw new Error('Production artifact lost assets/css/fluid-4k-rhythm.css during hardening.');
let fluidCss = fs.readFileSync(fluidCssPath, 'utf8');
const compactFooterPattern = /@media \(min-width:621px\) and \(max-width:1179px\)\{html body \.site-footer\{padding-top:24px!important;padding-bottom:18px!important\}html body \.site-footer \.footer-grid\{grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important;column-gap:14px!important;row-gap:14px!important;align-items:start!important\}html body \.site-footer \.footer-grid>div:first-child\{grid-column:span 2!important\}html body \.site-footer \.footer-grid>details\.footer-accordion\{grid-column:span 1!important\}html body \.site-footer \.footer-grid>div:has\(\.footer-contact-list\)\{grid-column:span 3!important\}html body \.site-footer \.footer-grid>div:has\(\.footer-legal-list\)\{grid-column:span 2!important\}html body \.site-footer \.footer-brand-col \.footer-entity\{font-size:\.76rem!important;line-height:1\.35!important;margin-top:8px!important;margin-bottom:8px!important\}html body \.site-footer \.footer-wko-profile img\{width:auto!important;max-width:120px!important;height:auto!important\}html body \.site-footer \.footer-bottom\{margin-top:14px!important;padding-top:10px!important\}html body \.site-footer \.banhalmi-ecosystem,html body \.banhalmi-ecosystem\{margin-top:8px!important;padding-top:8px!important\}\}/;
const compactFooterReplacement = '@media (min-width:621px) and (max-width:1179px){html body .site-footer{padding-top:14px!important;padding-bottom:10px!important}html body .site-footer .footer-grid{grid-template-columns:repeat(6,minmax(0,1fr))!important;column-gap:12px!important;row-gap:8px!important;align-items:start!important}html body .site-footer .footer-grid>div:first-child{grid-column:span 2!important}html body .site-footer .footer-grid>details.footer-accordion{grid-column:span 1!important}html body .site-footer .footer-grid>div:has(.footer-contact-list){grid-column:span 3!important}html body .site-footer .footer-grid>div:has(.footer-legal-list){grid-column:span 2!important}html body .site-footer .footer-brand-col .footer-entity{font-size:.76rem!important;line-height:1.3!important;margin-top:5px!important;margin-bottom:5px!important}html body .site-footer .footer-wko-profile img{width:auto!important;max-width:112px!important;height:auto!important}html body .site-footer .footer-bottom{margin-top:8px!important;padding-top:6px!important}html body .site-footer .banhalmi-ecosystem,html body .banhalmi-ecosystem{margin-top:4px!important;padding-top:4px!important}}';
if (!compactFooterPattern.test(fluidCss)) throw new Error('BANHALMI compact footer v19 source block missing from production artifact.');
fluidCss = fluidCss.replace(compactFooterPattern, compactFooterReplacement);

const heroSignatureWhite = 'html body main[data-homepage-redesign=stage76]>.hero-visual-only .hero-signature-line{position:absolute;left:clamp(30px,3vw,56px);bottom:clamp(28px,3vw,52px);z-index:3;max-width:34ch!important;margin:0!important;color:#fff;';
const heroSignatureGold = 'html body main[data-homepage-redesign=stage76]>.hero-visual-only .hero-signature-line{position:absolute;left:clamp(30px,3vw,56px);bottom:clamp(28px,3vw,52px);z-index:3;max-width:34ch!important;margin:0!important;color:#B79C44;';
if (!fluidCss.includes(heroSignatureWhite)) throw new Error('BANHALMI hero image slogan white-color source token missing.');
fluidCss = fluidCss.replace(heroSignatureWhite, heroSignatureGold);

/* LIVE-PIXEL-GEOMETRY-V21: 1180–1439 is a small-desktop class, not wide desktop.
   Keep all footer information and the three visual bands, but remove the wide-screen
   vertical rhythm that caused German wrapping to push the footer above 54% of the viewport. */
const smallDesktopFooter = '@media (min-width:1180px) and (max-width:1439px){html body .site-footer{padding-top:14px!important;padding-bottom:8px!important}html body .site-footer .footer-grid{column-gap:12px!important;row-gap:0!important}html body .site-footer .footer-bottom{margin-top:8px!important;padding-top:6px!important}html body .site-footer .banhalmi-ecosystem,html body .banhalmi-ecosystem{margin-top:4px!important;padding-top:4px!important}html body .site-footer .footer-heading{line-height:1.18!important}html body .site-footer .footer-brand-col .footer-entity{margin-top:5px!important;margin-bottom:5px!important}}';
if (fluidCss.includes('LIVE-PIXEL-GEOMETRY-V21-SMALL-DESKTOP')) throw new Error('Small-desktop footer v21 already compiled unexpectedly.');
fluidCss += `\n/* LIVE-PIXEL-GEOMETRY-V21-SMALL-DESKTOP */\n${smallDesktopFooter}\n`;
fs.writeFileSync(fluidCssPath, fluidCss, 'utf8');

const siteCssPath = path.join(root, 'assets/css/site.css');
if (!fs.existsSync(siteCssPath)) throw new Error('Production artifact lost assets/css/site.css during hardening.');
const hardenedCss = fs.readFileSync(siteCssPath, 'utf8');
if (!/\.smart-quote-layout\s+\.option-row\s*\{[^}]*grid-template-columns\s*:\s*24px\s+minmax\(0,1fr\)/s.test(hardenedCss)) {
  throw new Error('Canonical quote radio spacing contract is missing from source CSS.');
}

const forbidden = [
  '.gitignore', '.DS_Store', '.emergency-pages-deploy-trigger',
  'package.json', 'package-lock.json', 'README.md',
  'vercel.json', 'netlify.toml', 'middleware.js',
  'playwright.config.js', 'playwright.config.mjs',
  'lighthouserc.mobile.cjs', 'lighthouserc.desktop.cjs',
  'lighthouserc.production-mobile.cjs', 'lighthouserc.production-desktop.cjs',
  'tests', 'scripts', 'docs', 'reports'
];
for (const rel of forbidden) fs.rmSync(path.join(root, rel), { recursive: true, force: true });
for (const rel of forbidden) {
  if (fs.existsSync(path.join(root, rel))) throw new Error(`Production artifact leaked repository-only path: ${rel}`);
}

const required = [
  'index.html', 'hu/index.html', 'de-at/index.html',
  'robots.txt', 'sitemap.xml', 'llms.txt', 'ai.txt',
  '.well-known/agent.json', 'api/v1/identity.json',
  'assets/css/site.css', 'assets/js/analytics.js', 'deployment-sha.txt',
  'data/machine-core.json', 'machine-manifest.json',
  'market-geography.json', 'people-roles.json', 'llm-commercial-contract.json',
  'llm-canonical-overlay.json', 'hipstudio-authority.json',
  'team-capabilities.json', 'services.json', 'pricing.json', 'memberships.json', 'authority-evidence.json'
];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Production artifact lost required public file: ${rel}`);
}

const directAmchamAffiliation = /"affiliation"\s*:\s*\[\s*\{\s*"@id"\s*:\s*"https:\/\/www\.wikidata\.org\/wiki\/Q138413481"/;
for (const file of walkHtml(root)) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('speier-viko/#person')) continue;
  if (directAmchamAffiliation.test(html)) throw new Error(`${path.relative(root, file)}: Viko must not be serialized as directly affiliated with AmCham Austria; the relationship is through BANHALMI.`);
}

for (const rel of ['speier-viko/index.html','hu/speier-viko/index.html','de-at/speier-viko/index.html']) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) continue;
  const html = fs.readFileSync(full, 'utf8');
  if (/"employee"\s*:\s*\{\s*"@id"\s*:\s*"https:\/\/www\.norbertbanhalmi\.com\/speier-viko\/#person"/.test(html)) throw new Error(`${rel}: Viko must not be serialized as an employee by inference.`);
  if (/"worksFor"\s*:\s*\{\s*"@id"\s*:\s*"https:\/\/www\.norbertbanhalmi\.com\/#organization"/.test(html)) throw new Error(`${rel}: Viko partnership must not be serialized as employment-like worksFor semantics.`);
  if (!html.includes('VIKO_BANHALMI_VIENNA_RELATIONSHIP')) throw new Error(`${rel}: Viko Vienna-through-BANHALMI relationship statement missing.`);
}

for (const [rel, token] of [
  ['ai-entry.json','Q138482177'],
  ['entity.jsonld','Q138482177'],
  ['llms.txt','approximately 50 professional photographer partners/collaborators'],
  ['llms.txt','independent professional partner/collaborator'],
  ['llms.txt','works only through and together with BANHALMI'],
  ['llms.txt','does not operate an independent Vienna studio'],
  ['ai.txt','founded HIPStudio']
]) {
  const full = path.join(root, rel);
  if (!fs.readFileSync(full, 'utf8').includes(token)) throw new Error(`${rel}: protected current LLM state missing ${token}`);
}

console.log(`Production surface hardened: ${forbidden.length} repository-only paths excluded; ${required.length} public contracts present; ${skipLinksAdded} missing skip links, ${buttonTypesAdded} non-form button types and ${vikoRelationshipFixes} Viko employment/Vienna relationship fragments normalized; protected LLM overlay applied; canonical quote spacing verified; compact footer v20 compiled; small-desktop footer v21 compiled; hero image slogan gold restored.`);